import { Component } from '@angular/core';
import { LANDING_CATEGORIES } from './landing-content';
import { Photo } from './photo';
import { RevealDirective } from './reveal.directive';

// Grade assimétrica de categorias com foto. Colheita ocupa 2×2.
// A frase aparece no hover/foco no desktop e fica sempre visível no toque.
@Component({
  selector: 'app-categories-bento',
  imports: [Photo, RevealDirective],
  template: `
    <section id="categorias" class="cats" aria-labelledby="categorias-title">
      <div class="container">
        <h2 id="categorias-title">Serviços que você encontra aqui</h2>
        <p class="support">Do plantio à secagem. Publique ou procure pelo tipo de trabalho.</p>
        <ul class="bento" role="list">
          @for (c of categories; track c.name; let i = $index) {
            <li [class]="'tile tile--' + i" appReveal [revealDelay]="(i % 4) * 70">
              <app-photo class="img" [file]="c.photo" [decorative]="true" [sizes]="i === 0 ? '(min-width: 900px) 50vw, 100vw' : '(min-width: 900px) 25vw, 50vw'" />
              <div class="caption">
                <h3>{{ c.name }}</h3>
                <div class="more"><p>{{ c.description }}</p></div>
              </div>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    .cats { padding-block: var(--space-24); background: var(--bg-alt); scroll-margin-top: var(--header-height); }
    h2 { font: 800 clamp(34px, 5vw, 56px)/1.02 var(--font-display); letter-spacing: -0.03em; }
    .support { margin: var(--space-4) 0 var(--space-12); font-size: 18px; line-height: 28px; color: var(--ink-muted); max-width: 48ch; text-wrap: pretty; }

    .bento { display: grid; gap: var(--space-3); grid-template-columns: repeat(2, 1fr); grid-auto-rows: 180px; }
    .tile { position: relative; overflow: hidden; border-radius: var(--radius-lg); color: var(--on-dark); }
    .tile--0 { grid-column: span 2; grid-row: span 2; }
    .img { position: absolute; inset: 0; }
    .img ::ng-deep img { transition: transform .6s var(--ease-out); }
    .tile:hover .img ::ng-deep img { transform: scale(1.04); }
    .caption {
      position: absolute; inset: auto 0 0; display: grid; gap: var(--space-1);
      padding: var(--space-12) var(--space-4) var(--space-4);
      background: linear-gradient(0deg, rgba(0,40,20,.88) 0%, rgba(0,40,20,.6) 55%, transparent 100%);
    }
    h3 { font: 700 20px/1.15 var(--font-display); }
    .tile--0 h3 { font-size: clamp(26px, 3vw, 36px); }
    .caption p { font-size: 14px; line-height: 20px; }

    @media (min-width: 900px) {
      .bento { grid-template-columns: repeat(4, 1fr); grid-auto-rows: 230px; }
      .tile--2 { grid-row: span 2; }
      .tile--4 { grid-column: span 2; }
      .caption { padding: var(--space-12) var(--space-6) var(--space-6); }
      .more { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows .5s var(--ease-out), opacity .4s var(--ease-out); }
      .more p { overflow: hidden; }
      .tile:hover .more { grid-template-rows: 1fr; opacity: 1; }
    }
  `
})
export class CategoriesBento {
  readonly categories = LANDING_CATEGORIES;
}
