import { Component, afterNextRender, computed, inject, input } from '@angular/core';
import { GoogleMap, MapAdvancedMarker } from '@angular/google-maps';
import { GoogleMapsLoader } from '../../core/maps/google-maps-loader.service';
import { GeoPoint, mapsLink } from '../utils/geocoding';
import { Icon } from './icon';

// Mapa só de leitura com o ponto da fazenda e o link para abrir no Google Maps (rotas no celular).
// Se o mapa não carregar, o link continua lá.
@Component({
  selector: 'app-farm-map',
  imports: [GoogleMap, MapAdvancedMarker, Icon],
  template: `
    @if (loader.config(); as config) {
      <div class="map">
        <google-map height="100%" width="100%" [mapId]="config.map_id" [center]="position()" [zoom]="15" [options]="options">
          <map-advanced-marker [title]="label()" [position]="position()" />
        </google-map>
      </div>
    }
    <a class="link" [href]="link()" target="_blank" rel="noopener">
      <app-icon name="map-pin" [size]="18" />
      Abrir no Google Maps
    </a>
  `,
  styles: `
    :host { display: grid; gap: var(--space-2); }
    .map { height: 220px; border: 1px solid var(--line); border-radius: var(--radius-md); overflow: hidden; }
    .link { display: inline-flex; align-items: center; gap: var(--space-1); font-weight: 600; }
  `
})
export class FarmMap {
  readonly point = input.required<GeoPoint>();
  readonly label = input('Local da fazenda');

  protected readonly loader = inject(GoogleMapsLoader);

  readonly position = computed<google.maps.LatLngLiteral>(() => ({ lat: this.point().latitude, lng: this.point().longitude }));
  readonly link = computed(() => mapsLink(this.point()));
  readonly options: google.maps.MapOptions = {
    mapTypeId: 'hybrid', // satélite com nomes de estradas: ajuda a achar a fazenda
    clickableIcons: false,
    streetViewControl: false,
    gestureHandling: 'cooperative'
  };

  constructor() {
    afterNextRender(() => this.loader.load().catch(() => undefined)); // sem mapa, fica só o link
  }
}
