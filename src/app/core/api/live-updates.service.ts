import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EMPTY, Observable } from 'rxjs';
import { environment } from '@env/environment';
import { CurrentUserService } from '../session/current-user.service';

// Evento que a API manda (SSE) quando as candidaturas mudam.
const APPLICATIONS_CHANGED_EVENT = 'applications';

// Avisos em tempo real da API (Server-Sent Events): cada emissão diz "mudou, busque de novo".
// O aviso não traz dados; a tela recarrega pela rota de sempre. A conexão fica aberta enquanto
// houver inscrição e fecha no unsubscribe (use com takeUntilDestroyed).
@Injectable({ providedIn: 'root' })
export class LiveUpdatesService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly currentUser = inject(CurrentUserService);

  // Alguém se candidatou, desistiu, foi aceito/recusado; ou o serviço mudou de status.
  serviceApplications(serviceId: number): Observable<void> {
    return this.listen(`${environment.apiUrl}/farmers/services/${serviceId}/events`);
  }

  // O status de alguma candidatura do trabalhador mudou.
  workerApplications(workerId: number): Observable<void> {
    return this.listen(`${environment.apiUrl}/workers/${workerId}/events`);
  }

  private listen(url: string): Observable<void> {
    // No servidor (SSR) não há conexão a manter.
    if (!this.isBrowser || typeof EventSource === 'undefined') return EMPTY;

    // O EventSource não envia cabeçalhos: o token vai na query (a API aceita só nestas rotas).
    const token = this.currentUser.token();
    const withToken = token ? `${url}?access_token=${encodeURIComponent(token)}` : url;

    return new Observable<void>((subscriber) => {
      const source = new EventSource(withToken);
      let connected = false;

      source.addEventListener(APPLICATIONS_CHANGED_EVENT, () => subscriber.next());
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
