import { Component, computed, input, output, signal } from '@angular/core';
import { FARM_CRITERIA, MAX_REVIEW_COMMENT, WORKER_CRITERIA } from '../utils/review-criteria';
import { Button } from '../../ui/button';
import { StarInput } from './star-input';

export interface ReviewDraft {
  scores: Record<string, number>;
  comment: string | null;
}

// Formulário da avaliação: uma nota de 1 a 5 para cada critério e um comentário opcional.
// `target`: quem é avaliado (o trabalhador, pelo produtor; a fazenda, pelo trabalhador).
@Component({
  selector: 'app-review-form',
  imports: [Button, StarInput],
  template: `
    <form (submit)="submit($event)" novalidate>
      @for (criterion of criteria(); track criterion.key) {
        <app-star-input [label]="criterion.label" [hint]="criterion.hint" [value]="scores()[criterion.key] ?? null" (valueChange)="setScore(criterion.key, $event)" />
      }
      <div class="comment">
        <label for="review-comment">Comentário <span class="muted">(opcional)</span></label>
        <textarea id="review-comment" rows="3" [maxLength]="maxComment" [placeholder]="placeholder()" [value]="comment()" (input)="onComment($event)"></textarea>
        <span class="t-body-sm muted counter" aria-live="polite">{{ comment().length }}/{{ maxComment }}</span>
      </div>
      @if (missing()) {
        <p class="error" role="alert">Dê uma nota para os três itens.</p>
      }
      <button appButton type="submit" [loading]="loading()">Enviar avaliação</button>
    </form>
  `,
  styles: `
    form { display: grid; gap: var(--space-4); }
    .comment { display: grid; gap: var(--space-1); }
    label { font-weight: 700; }
    textarea {
      width: 100%; min-height: 96px; padding: var(--space-3); resize: vertical;
      border: 1px solid var(--line-strong); border-radius: var(--radius-md); background: var(--surface-raised); color: var(--ink); font: inherit;
    }
    textarea:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    .counter { justify-self: end; font-variant-numeric: tabular-nums; }
    .error { color: var(--danger); font-weight: 600; margin: 0; }
    button { justify-self: start; }
    @media (max-width: 479px) { button { justify-self: stretch; } }
  `
})
export class ReviewForm {
  readonly target = input.required<'worker' | 'farm'>();
  readonly loading = input(false);
  readonly submitted = output<ReviewDraft>();

  readonly maxComment = MAX_REVIEW_COMMENT;
  readonly scores = signal<Record<string, number>>({});
  readonly comment = signal('');
  readonly missing = signal(false);

  readonly criteria = computed(() => (this.target() === 'worker' ? WORKER_CRITERIA : FARM_CRITERIA));
  readonly placeholder = computed(() =>
    this.target() === 'worker' ? 'Ex.: chegou no horário e caprichou na colheita.' : 'Ex.: tinha água e sombra; faltou luva no primeiro dia.'
  );

  setScore(key: string, value: number | null): void {
    if (value === null) return;
    this.scores.update((scores) => ({ ...scores, [key]: value }));
    this.missing.set(false);
  }

  onComment(event: Event): void {
    this.comment.set((event.target as HTMLTextAreaElement).value);
  }

  submit(event: Event): void {
    event.preventDefault();
    const scores = this.scores();
    if (this.criteria().some((c) => scores[c.key] === undefined)) {
      this.missing.set(true);
      return;
    }
    const comment = this.comment().trim();
    this.submitted.emit({ scores, comment: comment || null });
  }
}
