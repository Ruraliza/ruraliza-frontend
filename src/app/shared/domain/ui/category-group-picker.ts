import { Component, effect, input, model, signal, untracked } from '@angular/core';
import { CategoryGroup } from '@core/models/service.model';
import { Icon } from '@shared/ui/icon';
import { CategoryChip } from './category-chip';

// Escolha de vários tipos de serviço em dois níveis (grupo > serviço). Cada grupo abre e fecha
// (<details>, acessível sem JavaScript) para a lista não ficar comprida no celular. "Todo o grupo"
// marca ou desmarca todos os serviços dele. O que sai (selected) é sempre a lista de serviços,
// na ordem de GET /api/categories/groups.
@Component({
  selector: 'app-category-group-picker',
  imports: [CategoryChip, Icon],
  template: `
    <div class="groups">
      @for (group of groups(); track group.name) {
        <details [open]="openGroups().has(group.name)">
          <summary>
            <span class="name">{{ group.name }}</span>
            @if (countIn(group); as count) { <span class="count t-body-sm">{{ count }} de {{ group.services.length }}</span> }
            <app-icon name="plus" />
          </summary>
          <div class="cluster" role="group" [attr.aria-label]="group.name">
            @if (group.services.length > 1) {
              <button appCategoryChip [interactive]="true" [selected]="allIn(group)" [disabled]="disabled()" (click)="toggleGroup(group)">Todo o grupo</button>
            }
            @for (service of group.services; track service) {
              <button appCategoryChip [interactive]="true" [selected]="selected().includes(service)" [disabled]="disabled()" (click)="toggle(service)">{{ service }}</button>
            }
          </div>
        </details>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .groups { border-top: 1px solid var(--line); }
    details { border-bottom: 1px solid var(--line); }
    summary {
      display: flex; align-items: center; gap: var(--space-2); min-height: 48px; padding-block: var(--space-2);
      cursor: pointer; list-style: none; font-weight: 700;
    }
    summary::-webkit-details-marker { display: none; }
    .name { flex: 1; }
    .count { color: var(--ink-muted); font-weight: 600; }
    summary app-icon { flex: none; color: var(--mata); transition: transform .2s var(--ease-out); }
    details[open] summary app-icon { transform: rotate(45deg); }
    .cluster { padding-bottom: var(--space-3); }
    .cluster button { white-space: normal; text-align: left; }
    @media (prefers-reduced-motion: reduce) { summary app-icon { transition: none; } }
  `
})
export class CategoryGroupPicker {
  readonly groups = input.required<CategoryGroup[]>();
  readonly selected = model<string[]>([]);
  readonly disabled = input(false);

  // Abre os grupos que têm algo marcado (as escolhas salvas chegam depois). Só acrescenta: desmarcar o
  // último serviço não fecha o grupo na mão de quem está escolhendo.
  readonly openGroups = signal<ReadonlySet<string>>(new Set());

  constructor() {
    effect(() => {
      const withSelection = this.groups().filter((g) => this.countIn(g) > 0).map((g) => g.name);
      untracked(() => {
        const open = this.openGroups();
        if (withSelection.some((name) => !open.has(name))) this.openGroups.set(new Set([...open, ...withSelection]));
      });
    });
  }

  countIn(group: CategoryGroup): number {
    return group.services.filter((s) => this.selected().includes(s)).length;
  }

  allIn(group: CategoryGroup): boolean {
    return this.countIn(group) === group.services.length;
  }

  toggle(service: string): void {
    const current = this.selected();
    this.emit(current.includes(service) ? current.filter((s) => s !== service) : [...current, service]);
  }

  toggleGroup(group: CategoryGroup): void {
    const current = this.selected();
    this.emit(this.allIn(group) ? current.filter((s) => !group.services.includes(s)) : [...current, ...group.services]);
  }

  // Sem repetir e na ordem dos grupos; o que não está em grupo nenhum (valor antigo) fica no fim.
  private emit(list: string[]): void {
    const chosen = new Set(list);
    const ordered = this.groups().flatMap((g) => g.services).filter((s) => chosen.has(s));
    this.selected.set([...ordered, ...[...chosen].filter((s) => !ordered.includes(s))]);
  }
}
