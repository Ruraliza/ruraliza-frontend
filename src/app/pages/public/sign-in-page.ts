import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FarmerService } from '../../core/api/farmer.service';
import { WorkerService } from '../../core/api/worker.service';
import { CurrentUserService, UserRole } from '../../core/session/current-user.service';
import { RemoteData } from '../../shared/utils/remote-data';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorState } from '../../shared/ui/error-state';
import { SegmentOption, SegmentedControl } from '../../shared/ui/segmented-control';
import { Skeleton } from '../../shared/ui/skeleton';

interface ProfileOption {
  id: number;
  name: string;
  email: string;
  cpf: string; // já mascarado pela API
}

// Seleção de perfil de teste. Não é login: não há senha nem autenticação.
@Component({
  selector: 'app-sign-in-page',
  imports: [RouterLink, Button, EmptyState, ErrorState, SegmentedControl, Skeleton],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Escolha um perfil de teste</h1>
          <p class="muted">Sem senha por enquanto: escolha quem você quer ser para testar o fluxo.</p>
        </div>
      </div>

      <app-segmented-control label="Tipo de perfil" [options]="roleOptions" [(value)]="role" />

      @let list = current();
      @switch (list.state().status) {
        @case ('loading') { <app-skeleton [count]="3" [height]="72" /> }
        @case ('error') { <app-error-state [message]="list.error()" (retry)="list.load()" /> }
        @case ('success') {
          @if (list.data()?.length) {
            <ul class="profiles" role="list">
              @for (profile of list.data(); track profile.id) {
                <li>
                  <button type="button" class="profile" (click)="choose(profile.id)">
                    <span class="who">
                      <span class="t-h3">{{ profile.name }}</span>
                      <span class="t-body-sm muted">{{ profile.email }}</span>
                      <span class="t-body-sm muted">CPF {{ profile.cpf }}</span>
                    </span>
                    <span class="go">Entrar</span>
                  </button>
                </li>
              }
            </ul>
          } @else {
            <app-empty-state
              icon="user"
              [title]="role() === 'farmer' ? 'Nenhum produtor cadastrado' : 'Nenhum trabalhador cadastrado'"
              message="Crie um perfil para começar a testar."
            >
              <a appButton [routerLink]="role() === 'farmer' ? '/cadastro/produtor' : '/cadastro/trabalhador'">Criar perfil</a>
            </app-empty-state>
          }
        }
      }

      <p class="muted">Ainda não tem perfil? <a routerLink="/cadastro">Criar conta</a></p>
    </div>
  `,
  styles: `
    .profiles { display: grid; gap: var(--space-3); }
    .profile {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--space-3);
      width: 100%; min-height: 72px; padding: var(--space-4) var(--space-6); text-align: left;
      border: 1px solid var(--line); border-radius: var(--radius-lg); background: var(--surface-raised); box-shadow: var(--shadow-card);
    }
    .profile:hover { border-color: var(--mata); }
    .who { display: grid; min-width: 0; overflow-wrap: anywhere; }
    .go { display: inline-flex; align-items: center; gap: var(--space-2); color: var(--mata); font-weight: 600; }
  `
})
export class SignInPage {
  private readonly farmerService = inject(FarmerService);
  private readonly workerService = inject(WorkerService);
  private readonly currentUser = inject(CurrentUserService);
  private readonly router = inject(Router);

  readonly roleOptions: SegmentOption<UserRole>[] = [
    { value: 'farmer', label: 'Produtor' },
    { value: 'worker', label: 'Trabalhador' }
  ];
  readonly role = signal<UserRole>('farmer');

  private readonly farmers = new RemoteData<ProfileOption[]>(() => this.farmerService.getFarmers());
  private readonly workers = new RemoteData<ProfileOption[]>(() => this.workerService.getWorkers());

  readonly current = computed(() => (this.role() === 'farmer' ? this.farmers : this.workers));

  constructor() {
    this.farmers.load();
    this.workers.load();
  }

  choose(id: number): void {
    const role = this.role();
    this.currentUser.set({ role, id });
    this.router.navigateByUrl(role === 'farmer' ? '/produtor' : '/trabalhador');
  }
}
