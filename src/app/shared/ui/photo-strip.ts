import { Component, input } from '@angular/core';
import { apiAsset } from '../utils/images';

// Fotos da fazenda em faixa rolável (detalhe da vaga e do serviço).
@Component({
  selector: 'app-photo-strip',
  template: `
    <ul class="strip" role="list" [attr.aria-label]="label()">
      @for (url of urls(); track url; let i = $index) {
        <li><img [src]="src(url)" [alt]="label() + ', foto ' + (i + 1) + ' de ' + urls().length" loading="lazy" decoding="async" /></li>
      }
    </ul>
  `,
  styles: `
    .strip {
      display: grid; grid-auto-flow: column; grid-auto-columns: min(85%, 360px); gap: var(--space-3);
      overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: var(--space-2);
    }
    li { scroll-snap-align: start; aspect-ratio: 4 / 3; border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-alt); }
    img { width: 100%; height: 100%; object-fit: cover; }
  `
})
export class PhotoStrip {
  readonly urls = input.required<string[]>();
  readonly label = input('Fotos da fazenda');

  src(url: string): string {
    return apiAsset(url);
  }
}
