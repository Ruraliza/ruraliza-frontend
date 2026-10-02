import { Component, afterNextRender, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GoogleMapsLoader } from '../../core/maps/google-maps-loader.service';
import { GeoPoint, embedUrl, mapsLink } from '../utils/geocoding';
import { Icon } from './icon';

// Mapa só de leitura com o ponto da fazenda e o link para abrir no Google Maps (rotas no celular).
// Usa o iframe da Maps Embed API, que é gratuito e ilimitado: estas telas não gastam a cota do Maps
// JavaScript (que fica só para o formulário da fazenda). Se a chave não vier, fica só o link.
@Component({
  selector: 'app-farm-map',
  imports: [Icon],
  template: `
    @if (src(); as url) {
      <iframe
        class="map"
        [src]="url"
        [title]="label()"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
      ></iframe>
    }
    <a class="link" [href]="link()" target="_blank" rel="noopener">
      <app-icon name="map-pin" [size]="18" />
      Abrir no Google Maps
    </a>
  `,
  styles: `
    :host { display: grid; gap: var(--space-2); }
    .map { width: 100%; height: 220px; border: 1px solid var(--line); border-radius: var(--radius-md); }
    .link { display: inline-flex; align-items: center; gap: var(--space-1); font-weight: 600; }
  `
})
export class FarmMap {
  readonly point = input.required<GeoPoint>();
  readonly label = input('Local da fazenda');

  private readonly loader = inject(GoogleMapsLoader);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly apiKey = signal<string | null>(null);

  readonly link = computed(() => mapsLink(this.point()));
  // URL montada por nós (chave do backend + coordenadas numéricas), por isso é marcada como confiável.
  readonly src = computed<SafeResourceUrl | null>(() => {
    const key = this.apiKey();
    return key ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl(key, this.point())) : null;
  });

  constructor() {
    afterNextRender(() => {
      this.loader.fetchConfig().then(
        (config) => this.apiKey.set(config.api_key),
        () => undefined // sem chave: fica só o link
      );
    });
  }
}
