import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../data-access/admin.service';
import { SYSTEM_ROLE_LABEL, SystemSessionService } from '@core/session/system-session.service';
import { RemoteData } from '@shared/utils/remote-data';
import { formatDate } from '@shared/utils/format';
import { Avatar } from '@shared/domain/ui/avatar';
import { Button } from '@shared/ui/button';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';

// Equipe: administradores e tutores (usuários de sistema).
@Component({
  selector: 'app-staff-page',
  imports: [RouterLink, Avatar, Button, ErrorState, Icon, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Equipe</h1>
          <p class="muted">Usuários de sistema. Entram por um acesso próprio, separado do app.</p>
        </div>
        <a appButton routerLink="/sistema/equipe/novo"><app-icon name="plus" [size]="20" />Novo membro</a>
      </div>

      @switch (staff.state().status) {
        @case ('loading') { <app-skeleton [count]="2" [height]="72" /> }
        @case ('error') { <app-error-state [message]="staff.error()" (retry)="staff.load()" /> }
        @case ('success') {
          <ul class="list" role="list">
            @for (member of staff.data(); track member.id) {
              <li class="card row">
                <app-avatar [name]="member.name" />
                <span class="who">
                  <span class="t-label">{{ member.name }}@if (member.id === me()?.id) { <span class="muted"> (você)</span> }</span>
                  <span class="t-body-sm muted">{{ member.email }} · desde {{ date(member.insertion_date) }}</span>
                </span>
                <span class="badge">{{ roleLabel[member.role] }}</span>
                <a appButton variant="ghost" [routerLink]="['/sistema/equipe', member.id, 'editar']" [attr.aria-label]="'Editar ' + member.name">Editar</a>
              </li>
            }
          </ul>
        }
      }
    </div>
  `,
  styles: `
    .list { display: grid; gap: var(--space-2); padding: 0; margin: 0; list-style: none; }
    .row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); }
    .who { display: grid; min-width: 0; flex: 1; }
    .who > * { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .badge { padding: 2px var(--space-2); border-radius: 999px; background: var(--broto-soft); font-size: 12px; font-weight: 600; }
  `
})
export class StaffPage {
  private readonly admin = inject(AdminService);
  readonly me = inject(SystemSessionService).user;

  readonly staff = new RemoteData(() => this.admin.listSystemUsers());
  readonly roleLabel = SYSTEM_ROLE_LABEL;
  readonly date = formatDate;

  constructor() {
    this.staff.load();
  }
}
