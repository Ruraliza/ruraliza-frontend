import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EMPTY, Observable, OperatorFunction, filter, map, share } from 'rxjs';
import { environment } from '@env/environment';
import { CurrentUserService, UserRole } from '../session/current-user.service';

// Eventos que a API manda (SSE): as candidaturas mudaram; chegou mensagem numa conversa;
// alguma conversa do perfil mudou (lista e contador do menu); chegou aviso novo (sino).
const APPLICATIONS_CHANGED_EVENT = 'applications';
const CHAT_CHANGED_EVENT = 'chat';
const CHATS_CHANGED_EVENT = 'chats';
const NOTIFICATIONS_CHANGED_EVENT = 'notifications';
// A conexão caiu e voltou (ou a página voltou do cache): o que mudou nesse meio-tempo não chegou.
const RECONNECTED = 'reconnected';

const PROFILE_EVENTS: Record<UserRole, readonly string[]> = {
  farmer: [CHATS_CHANGED_EVENT, NOTIFICATIONS_CHANGED_EVENT],
  worker: [APPLICATIONS_CHANGED_EVENT, CHATS_CHANGED_EVENT, NOTIFICATIONS_CHANGED_EVENT]
};

// Só o evento pedido (e as reconexões), sem dados: "mudou, busque de novo".
function only(event: string): OperatorFunction<string, void> {
  return (source) => source.pipe(filter((name) => name === event || name === RECONNECTED), map(() => undefined));
}

// Avisos em tempo real da API (Server-Sent Events): cada emissão diz "mudou, busque de novo".
// O aviso não traz dados; a tela recarrega pela rota de sempre. A conexão fica aberta enquanto
// houver inscrição e fecha no unsubscribe (use com takeUntilDestroyed).
//
// O navegador abre no máximo 6 conexões por servidor em HTTP/1.1, então o que vale para a tela inteira
// (conversas do menu, sino e candidaturas do trabalhador) chega por UM stream do perfil, dividido entre
// quem escuta (`/farmers/:id/live`, `/workers/:id/live`). Só a conversa aberta e os candidatos de um
// serviço têm stream próprio. A página que vai para o cache de voltar/avançar fecha as conexões.
@Injectable({ providedIn: 'root' })
export class LiveUpdatesService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly currentUser = inject(CurrentUserService);
  private readonly profileStreams = new Map<string, Observable<string>>();

  // Alguém se candidatou, desistiu, foi aceito/recusado; ou o serviço mudou de status.
  serviceApplications(serviceId: number): Observable<void> {
    return this.stream(`${environment.apiUrl}/farmers/services/${serviceId}/events`, [APPLICATIONS_CHANGED_EVENT]).pipe(only(APPLICATIONS_CHANGED_EVENT));
  }

  // O status de alguma candidatura do trabalhador mudou.
  workerApplications(workerId: number): Observable<void> {
    return this.profile('worker', workerId).pipe(only(APPLICATIONS_CHANGED_EVENT));
  }

  // Chegou mensagem na conversa (ou alguém liberou o WhatsApp).
  chat(chatId: number): Observable<void> {
    return this.stream(`${environment.apiUrl}/chats/${chatId}/events`, [CHAT_CHANGED_EVENT]).pipe(only(CHAT_CHANGED_EVENT));
  }

  // Alguma conversa do perfil mudou: mensagem nova, lida, aberta ou encerrada.
  chats(role: UserRole, profileId: number): Observable<void> {
    return this.profile(role, profileId).pipe(only(CHATS_CHANGED_EVENT));
  }

  // Chegou aviso novo na central de notificações do perfil (ou algum foi lido).
  notifications(role: UserRole, profileId: number): Observable<void> {
    return this.profile(role, profileId).pipe(only(NOTIFICATIONS_CHANGED_EVENT));
  }

  // Um stream por perfil, dividido entre as inscrições; fecha quando a última sai.
  private profile(role: UserRole, profileId: number): Observable<string> {
    const key = `${role}:${profileId}`;
    let stream = this.profileStreams.get(key);
    if (!stream) {
      const area = role === 'farmer' ? 'farmers' : 'workers';
      stream = this.stream(`${environment.apiUrl}/${area}/${profileId}/live`, PROFILE_EVENTS[role]).pipe(share());
      this.profileStreams.set(key, stream);
    }
    return stream;
  }

  private stream(url: string, events: readonly string[]): Observable<string> {
    // No servidor (SSR) não há conexão a manter.
    if (!this.isBrowser || typeof EventSource === 'undefined') return EMPTY;

    return new Observable<string>((subscriber) => {
      let source: EventSource | null = null;
      let connected = false;

      const open = (): void => {
        // O EventSource não envia cabeçalhos: o token vai na query (a API aceita só nestas rotas).
        const token = this.currentUser.token();
        source = new EventSource(token ? `${url}?access_token=${encodeURIComponent(token)}` : url);
        for (const event of events) source.addEventListener(event, () => subscriber.next(event));
        // O EventSource reconecta sozinho se a conexão cair; o que mudou nesse meio-tempo
        // não chega como evento, então cada reconexão também avisa.
        source.addEventListener('open', () => {
          if (connected) subscriber.next(RECONNECTED);
          connected = true;
        });
      };
      const close = (): void => {
        source?.close();
        source = null;
      };
      // Cache de voltar/avançar: a página guardada não pode segurar conexões; na volta, reabre.
      const onPageHide = (): void => close();
      const onPageShow = (event: PageTransitionEvent): void => {
        if (event.persisted && !source) open();
      };

      open();
      window.addEventListener('pagehide', onPageHide);
      window.addEventListener('pageshow', onPageShow);
      return () => {
        close();
        window.removeEventListener('pagehide', onPageHide);
        window.removeEventListener('pageshow', onPageShow);
      };
    });
  }
}
