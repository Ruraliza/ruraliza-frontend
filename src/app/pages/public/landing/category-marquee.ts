import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LANDING_CATEGORIES } from './landing-content';

// Faixa infinita de categorias. Duas cópias da lista rolam em loop; a segunda
// é só visual (aria-hidden). Pausa no hover/foco e para com reduced motion.
@Component({
  selector: 'app-category-marquee',
  imports: [RouterLink],
  template: `
    <nav class="marquee" aria-label="Categorias de serviço">
      <div class="track">
        @for (copy of [0, 1]; track copy) {
          <ul class="group" role="list" [attr.aria-hidden]="copy === 1 ? 'true' : null">
            @for (category of categories; track category.name) {
              <li>
                <a class="pill" routerLink="/" fragment="categorias" [attr.tabindex]="copy === 1 ? -1 : null">
                  <img [src]="'assets/images/landing/' + category.photo + '-thumb.webp'" alt="" width="40" height="40" loading="lazy" />
                  {{ category.name }}
                </a>
              </li>
            }
          </ul>
        }
      </div>
    </nav>
  `,
  styles: `
    .marquee { overflow: hidden; padding-block: var(--space-6); background: var(--bg); border-bottom: 1px solid var(--line); }
    .track { display: flex; width: max-content; }
    .group { display: flex; gap: var(--space-3); padding-right: var(--space-3); }
    .pill {
      display: inline-flex; align-items: center; gap: var(--space-3); min-height: 56px;
      padding: var(--space-2) var(--space-6) var(--space-2) var(--space-2);
      border: 1px solid var(--line); border-radius: var(--radius-pill); background: var(--bg);
      color: var(--ink); font: 600 18px/1 var(--font-sans); text-decoration: none; white-space: nowrap;
    }
    .pill:hover { border-color: var(--green-700); background: var(--lime-100); }
    .pill img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
    @media (prefers-reduced-motion: no-preference) {
      .track { animation: scroll 48s linear infinite; }
      .marquee:hover .track, .marquee:focus-within .track { animation-play-state: paused; }
    }
    @media (prefers-reduced-motion: reduce) {
      .marquee { overflow-x: auto; }
    }
    @keyframes scroll { to { transform: translateX(-50%); } }
  `
})
export class CategoryMarquee {
  readonly categories = LANDING_CATEGORIES;
}
