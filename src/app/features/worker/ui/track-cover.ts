import { Component, computed, input } from '@angular/core';
import { FarmEmoji } from '@shared/domain/ui/farm-emoji';
import { categoryEmoji } from '@shared/domain/utils/farm-emoji';

// Cor da capa pela primeira categoria da trilha (os tons claros do tema; no escuro, as versões escuras).
const TONE: Record<string, string> = {
  Colheita: 'broto',
  Plantio: 'success',
  'Operação de máquinas': 'ipe',
  Pulverização: 'info',
  'Manejo de gado': 'ipe',
  Manutenção: 'sunken',
  Outros: 'broto'
};

// Capa de trilha: as curvas de nível de uma lavoura, desenhadas, e os emojis das categorias. Dá cara a
// cada trilha sem depender de foto (o tutor não precisa enviar imagem). Decorativa.
@Component({
  selector: 'app-track-cover',
  imports: [FarmEmoji],
  host: { 'aria-hidden': 'true', '[attr.data-tone]': 'tone()', '[class.tall]': 'tall()' },
  template: `
    <svg class="rows" viewBox="0 0 400 120" preserveAspectRatio="none" focusable="false">
      <path d="M-10 118 C 90 84 210 80 410 108 M-10 92 C 90 58 210 54 410 82 M-10 66 C 90 32 210 28 410 56 M-10 40 C 90 6 210 2 410 30" />
    </svg>
    <span class="emojis">
      @for (emoji of emojis(); track emoji) { <app-farm-emoji [emoji]="emoji" [size]="tall() ? 72 : 48" /> }
    </span>
  `,
  styles: `
    :host {
      --tone-bg: var(--broto-soft); --tone-line: var(--broto);
      position: relative; display: grid; place-items: center; overflow: hidden;
      aspect-ratio: 16 / 5; background: var(--tone-bg);
    }
    :host(.tall) { aspect-ratio: auto; min-height: 168px; border-radius: var(--radius-lg); }
    :host([data-tone='success']) { --tone-bg: var(--success-soft); --tone-line: var(--success); }
    :host([data-tone='ipe']) { --tone-bg: var(--ipe-soft); --tone-line: var(--ipe); }
    :host([data-tone='info']) { --tone-bg: var(--info-soft); --tone-line: var(--info); }
    :host([data-tone='sunken']) { --tone-bg: var(--surface-sunken); --tone-line: var(--line-strong); }
    .rows { position: absolute; inset: 0; width: 100%; height: 100%; }
    .rows path { fill: none; stroke: var(--tone-line); stroke-width: 2; opacity: .35; vector-effect: non-scaling-stroke; }
    .emojis { position: relative; display: flex; gap: var(--space-2); filter: drop-shadow(0 2px 2px rgb(0 0 0 / .12)); }
  `
})
export class TrackCover {
  readonly categories = input.required<readonly string[]>();
  readonly tall = input(false);

  readonly tone = computed(() => TONE[this.categories()[0] ?? ''] ?? 'broto');
  readonly emojis = computed(() => [...new Set(this.categories().slice(0, 2).map(categoryEmoji))]);
}
