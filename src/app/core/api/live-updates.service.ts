import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EMPTY, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { CurrentUserService, UserRole } from '../session/current-user.service';

// Eventos que a API manda (SSE): as candidaturas mudaram; chegou mensagem numa conversa;
// alguma conversa do perfil mudou (lista e contador do menu).
const APPLICATIONS_CHANGED_EVENT = 'applications';
const CHAT_CHANGED_EVENT = 'chat';
const CHATS_CHANGED_EVENT = 'chats';

// Avisos em tempo real da API (Server-Sent Events): cada emissão diz "mudou, busque de novo".
// O aviso não traz dados; a tela recarrega pela rota de sempre. A conexão fica aberta enquanto
// houver inscrição e fecha no unsubscribe (use com takeUntilDestroyed).
@Injectable({ providedIn: 'root' })
export class LiveUpdatesService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly currentUser = inject(CurrentUserService);

  // Alguém se candidatou, desistiu, foi aceito/recusado; ou o serviço mudou de status.
  serviceApplications(serviceId: number): Observable<void> {
    return this.listen(`${environment.apiUrl}/farmers/services/${serviceId}/events`, APPLICATIONS_CHANGED_EVENT);
  }

  // O status de alguma candidatura do trabalhador mudou.
  workerApplications(workerId: number): Observable<void> {
    return this.listen(`${environment.apiUrl}/workers/${workerId}/events`, APPLICATIONS_CHANGED_EVENT);
  }

  // Chegou mensagem na conversa (ou alguém liberou o WhatsApp).
  chat(chatId: number): Observable<void> {
    return this.listen(`${environment.apiUrl}/chats/${chatId}/events`, CHAT_CHANGED_EVENT);
  }

  // Alguma conversa do perfil mudou: mensagem nova, lida, aberta ou encerrada.
  chats(role: UserRole, profileId: number): Observable<void> {
    const area = role === 'farmer' ? 'farmers' : 'workers';
    return this.listen(`${environment.apiUrl}/${area}/${profileId}/chats/events`, CHATS_CHANGED_EVENT);
  }

  private listen(url: string, event: string): Observable<void> {
    // No servidor (SSR) não há conexão a manter.
    if (!this.isBrowser || typeof EventSource === 'undefined') return EMPTY;

    // O EventSource não envia cabeçalhos: o token vai na query (a API aceita só nestas rotas).
    const token = this.currentUser.token();
    const withToken = token ? `${url}?access_token=${encodeURIComponent(token)}` : url;

    return new Observable<void>((subscriber) => {
      const source = new EventSource(withToken);
      let connected = false;

      source.addEventListener(event, () => subscriber.next());
      // O EventSource reconecta sozinho se a conexão cair; o que mudou nesse meio-tempo
      // não chega como evento, então cada reconexão também avisa.
      source.addEventListener('open', () => {
        if (connected) subscriber.next();
        connected = true;
      });

      return () => source.close();
    });
  }
}
