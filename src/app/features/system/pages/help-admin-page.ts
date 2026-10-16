import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '@core/toast/toast.service';
import { HelpArticle, HelpTopic } from '@core/models/help.model';
import { HELP_TOPIC_LABEL, groupByTopic } from '@shared/domain/ui/help-center';
import { RemoteData } from '@shared/utils/remote-data';
import { Button } from '@shared/ui/button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { EmptyState } from '@shared/ui/empty-state';
import { ErrorState } from '@shared/ui/error-state';
import { FormField } from '@shared/ui/form-field';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';
import { HelpAdminService } from '../data-access/help-admin.service';

// Limites iguais aos da API.
const QUESTION_MAX = 160;
const ANSWER_MAX = 2000;
const TOPICS = Object.entries(HELP_TOPIC_LABEL) as [HelpTopic, string][];

// Gestão da central de ajuda (issue #34): a equipe cria, edita, reordena, despublica e apaga perguntas,
// sem mexer no código. O que está publicado aparece em /ajuda e na ajuda das áreas logadas.
@Component({
  selector: 'app-help-admin-page',
  imports: [ReactiveFormsModule, RouterLink, Button, ConfirmDialog, EmptyState, ErrorState, FormField, Icon, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Central de ajuda</h1>
          <p class="muted">As perguntas que aparecem em <a routerLink="/ajuda" target="_blank" rel="noopener">/ajuda</a>. Rascunhos ficam só aqui.</p>
        </div>
        @if (editing() === null) {
          <button appButton type="button" (click)="startCreate()"><app-icon name="plus" [size]="20" />Nova pergunta</button>
        }
      </div>

      @if (editing() !== null) {
        <form class="card form editor" [formGroup]="form" (ngSubmit)="save()" novalidate>
          <h2 class="t-h3">{{ editing() === 'new' ? 'Nova pergunta' : 'Editar pergunta' }}</h2>
          <app-form-field label="Pergunta" fieldId="help-question" [control]="form.controls.question" [hint]="'Até ' + questionMax + ' caracteres.'">
            <input formControlName="question" [maxlength]="questionMax">
          </app-form-field>
          <app-form-field label="Tema" fieldId="help-topic" [control]="form.controls.topic">
            <select formControlName="topic">
              @for (t of topics; track t[0]) { <option [value]="t[0]">{{ t[1] }}</option> }
            </select>
          </app-form-field>
          <app-form-field label="Resposta" fieldId="help-answer" [control]="form.controls.answer" hint="Texto simples. Cada quebra de linha vira um parágrafo.">
            <textarea formControlName="answer" rows="6" [maxlength]="answerMax"></textarea>
          </app-form-field>
          <label class="check"><input type="checkbox" formControlName="published"><span>Publicada (aparece para todo mundo)</span></label>
          <div class="form-actions">
            <button appButton variant="secondary" type="button" [disabled]="saving()" (click)="cancel()">Cancelar</button>
            <button appButton type="submit" [loading]="saving()">Salvar pergunta</button>
          </div>
        </form>
      }

      @switch (articles.state().status) {
        @case ('loading') { <app-skeleton [count]="4" [height]="72" /> }
        @case ('error') { <app-error-state [message]="articles.error()" (retry)="articles.load()" /> }
        @case ('success') {
          @for (group of groups(); track group.topic) {
            <section class="group" [attr.aria-labelledby]="'grupo-' + group.topic">
              <h2 class="t-h3" [id]="'grupo-' + group.topic">{{ group.label }} <span class="muted t-body-sm">({{ group.articles.length }})</span></h2>
              <ul class="list" role="list">
                @for (article of group.articles; track article.id; let first = $first; let last = $last) {
                  <li class="row">
                    <div class="what">
                      <p class="question">{{ article.question }}@if (!article.published) { <span class="draft">Rascunho</span> }</p>
                      <p class="preview t-body-sm muted">{{ article.answer }}</p>
                    </div>
                    <div class="actions">
                      <button type="button" class="icon-button" [disabled]="first || busyId() === article.id" [attr.aria-label]="'Subir: ' + article.question" title="Subir" (click)="move(article, 'up')"><app-icon name="arrow-up" [size]="20" /></button>
                      <button type="button" class="icon-button" [disabled]="last || busyId() === article.id" [attr.aria-label]="'Descer: ' + article.question" title="Descer" (click)="move(article, 'down')"><app-icon name="arrow-down" [size]="20" /></button>
                      <button appButton variant="ghost" type="button" (click)="startEdit(article)">Editar</button>
                      <button appButton variant="ghost" type="button" class="danger" (click)="removing.set(article)">Apagar</button>
                    </div>
                  </li>
                }
              </ul>
            </section>
          } @empty {
            <app-empty-state icon="help" title="Nenhuma pergunta ainda" message="Crie a primeira: ela aparece na central de ajuda assim que for publicada." />
          }
        }
      }
    </div>

    <app-confirm-dialog
      [open]="removing() !== null"
      title="Apagar esta pergunta?"
      [message]="'“' + (removing()?.question ?? '') + '” sai da central de ajuda. Isso não pode ser desfeito; para só esconder, desmarque Publicada.'"
      confirmLabel="Apagar pergunta"
      confirmVariant="danger"
      [loading]="deleting()"
      (confirmed)="remove()"
      (cancelled)="removing.set(null)"
    />
  `,
  styles: `
    .page-header p { margin: var(--space-1) 0 0; }
    .editor { max-width: 720px; }
    .check { display: flex; align-items: center; gap: var(--space-3); min-height: 44px; cursor: pointer; }
    .check input { width: 22px; height: 22px; }
    .group { display: grid; gap: var(--space-3); }
    .list { display: grid; gap: var(--space-2); }
    .row {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3);
      padding: var(--space-3) var(--space-4); border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--surface-raised);
    }
    .what { display: grid; gap: 2px; flex: 1 1 320px; min-width: 0; }
    .question { font-weight: 700; }
    .preview { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .draft { margin-left: var(--space-2); padding: 0 var(--space-2); border-radius: var(--radius-pill); background: var(--ipe-soft); font-size: 0.8125rem; font-weight: 700; }
    .actions { display: flex; align-items: center; gap: var(--space-1); }
    .icon-button { display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid var(--line); border-radius: 50%; background: var(--surface-raised); color: var(--ink); }
    .icon-button:hover:not([disabled]) { background: var(--surface-sunken); }
    .icon-button[disabled] { opacity: .4; cursor: not-allowed; }
    .actions .danger { color: var(--danger); }
  `
})
export class HelpAdminPage {
  private readonly api = inject(HelpAdminService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly topics = TOPICS;
  readonly questionMax = QUESTION_MAX;
  readonly answerMax = ANSWER_MAX;
  readonly articles = new RemoteData(() => this.api.list());
  readonly groups = computed(() => groupByTopic(this.articles.data() ?? []));

  readonly editing = signal<'new' | HelpArticle | null>(null);
  readonly saving = signal(false);
  readonly busyId = signal<number | null>(null);
  readonly removing = signal<HelpArticle | null>(null);
  readonly deleting = signal(false);

  readonly form = this.fb.group({
    question: ['', [Validators.required, Validators.maxLength(QUESTION_MAX)]],
    topic: this.fb.control<HelpTopic>('comecar', Validators.required),
    answer: ['', [Validators.required, Validators.maxLength(ANSWER_MAX)]],
    published: [true]
  });

  constructor() {
    this.articles.load();
  }

  startCreate(): void {
    this.form.reset({ question: '', topic: 'comecar', answer: '', published: true });
    this.editing.set('new');
  }

  startEdit(article: HelpArticle): void {
    this.form.reset({ question: article.question, topic: article.topic, answer: article.answer, published: article.published });
    this.editing.set(article);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancel(): void {
    this.editing.set(null);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const input = { ...value, question: value.question.trim(), answer: value.answer.trim() };
    const target = this.editing();
    this.saving.set(true);
    const request = target === 'new' || target === null ? this.api.create(input) : this.api.update(target.id, input);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(null);
        this.toast.success(target === 'new' ? 'Pergunta criada.' : 'Pergunta salva.');
        this.articles.load();
      },
      error: () => this.saving.set(false) // a mensagem já saiu no toast
    });
  }

  move(article: HelpArticle, direction: 'up' | 'down'): void {
    this.busyId.set(article.id);
    this.api.move(article.id, direction).subscribe({
      next: () => {
        this.busyId.set(null);
        this.articles.load();
      },
      error: () => this.busyId.set(null)
    });
  }

  remove(): void {
    const article = this.removing();
    if (!article) return;
    this.deleting.set(true);
    this.api.remove(article.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.removing.set(null);
        this.toast.success('Pergunta apagada.');
        this.articles.load();
      },
      error: () => this.deleting.set(false)
    });
  }
}
