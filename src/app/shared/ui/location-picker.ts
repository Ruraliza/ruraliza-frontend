import { Component, afterNextRender, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { GoogleMap, MapAdvancedMarker } from '@angular/google-maps';
import { GoogleMapsLoader } from '../../core/maps/google-maps-loader.service';
import { ToastService } from '../../core/toast/toast.service';
import { AddressSuggestion, GeoPoint, formatPoint, parseGeocoderResult } from '../utils/geocoding';
import { Button } from './button';
import { Icon } from './icon';
import { Skeleton } from './skeleton';

// Sem ponto marcado: Brasil inteiro. Com ponto: perto o bastante para ver a porteira.
const BRAZIL_CENTER: google.maps.LatLngLiteral = { lat: -14.235, lng: -51.925 };
const BRAZIL_ZOOM = 4;
const POINT_ZOOM = 16;

const GEOLOCATION_ERRORS: Record<number, string> = {
  1: 'Permita o acesso à localização no navegador para usar este botão.',
  2: 'Não foi possível descobrir sua localização. Marque o ponto no mapa.',
  3: 'A localização demorou demais. Tente de novo ou marque o ponto no mapa.'
};

// Escolha do local da fazenda: tocar no mapa, arrastar o alfinete ou usar a localização do aparelho.
// Cada ponto escolhido gera uma sugestão de endereço (geocoding reverso do Google).
// Uso dentro de <app-form-field>: o campo de coordenadas (só leitura) é o controle ligado ao rótulo.
@Component({
  selector: 'app-location-picker',
  imports: [GoogleMap, MapAdvancedMarker, Button, Icon, Skeleton],
  styleUrl: './location-picker.css',
  template: `
    <div class="toolbar">
      <input class="coords" readonly [value]="pointText()" placeholder="Nenhum ponto marcado">
      <button appButton variant="secondary" type="button" [loading]="locating()" (click)="useMyLocation()">
        <app-icon name="crosshair" [size]="20" />
        Usar minha localização
      </button>
    </div>

    @if (loader.failed()) {
      <div class="unavailable" role="status">
        <p>Mapa indisponível no momento. Você ainda pode usar sua localização atual.</p>
        <button appButton variant="ghost" type="button" (click)="loadMap()">Tentar de novo</button>
      </div>
    } @else if (loader.config(); as config) {
      <div class="map" [class.map--invalid]="invalid()">
        <google-map
          height="100%"
          width="100%"
          [mapId]="config.map_id"
          [center]="center()"
          [zoom]="zoom()"
          [options]="options"
          (mapClick)="pick($event.latLng)"
        >
          @if (marker(); as position) {
            <map-advanced-marker
              title="Local da fazenda"
              [position]="position"
              [gmpDraggable]="true"
              (mapDragend)="pick($event.latLng)"
            />
          }
        </google-map>
      </div>
    } @else {
      <app-skeleton [count]="1" [height]="320" />
    }
  `
})
export class LocationPicker {
  readonly value = input<GeoPoint | null>(null);
  readonly invalid = input(false);
  readonly valueChange = output<GeoPoint>();
  readonly addressSuggested = output<AddressSuggestion>();

  protected readonly loader = inject(GoogleMapsLoader);
  private readonly toast = inject(ToastService);

  // Centro e zoom acompanham o primeiro ponto (o salvo, na edição, ou o primeiro toque, que aproxima
  // o mapa a partir do Brasil inteiro) e a localização atual. Ajustes finos não fazem o mapa pular.
  private readonly focus = linkedSignal<GeoPoint | null, GeoPoint | null>({
    source: this.value,
    computation: (value, previous) => previous?.value ?? value
  });
  readonly center = computed<google.maps.LatLngLiteral>(() => {
    const point = this.focus();
    return point ? { lat: point.latitude, lng: point.longitude } : BRAZIL_CENTER;
  });
  readonly zoom = computed(() => (this.focus() ? POINT_ZOOM : BRAZIL_ZOOM));

  readonly marker = computed<google.maps.LatLngLiteral | null>(() => {
    const point = this.value();
    return point ? { lat: point.latitude, lng: point.longitude } : null;
  });
  readonly pointText = computed(() => {
    const point = this.value();
    return point ? formatPoint(point) : '';
  });

  readonly locating = signal(false);
  readonly options: google.maps.MapOptions = {
    mapTypeId: 'hybrid', // satélite com nomes de estradas: ajuda a achar a fazenda
    clickableIcons: false,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: 'cooperative'
  };

  constructor() {
    afterNextRender(() => this.loadMap());
  }

  loadMap(): void {
    this.loader.load().catch(() => undefined); // a falha aparece via loader.failed()
  }

  pick(latLng: google.maps.LatLng | null): void {
    if (!latLng) return;
    this.select({ latitude: round(latLng.lat()), longitude: round(latLng.lng()) });
  }

  useMyLocation(): void {
    if (!('geolocation' in navigator)) {
      this.toast.error('Este navegador não informa a localização. Marque o ponto no mapa.');
      return;
    }
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.locating.set(false);
        const point = { latitude: round(coords.latitude), longitude: round(coords.longitude) };
        this.focus.set(point);
        this.select(point);
      },
      (error) => {
        this.locating.set(false);
        this.toast.error(GEOLOCATION_ERRORS[error.code] ?? GEOLOCATION_ERRORS[2]);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  private select(point: GeoPoint): void {
    this.valueChange.emit(point);
    void this.suggestAddress(point);
  }

  // Sem sugestão (Geocoding API desligada, ponto no meio do mato): o produtor digita o endereço.
  private async suggestAddress(point: GeoPoint): Promise<void> {
    if (typeof google === 'undefined' || !google.maps.Geocoder) return;
    try {
      const { results } = await new google.maps.Geocoder().geocode({ location: { lat: point.latitude, lng: point.longitude } });
      if (results[0]) this.addressSuggested.emit(parseGeocoderResult(results[0]));
    } catch {
      // Sem resultado: segue sem sugestão.
    }
  }
}

// 6 casas decimais ≈ 10 cm: precisão de sobra, sem números enormes na API.
function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
