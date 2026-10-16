import { Component, inject, signal } from '@angular/core';
import { SponsorsAdminService } from '../data-access/sponsors-admin.service';
import { SponsorEditor } from '../ui/sponsor-editor';
import { Sponsor, SponsorAudience, SponsorInput } from '@core/models/sponsor.model';
import { ToastService } from '@core/toast/toast.service';
import { Button } from '@shared/ui/button';
import { ConfirmDialog } from '@shared/ui/confirm-dialog';
import { EmptyState } from '@shared/ui/empty-state';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { PhotoPicker } from '@shared/ui/photo-picker';
import { Skeleton } from '@shared/ui/skeleton';
import { formatDate } from '@shared/utils/format';
import { RemoteData } from '@shared/utils/remote-data';

const AUDIENCE_LABEL: Record<SponsorAudience, string> = { all: 'Produtores e trabalhadores', farmer: 'Produtores', worker: 'Trabalhadores' };

// Patrocínios (/sistema/patrocinios, permissão content:manage): quem anuncia, para quem, onde e quando, com as
// aparições e os cliques de cada um. A prévia mostra o cartão como vai aparecer no Início.
@Component({
  selector: 'app-sponsors-admin-page',
  imports: [Button, ConfirmDialog, EmptyState, ErrorState, Icon, PhotoPicker, Skeleton, SponsorEditor],
  template: `
    <div class="container page">
      <div class="page-header">
        <div>
          <h1>Patrocínios</h1>
          <p class="muted">O cartão "Patrocinado" no Início de produtores e trabalhadores. O anunciante não recebe dados de ninguém.</p>
        </div>
        @if (editing() === null) {
          <button appButton type="button" (click)="editing.set('new')"><app-icon name="plus" [size]="20" />Novo patrocínio</button>
        }
      </div>

      @if (editing() !== null) {
        <app-sponsor-editor [sponsor]="editing() === 'new' ? null : editingSponsor()" [saving]="saving()" (saved)="save($event)" (cancelled)="editing.set(null)" />
      }

      @switch (sponsors.state().status) {
        @case ('loading') { <app-skeleton [count]="2" [height]="140" /> }
        @case ('error') { <app-error-state [message]="sponsors.error()" (retry)="sponsors.load()" /> }
        @case ('success') {
          @if (sponsors.data()?.length) {
            <ul class="list" role="list">
              @for (s of sponsors.data(); track s.id) {
                <li class="card item">
                  <div class="top">
                    <div class="who">
                      <b>{{ s.sponsor }}</b>
                      <span class="t-body-sm muted">{{ audience(s.audience) }}, {{ s.states.length ? s.states.join(', ') : 'todo o Brasil' }}{{ period(s) }}</span>
                    </div>
                    <span class="status" [attr.data-on]="s.active">{{ s.active ? 'Ativo' : 'Desligado' }}</span>
                  </div>
                  <p class="title">{{ s.title }}</p>
                  <dl class="numbers t-body-sm">
                    <div><dt>Apareceu</dt><dd>{{ s.impressions }}</dd></div>
                    <div><dt>Cliques</dt><dd>{{ s.clicks }}</dd></div>
                    <div><dt>Taxa</dt><dd>{{ rate(s) }}</dd></div>
                  </dl>
                  <div class="actions">
                    <button appButton variant="secondary" type="button" (click)="edit(s)">Editar</button>
                    <button appButton variant="ghost" type="button" (click)="toggleActive(s)">{{ s.active ? 'Desligar' : 'Ligar' }}</button>
                    <input #logo type="file" appPhotoPicker class="visually-hidden" tabindex="-1" aria-hidden="true" (photosPicked)="upload(s, $event)">
                    <button appButton variant="ghost" type="button" (click)="logo.click()">{{ s.image_url ? 'Trocar logo' : 'Enviar logo' }}</button>
                    <button appButton variant="ghost" class="danger" type="button" (click)="deleting.set(s)">Apagar</button>
                  </div>
                </li>
              }
            </ul>
          } @else if (editing() === null) {
            <app-empty-state icon="star" title="Nenhum patrocínio ainda" message="Cadastre a primeira loja ou marca do campo que vai apoiar o Ruraliza.">
              <button appButton type="button" (click)="editing.set('new')">Novo patrocínio</button>
            </app-empty-state>
          }
        }
      }
    </div>

    <app-confirm-dialog
      [open]="deleting() !== null"
      title="Apagar o patrocínio?"
      [message]="'O cartão de ' + (deleting()?.sponsor ?? '') + ' sai do app, com a logo e os números. Para só tirar do ar, use Desligar.'"
      confirmLabel="Apagar patrocínio"
      confirmVariant="danger"
      [loading]="saving()"
      (confirmed)="remove()"
      (cancelled)="deleting.set(null)"
    />
  `,
  styles: `
    .list { display: grid; gap: var(--space-3); max-width: 880px; margin: 0; padding: 0; list-style: none; }
    .item { display: grid; gap: var(--space-2); }
    .top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3); }
    .who { display: grid; min-width: 0; }
    .title { margin: 0; font-weight: 600; }
    .status { flex: none; padding: 2px var(--space-2); border-radius: var(--radius-pill); background: var(--surface-sunken); color: var(--ink-muted); font-size: 0.8125rem; font-weight: 700; }
    .status[data-on='true'] { background: var(--success-soft); color: var(--success); }
    .numbers { display: flex; flex-wrap: wrap; gap: var(--space-4); margin: 0; }
    .numbers div { display: flex; gap: var(--space-1); }
    dt { color: var(--ink-muted); }
    dd { margin: 0; font-weight: 700; font-variant-numeric: tabular-nums; }
    .actions { display: flex; flex-wrap: wrap; gap: var(--space-2); padding-top: var(--space-1); }
    .actions .danger { color: var(--danger); }
  `
})
export class SponsorsAdminPage {
  private readonly admin = inject(SponsorsAdminService);
  private readonly toast = inject(ToastService);

