import { Component, effect, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TrackTutor } from '@core/models/track.model';
import { Button } from '@shared/ui/button';
import { CategoryChip } from '@shared/domain/ui/category-chip';
import { FormField } from '@shared/ui/form-field';

export interface TrackGeneralValue {
  title: string;
  description: string;
  categories: string[];
  tutor_ids: number[];
}

// Dados gerais da trilha: nome, descrição, categorias (as dos serviços) e, na edição, os tutores.
// Usado na criação (sem tutores: quem cria vira tutor) e na edição.
@Component({
  selector: 'app-track-general-form',
  imports: [ReactiveFormsModule, Button, CategoryChip, FormField],
  template: `
    <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <app-form-field label="Nome da trilha" fieldId="track-title" [control]="form.controls.title">
        <input formControlName="title" maxlength="120" autocomplete="off" placeholder="Ex.: Colheita de café do pé à saca">
      </app-form-field>

      <app-form-field label="Descrição" fieldId="track-description" hint="O que a pessoa vai aprender. Aparece antes de ela começar." [control]="form.controls.description">
        <textarea formControlName="description" rows="4" maxlength="2000"></textarea>
      </app-form-field>

      <fieldset class="stack-sm">
        <legend class="t-label">Categorias</legend>
        <p class="t-body-sm muted">Os trabalhadores filtram as trilhas pelas mesmas categorias dos serviços.</p>
        <div class="cluster">
          @for (c of categories(); track c) {
            <button appCategoryChip [interactive]="true" [selected]="selectedCategories().includes(c)" [disabled]="readonly()" (click)="toggleCategory(c)">{{ c }}</button>
          }
        </div>
        @if (categoryError()) { <p class="field-error t-body-sm">Escolha pelo menos uma categoria.</p> }
      </fieldset>

      @if (tutors(); as list) {
        <fieldset class="stack-sm">
          <legend class="t-label">Tutores</legend>
          <p class="t-body-sm muted">Só os tutores da trilha podem editá-la. Os nomes aparecem para os alunos.</p>
          <div class="tutors">
            @for (t of list; track t.id) {
              <label class="check">
                <input type="checkbox" [checked]="selectedTutors().includes(t.id)" [disabled]="readonly()" (change)="toggleTutor(t.id)">
                {{ t.name }}
              </label>
            }
          </div>
          @if (tutorError()) { <p class="field-error t-body-sm">A trilha precisa de pelo menos um tutor.</p> }
        </fieldset>
      }

      @if (!readonly()) {
        <div class="form-actions">
          <ng-content />
          <button appButton type="submit" [loading]="saving()">{{ submitLabel() }}</button>
        </div>
      }
    </form>
  `,
  styles: `
    fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
    legend { padding: 0; }
    .tutors { display: grid; gap: var(--space-1); }
    .check { display: flex; align-items: center; gap: var(--space-3); min-height: 44px; }
    .check input { width: 20px; height: 20px; accent-color: var(--mata); }
    .field-error { color: var(--danger); font-weight: 600; }
  `
})
export class TrackGeneralForm {
  readonly value = input<TrackGeneralValue | null>(null);
  readonly categories = input.required<string[]>();
  readonly tutors = input<TrackTutor[] | null>(null); // null = sem escolha de tutores (criação)
  readonly readonly = input(false);
  readonly saving = input(false);
  readonly submitLabel = input('Salvar');

  readonly submitted = output<TrackGeneralValue>();

  private readonly fb = inject(NonNullableFormBuilder);
  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.maxLength(2000)]]
  });
  readonly selectedCategories = signal<string[]>([]);
  readonly selectedTutors = signal<number[]>([]);
  readonly categoryError = signal(false);
  readonly tutorError = signal(false);

  constructor() {
    effect(() => {
      const v = this.value();
      if (v) {
        this.form.reset({ title: v.title, description: v.description });
        this.selectedCategories.set([...v.categories]);
        this.selectedTutors.set([...v.tutor_ids]);
      }
    });
    effect(() => {
      if (this.readonly()) this.form.disable();
      else this.form.enable();
    });
  }

  toggleCategory(category: string): void {
    this.selectedCategories.update((list) => (list.includes(category) ? list.filter((c) => c !== category) : [...list, category]));
    this.categoryError.set(false);
  }

  toggleTutor(id: number): void {
    this.selectedTutors.update((list) => (list.includes(id) ? list.filter((t) => t !== id) : [...list, id]));
    this.tutorError.set(false);
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.categoryError.set(this.selectedCategories().length === 0);
    this.tutorError.set(this.tutors() !== null && this.selectedTutors().length === 0);
    if (this.form.invalid || this.categoryError() || this.tutorError()) return;

    const { title, description } = this.form.getRawValue();
    // Na ordem da lista oficial.
    const categories = this.categories().filter((c) => this.selectedCategories().includes(c));
    this.submitted.emit({ title: title.trim(), description: description.trim(), categories, tutor_ids: this.selectedTutors() });
  }
}
