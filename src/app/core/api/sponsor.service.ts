import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { SILENT_ERRORS } from '../http/error.interceptor';
import { SponsorSlotResponse } from '../models/sponsor.model';

export interface SlotTarget {
  audience: 'farmer' | 'worker';
  state?: string | null;
  categories?: readonly string[];
}

// O cartão "Patrocinado" (público, sem login e sem dados de quem vê além da UF e dos interesses na URL).
// Erro aqui nunca vira aviso na tela: sem patrocínio, o cartão só não aparece.
@Injectable({ providedIn: 'root' })
export class SponsorService {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly apiUrl = `${environment.apiUrl}/sponsors`;

  slot({ audience, state, categories }: SlotTarget): Observable<SponsorSlotResponse> {
    let params = new HttpParams().set('audience', audience);
    if (state) params = params.set('state', state);
    if (categories?.length) params = params.set('categories', categories.join(','));
    return this.http.get<SponsorSlotResponse>(`${this.apiUrl}/slot`, { params, context: new HttpContext().set(SILENT_ERRORS, true) });
  }

  // Conta o clique sem atrasar a abertura do link (sendBeacon sobrevive à troca de página).
  click(id: number): void {
    if (!this.isBrowser) return;
    const url = `${this.apiUrl}/${id}/click`;
    if (!navigator.sendBeacon?.(url)) void fetch(url, { method: 'POST', keepalive: true }).catch(() => undefined);
  }
}
