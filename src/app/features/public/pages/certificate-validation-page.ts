import { Component, effect, inject, input, linkedSignal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { CertificateService } from '@core/api/certificate.service';
import { Certificate } from '@core/models/track.model';
import { RemoteData } from '@shared/utils/remote-data';
import { formatDuration, formatLongDate } from '@shared/utils/format';
import { CertificateActions } from '@shared/domain/ui/certificate-actions';
import { CertificateView } from '@shared/domain/ui/certificate-view';
import { Button } from '@shared/ui/button';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';

// Validação pública de um certificado (sem login): quem recebe o certificado confere pelo código.
@Component({
  selector: 'app-certificate-validation-page',
  imports: [Button, CertificateActions, CertificateView, Icon, Skeleton],
  template: `
    <div class="container page">
      <header class="page-header no-print">
        <div>
          <p class="t-overline muted">Trilhas de estudo</p>
          <h1>Validar certificado</h1>
          <p class="muted">Digite o código impresso no certificado da Ruraliza.</p>
        </div>
      </header>

      <form class="search no-print" (submit)="validate($event)">
        <label class="visually-hidden" for="codigo">Código do certificado</label>
        <input id="codigo" name="codigo" autocomplete="off" placeholder="RZ-XXXX-XXXX-XX" [value]="draft()" (input)="onDraft($event)">
        <button appButton type="submit">Validar</button>
      </form>

      @if (code()) {
        @switch (result.state().status) {
          @case ('loading') { <app-skeleton [count]="1" [height]="200" /> }
          @case ('error') {
            <div class="card status invalid no-print" role="status">
              <app-icon name="alert" />
              <div><p class="t-label">Certificado não encontrado</p><p class="t-body-sm muted">Confira se o código foi digitado como está no certificado.</p></div>
            </div>
          }
          @case ('success') {
            @if (result.data(); as c) {
              <div class="card status valid no-print" role="status">
                <app-icon name="check" />
                <div>
                  <p class="t-label">Certificado válido</p>
                  <p class="t-body-sm muted">{{ c.worker_name }} concluiu <b>{{ c.track_title }}</b> ({{ duration(c.workload_minutes) }}) em {{ date(c.completed_at) }}.</p>
                </div>
              </div>
              <app-certificate-actions [certificate]="c" />
              <app-certificate-view [certificate]="c" />
            }
          }
        }
      }
    </div>
  `,
  styles: `
    .search { display: flex; flex-wrap: wrap; gap: var(--space-3); max-width: 560px; }
    .search input { flex: 1 1 240px; text-transform: uppercase; letter-spacing: 0.06em; }
    .status { display: flex; align-items: center; gap: var(--space-4); }
    .status app-icon { flex: none; }
    .valid { border-color: var(--success); background: var(--success-soft); }
    .valid app-icon { color: var(--success); }
    .invalid { border-color: var(--danger); background: var(--danger-soft); }
    .invalid app-icon { color: var(--danger); }
    @media print { .page { padding: 0; } }
  `
})
export class CertificateValidationPage {
  // /certificados/:code (opcional: sem código, só o campo).
  readonly code = input<string>();

  private readonly certificates = inject(CertificateService);
  private readonly router = inject(Router);

  readonly draft = linkedSignal(() => this.code() ?? '');
  readonly result = new RemoteData<Certificate | null>(() => {
    const code = this.code();
    return code ? this.certificates.getCertificate(code) : of(null);
  });

  readonly duration = formatDuration;
  readonly date = formatLongDate;

  constructor() {
    effect(() => {
      this.code();
      untracked(() => this.result.load());
    });
  }

  onDraft(event: Event): void {
    this.draft.set((event.target as HTMLInputElement).value);
  }

  validate(event: Event): void {
    event.preventDefault();
    const code = this.draft().trim().toUpperCase();
    if (code) void this.router.navigate(['/certificados', code]);
  }
}
