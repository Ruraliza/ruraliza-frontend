import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FarmerService } from '../data-access/farmer.service';
import { ProfileService } from '@core/api/profile.service';
import { CurrentUserService } from '@core/session/current-user.service';
import { RemoteData, mergeStates } from '@shared/utils/remote-data';
import { Button } from '@shared/ui/button';
import { EmptyState } from '@shared/ui/empty-state';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { NextStep } from '@shared/domain/ui/next-step';
import { StatusBadge } from '@shared/domain/ui/status-badge';
import { serviceCover } from '@shared/domain/utils/farm-emoji';
import { Skeleton } from '@shared/ui/skeleton';
import { PendingReviews } from '@shared/domain/ui/pending-reviews';
import { FarmStatsPanel } from '../ui/farm-stats-panel';
import { SponsorSlot } from '@shared/domain/ui/sponsor-slot';

@Component({
  selector: 'app-farmer-dashboard-page',
  imports: [RouterLink, Button, EmptyState, ErrorState, FarmStatsPanel, Icon, NextStep, PendingReviews, Skeleton, SponsorSlot, StatusBadge],
  template: `
    <div class="container page">
      <h1>Olá{{ firstName() ? ', ' + firstName() : '' }}</h1>

      @switch (state().status) {
        @case ('loading') { <app-skeleton [count]="2" [height]="140" /> }
        @case ('error') { <app-error-state [message]="services.error() || farmer.error()" (retry)="load()" /> }
        @case ('success') {
          <!-- Uma ação por vez: o serviço com mais candidatos esperando resposta. -->
          @if (needsYou(); as s) {
            <app-next-step
              status="Precisa de você"
              [title]="'Escolha quem faz: ' + s.name"
              [place]="s.applications_pending === 1 ? '1 candidato' : s.applications_pending + ' candidatos'"
              [photo]="cover(s)"
            >
              <a appButton [routerLink]="['/produtor/servicos', s.id]"><app-icon name="user" [size]="20" />Ver candidatos</a>
            </app-next-step>
          }

          <section class="stack">
            <div class="head">
              <h2>Seus serviços</h2>
              @if (recent().length) { <a class="more" routerLink="/produtor/servicos">Ver todos<app-icon name="arrow-right" [size]="18" /></a> }
            </div>
            @if (recent().length) {
              <ul class="list" role="list">
                @for (service of recent(); track service.id) {
                  <li>
                    <a [routerLink]="['/produtor/servicos', service.id]">
                      <img [src]="cover(service)" alt="" loading="lazy" decoding="async" />
                      <span class="info">
                        <b>{{ service.name }}</b>
                        @if (service.applications_pending) {
                          <span class="t-body-sm muted">{{ service.applications_pending === 1 ? '1 candidato para analisar' : service.applications_pending + ' candidatos para analisar' }}</span>
                        } @else {
                          <app-status-badge [status]="service.status" />
                        }
                      </span>
                      <app-icon name="arrow-right" [size]="20" />
                    </a>
                  </li>
                }
              </ul>
            } @else {
              <app-empty-state [art]="true" title="Você ainda não publicou serviços" message="Publique o primeiro e receba candidaturas de quem sabe fazer.">
                <a appButton routerLink="/produtor/servicos/novo">Publicar serviço</a>
              </app-empty-state>
            }
          </section>

          <app-pending-reviews role="farmer" [profileId]="farmerId" />

          <app-farm-stats-panel [farmerId]="farmerId" />

          @if (farms.state().status === 'success') { <app-sponsor-slot audience="farmer" [state]="farmState()" /> }
        }
      }
    </div>
  `,
  styles: `
    .head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-4); }
    .more { display: inline-flex; align-items: center; gap: 2px; min-height: 44px; color: var(--mata); font-weight: 700; text-decoration: none; }
    .list { display: grid; border-radius: var(--radius-lg); background: var(--surface-raised); box-shadow: var(--shadow-card); border: 1px solid var(--line); overflow: hidden; }
    .list li + li { border-top: 1px solid var(--line); }
    .list a { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-3) var(--space-4); color: var(--ink); text-decoration: none; }
    .list a:hover { background: var(--surface-sunken); }
    .list img { flex: none; width: 64px; height: 64px; border-radius: var(--radius-md); object-fit: cover; background: var(--bg-alt); }
    .info { flex: 1; min-width: 0; display: grid; gap: var(--space-1); justify-items: start; }
    .info b { font-weight: 700; overflow-wrap: anywhere; }
    .list a > app-icon { flex: none; color: var(--ink-muted); }
  `
})
export class FarmerDashboardPage {
  private readonly farmerService = inject(FarmerService);
  private readonly profiles = inject(ProfileService);
  readonly farmerId = inject(CurrentUserService).requireId('farmer');

  readonly farmer = new RemoteData(() => this.profiles.getFarmer(this.farmerId));
  readonly services = new RemoteData(() => this.farmerService.getFarmerServices(this.farmerId));
  // UF das fazendas: o patrocínio da região (só a UF vai na URL).
  readonly farms = new RemoteData(() => this.farmerService.getFarms(this.farmerId));
  readonly farmState = computed(() => this.farms.data()?.find((f) => !f.deleted_at)?.state ?? null);
  readonly state = computed(() => mergeStates(this.farmer.state(), this.services.state()));

  readonly firstName = computed(() => this.farmer.data()?.name.split(' ')[0] ?? '');

  readonly needsYou = computed(() =>
    [...(this.services.data() ?? [])].filter((s) => s.applications_pending > 0).sort((a, b) => b.applications_pending - a.applications_pending)[0] ?? null
  );
  protected readonly cover = serviceCover;

  readonly recent = computed(() => [...(this.services.data() ?? [])].sort((a, b) => b.id - a.id).slice(0, 3));

  constructor() {
    this.load();
  }

  load(): void {
    this.farmer.load();
    this.services.load();
    this.farms.load();
  }
}
