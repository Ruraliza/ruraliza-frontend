import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { EMPTY, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Evento que a API manda (SSE) quando as candidaturas mudam.
const APPLICATIONS_CHANGED_EVENT = 'applications';

// Avisos em tempo real da API (Server-Sent Events): cada emissão diz "mudou, busque de novo".
// O aviso não traz dados; a tela recarrega pela rota de sempre. A conexão fica aberta enquanto
// houver inscrição e fecha no unsubscribe (use com takeUntilDestroyed).
@Injectable({ providedIn: 'root' })
export class LiveUpdatesService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

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

    return new Observable<void>((subscriber) => {
      const source = new EventSource(url);
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
