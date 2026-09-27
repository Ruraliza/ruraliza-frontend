import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Button } from '../../../shared/ui/button';
import { CategoryChip } from '../../../shared/ui/category-chip';
import { Icon } from '../../../shared/ui/icon';
import { MaskedInput } from '../../../shared/ui/masked-input';
import { formatBRL, formatHours } from '../../../shared/utils/format';
import { draftParams } from '../../../shared/utils/service-draft';
import { LANDING_CATEGORIES } from './landing-content';
import { TalhaoPattern } from './talhao';

// Mini-formulário que monta, em tempo real, o card da vaga como o trabalhador vê.
// Sem API: "Publicar de verdade" leva ao cadastro de produtor com os dados na URL.
@Component({
  selector: 'app-job-builder',
  imports: [ReactiveFormsModule, Button, CategoryChip, Icon, MaskedInput, TalhaoPattern],
  templateUrl: './job-builder.html',
  styleUrl: './job-builder.css'
})
export class JobBuilder {
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly categories = LANDING_CATEGORIES.map((c) => c.name);

  readonly form = this.fb.group({
    name: 'Colheita de café',
    category: 'Colheita',
    duration: 40,
    price: this.fb.control<number | null>(1800)
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly preview = computed(() => {
    const v = this.value();
    return {
      name: v.name?.trim() || 'Nome do serviço',
      category: v.category ?? '',
      hours: formatHours(v.duration ?? 1),
      price: v.price ? formatBRL(v.price) : 'R$ 0,00'
    };
  });

  selectCategory(category: string): void {
    this.form.controls.category.setValue(category);
  }

  publish(): void {
    const { name, category, duration, price } = this.form.getRawValue();
    this.router.navigate(['/cadastro/produtor'], {
      queryParams: draftParams({
        servico: name.trim(),
        categoria: category,
        duracao: String(duration),
        valor: price ? String(price) : undefined
      })
    });
  }
}
