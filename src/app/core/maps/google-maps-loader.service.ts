import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpContext } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '@env/environment';
import { MapsConfig } from '../models/config.model';
import { SILENT_ERRORS } from '../http/error.interceptor';

const SCRIPT_ID = 'google-maps-sdk';
const CALLBACK = '__ruralizaMapsReady'; // nome global do callback que o SDK chama ao terminar

// Carrega o SDK do Google Maps uma vez, com a chave vinda do backend (GET /config/maps, que lê o .env).
// Só no navegador: no servidor (SSR) o mapa nunca é renderizado.
// `fetchConfig()` só busca a chave (para o iframe gratuito da Maps Embed API, sem SDK).
@Injectable({ providedIn: 'root' })
export class GoogleMapsLoader {
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private loading: Promise<MapsConfig> | null = null;
  private configRequest: Promise<MapsConfig> | null = null;

  readonly config = signal<MapsConfig | null>(null);
  readonly failed = signal(false);

  load(): Promise<MapsConfig> {
    if (!this.isBrowser) return Promise.reject(new Error('Google Maps só carrega no navegador.'));
    this.loading ??= this.fetchAndInject().then(
      (config) => {
        this.config.set(config);
        this.failed.set(false);
        return config;
      },
      (error: unknown) => {
        this.loading = null; // permite tentar de novo
        this.failed.set(true);
        throw error;
      }
    );
    return this.loading;
  }

  // Chave e Map ID, buscados uma vez por sessão (uma falha permite tentar de novo). Sem toast: quem usa o
  // mapa já mostra a alternativa (o link "Abrir no Google Maps" ou o aviso "Mapa indisponível").
  fetchConfig(): Promise<MapsConfig> {
    const context = new HttpContext().set(SILENT_ERRORS, true);
    this.configRequest ??= firstValueFrom(this.http.get<MapsConfig>(`${environment.apiUrl}/config/maps`, { context })).catch(
      (error: unknown) => {
        this.configRequest = null;
        throw error;
      }
    );
    return this.configRequest;
  }

  private async fetchAndInject(): Promise<MapsConfig> {
    const config = await this.fetchConfig();
    if (typeof google === 'undefined' || !google.maps) await this.injectScript(config.api_key);
    return config;
  }

  private injectScript(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      document.getElementById(SCRIPT_ID)?.remove(); // tentativa anterior que falhou
      const params = new URLSearchParams({
        key: apiKey,
        loading: 'async',
        libraries: 'marker,geocoding',
        language: 'pt-BR',
        region: 'BR',
        callback: CALLBACK
      });
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      script.onerror = () => reject(new Error('Não foi possível carregar o Google Maps.'));
      (window as unknown as Record<string, () => void>)[CALLBACK] = () => resolve();
      document.head.appendChild(script);
    });
  }
}
