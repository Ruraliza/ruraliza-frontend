import { Component, computed, input, model, signal } from '@angular/core';
import { SCORE_WORDS } from '../utils/review-criteria';

let nextId = 0;

// Nota de 1 a 5 estrelas. Por baixo são rádios nativos: as setas do teclado trocam a nota e o
// leitor de tela anuncia "3 estrelas, Regular". Cada estrela tem 44px de área de toque.
@Component({
  selector: 'app-star-input',
  template: `
    <fieldset>
      <legend>
        <span class="label">{{ label() }}</span>
        <span class="hint">{{ hint() }}</span>
      </legend>
      <div class="stars" (mouseleave)="hovered.set(0)">
        @for (n of scores; track n) {
          <label [class.on]="n <= shown()" (mouseenter)="hovered.set(n)">
            <input type="radio" [name]="name" [value]="n" [checked]="value() === n" (change)="value.set(n)" />
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>
            <span class="visually-hidden">{{ n }} {{ n === 1 ? 'estrela' : 'estrelas' }}, {{ words[n] }}</span>
          </label>
        }
        <span class="word" aria-hidden="true">{{ word() }}</span>
      </div>
    </fieldset>
  `,
  styles: `
    fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
    legend { display: grid; gap: 2px; padding: 0; margin-bottom: var(--space-1); }
    .label { font-weight: 700; }
    .hint { color: var(--ink-muted); font-size: 0.875rem; line-height: 1.25rem; }
    .stars { display: flex; align-items: center; flex-wrap: wrap; }
    label { position: relative; display: grid; place-items: center; width: 44px; height: 44px; cursor: pointer; border-radius: var(--radius-sm); }
    input { position: absolute; inset: 0; margin: 0; opacity: 0; cursor: pointer; }
    svg { width: 32px; height: 32px; fill: transparent; stroke: var(--line-strong); stroke-width: 1.5; stroke-linejoin: round; transition: fill .12s var(--ease-out), stroke .12s var(--ease-out), transform .12s var(--ease-out); }
    label.on svg { fill: var(--gold-500); stroke: var(--gold-700); }
    label:has(input:focus-visible) { box-shadow: var(--focus-ring); }
    label:active svg { transform: scale(.9); }
    .word { margin-left: var(--space-2); min-width: 64px; color: var(--orange-700); font-weight: 700; }
    @media (prefers-reduced-motion: reduce) { svg { transition: none; } }
  `
})
export class StarInput {
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly value = model<number | null>(null);

  readonly name = `stars-${nextId++}`;
  readonly scores = [1, 2, 3, 4, 5];
  readonly words = SCORE_WORDS;
  readonly hovered = signal(0);

  // Ao passar o mouse, mostra a nota que seria escolhida; senão, a escolhida.
  readonly shown = computed(() => this.hovered() || (this.value() ?? 0));
  readonly word = computed(() => {
    const value = this.value();
    return value === null ? '' : (SCORE_WORDS[value] ?? '');
  });
}