  readonly sponsors = new RemoteData(() => this.admin.list());
  readonly editing = signal<'new' | number | null>(null);
  readonly deleting = signal<Sponsor | null>(null);
  readonly saving = signal(false);

  constructor() {
    this.sponsors.load();
  }

  editingSponsor(): Sponsor | null {
    const id = this.editing();
    return typeof id === 'number' ? (this.sponsors.data() ?? []).find((s) => s.id === id) ?? null : null;
  }

  edit(sponsor: Sponsor): void {
    this.editing.set(sponsor.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  audience(value: SponsorAudience): string {
    return AUDIENCE_LABEL[value];
  }

  period(sponsor: Sponsor): string {
    if (sponsor.starts_on && sponsor.ends_on) return `, de ${formatDate(`${sponsor.starts_on}T12:00:00Z`)} a ${formatDate(`${sponsor.ends_on}T12:00:00Z`)}`;
    if (sponsor.ends_on) return `, até ${formatDate(`${sponsor.ends_on}T12:00:00Z`)}`;
    if (sponsor.starts_on) return `, a partir de ${formatDate(`${sponsor.starts_on}T12:00:00Z`)}`;
    return '';
  }

  rate(sponsor: Sponsor): string {
    return sponsor.impressions ? `${((sponsor.clicks / sponsor.impressions) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '–';
  }

  save(input: SponsorInput): void {
    const editing = this.editing();
    this.saving.set(true);
    const request = typeof editing === 'number' ? this.admin.update(editing, input) : this.admin.create(input);
    request.subscribe({
      next: ({ sponsor }) => {
        this.saving.set(false);
        this.editing.set(null);
        this.sponsors.refresh();
        this.toast.success(typeof editing === 'number' ? 'Patrocínio salvo.' : `Patrocínio de ${sponsor.sponsor} criado. Envie a logo pelo cartão da lista.`);
      },
      error: () => this.saving.set(false)
    });
  }

  toggleActive(sponsor: Sponsor): void {
    this.admin.update(sponsor.id, { active: !sponsor.active }).subscribe({
      next: ({ sponsor: updated }) => {
        this.sponsors.refresh();
        this.toast.success(updated.active ? 'Patrocínio ligado.' : 'Patrocínio desligado: não aparece mais no app.');
      }
    });
  }

  upload(sponsor: Sponsor, images: Blob[]): void {
    const [image] = images;
    if (!image) return;
    this.admin.uploadImage(sponsor.id, image).subscribe({ next: () => { this.sponsors.refresh(); this.toast.success('Logo enviada.'); } });
  }

  remove(): void {
    const sponsor = this.deleting();
    if (!sponsor) return;
    this.saving.set(true);
    this.admin.remove(sponsor.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.deleting.set(null);
        this.sponsors.refresh();
        this.toast.success('Patrocínio apagado.');
      },
      error: () => this.saving.set(false)
    });
  }
}
