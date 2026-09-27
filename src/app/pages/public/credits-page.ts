import { Component } from '@angular/core';
import { PHOTO_CREDITS } from './landing/landing-content';

// Créditos das fotos da landing (Unsplash). Lista gerada de credits.json.
@Component({
  selector: 'app-credits-page',
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Créditos das fotos</h1>
          <p class="muted">As fotos da página inicial são do Unsplash, usadas sob a licença do Unsplash. Obrigado a quem fotografou.</p>
        </div>
      </div>
      <ul class="list" role="list">
        @for (c of credits; track c.file) {
          <li>
            <img [src]="'assets/images/landing/' + c.file + '-800.webp'" [alt]="c.alt" width="160" height="107" loading="lazy" />
            <div>
              <p>{{ c.alt }}</p>
              <p class="muted">Foto de {{ c.author }}, <a [href]="c.unsplashUrl" target="_blank" rel="noopener">ver no Unsplash</a></p>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .list { display: grid; gap: var(--space-4); }
    li { display: flex; gap: var(--space-4); align-items: center; padding-bottom: var(--space-4); border-bottom: 1px solid var(--line); }
    img { flex: none; width: 120px; height: 80px; object-fit: cover; border-radius: var(--radius-sm); }
  `
})
export class CreditsPage {
  readonly credits = PHOTO_CREDITS;
}
