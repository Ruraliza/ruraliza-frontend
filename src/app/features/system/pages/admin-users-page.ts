import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../data-access/admin.service';
import { AdminUser } from '@core/models/system.model';
import { RemoteData } from '@shared/utils/remote-data';
import { Avatar } from '@shared/domain/ui/avatar';
import { EmptyState } from '@shared/ui/empty-state';
import { ErrorState } from '@shared/ui/error-state';
import { Skeleton } from '@shared/ui/skeleton';

// Nome que representa a conta: o do produtor ou, sem ele, o do trabalhador.
export function accountName(user: AdminUser): string {
  return user.farmer?.name ?? user.worker?.name ?? user.email;
}

// Sem acento e em minúsculas, para a busca.
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Contas do app (produtores e trabalhadores), com busca por nome, e-mail ou CPF.
@Component({
  selector: 'app-admin-users-page',
  imports: [RouterLink, Avatar, EmptyState, ErrorState, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Usuários</h1>
          <p class="muted">Contas de produtores e trabalhadores, as mais novas primeiro.</p>
        </div>
      </div>

      <label class="search">
        <span class="visually-hidden">Buscar usuário</span>
        <input type="search" placeholder="Buscar por nome, e-mail ou CPF" [value]="query()" (input)="query.set($any($event.target).value)">
      </label>

      @switch (users.state().status) {
        @case ('loading') { <app-skeleton [count]="3" [height]="72" /> }
        @case ('error') { <app-error-state [message]="users.error()" (retry)="users.load()" /> }
        @case ('success') {
          @if (filtered().length) {
            <p class="t-body-sm muted">{{ filtered().length }} {{ filtered().length === 1 ? 'conta' : 'contas' }}</p>
            <ul class="list" role="list">
              @for (user of filtered(); track user.account_id) {
                <li>
                  <a class="card row" [routerLink]="['/sistema/usuarios', user.account_id]">
                    <app-avatar [name]="name(user)" [photoUrl]="user.farmer?.photo_url ?? user.worker?.photo_url ?? null" />
                    <span class="who">
                      <span class="t-label">{{ name(user) }}</span>
                      <span class="t-body-sm muted">{{ user.email }}</span>
                    </span>
                    <span class="badges">
                      @if (user.farmer) { <span class="badge">Produtor</span> }
                      @if (user.worker) { <span class="badge">Trabalhador</span> }
                    </span>
                  </a>
                </li>
              }
            </ul>
          } @else if (query()) {
            <app-empty-state icon="search" title="Nenhuma conta encontrada" message="Confira o nome, o e-mail ou o CPF digitado." />
          } @else {
            <app-empty-state icon="user" title="Nenhuma conta ainda" message="As contas aparecem aqui quando produtores e trabalhadores se cadastram." />
          }
        }
      }
    </div>
  `,
  styles: `
    .search input { width: 100%; max-width: 560px; }
    .list { display: grid; gap: var(--space-2); padding: 0; margin: 0; list-style: none; }
    .row { display: flex; align-items: center; gap: var(--space-3); text-decoration: none; color: inherit; }
    .row:hover { border-color: var(--line-strong); }
    .who { display: grid; min-width: 0; flex: 1; }
    .who > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .badges { display: flex; flex-wrap: wrap; gap: var(--space-1); justify-content: flex-end; }
    .badge { padding: 2px var(--space-2); border-radius: 999px; background: var(--broto-soft); font-size: 0.75rem; font-weight: 600; }
  `
})
export class AdminUsersPage {
  private readonly admin = inject(AdminService);

  readonly users = new RemoteData(() => this.admin.listUsers());
  readonly query = signal('');
  readonly name = accountName;

  readonly filtered = computed(() => {
    const all = this.users.data() ?? [];
    const terms = normalize(this.query().trim()).split(/\s+/).filter(Boolean);
    if (!terms.length) return all;
    return all.filter((user) => {
      const text = normalize([user.email, user.farmer?.name, user.worker?.name, user.farmer?.cpf, user.worker?.cpf].join(' '));
      const digits = text.replace(/\D/g, '');
      return terms.every((term) => text.includes(term) || (/^\d+$/.test(term) && digits.includes(term)));
    });
  });

  constructor() {
    this.users.load();
  }
}
