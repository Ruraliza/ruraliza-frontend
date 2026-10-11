import { Component, effect, inject, input, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CertificateService } from '@core/api/certificate.service';
import { RemoteData } from '@shared/utils/remote-data';
import { CertificateActions } from '@shared/domain/ui/certificate-actions';
import { CertificateView } from '@shared/domain/ui/certificate-view';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { Skeleton } from '@shared/ui/skeleton';

// Um certificado do trabalhador, pronto para baixar em PDF ou compartilhar o link de validação.
@Component({
  selector: 'app-certificate-page',
  imports: [RouterLink, CertificateActions, CertificateView, ErrorState, Icon, Skeleton],
  template: `
    <div class="container page">
      <a class="back-link no-print" routerLink="/trabalhador/certificados"><app-icon name="arrow-left" [size]="20" />Meus certificados</a>

      @switch (certificate.state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="420" /> }
        @case ('error') { <app-error-state [message]="certificate.error()" (retry)="certificate.load()" /> }
        @case ('success') {
          @if (certificate.data(); as c) {
            <app-certificate-actions [certificate]="c" />
            <app-certificate-view [certificate]="c" />
          }
        }
      }
    </div>
  `,
  styles: `
    @media print { .page { padding: 0; } }
  `
})
export class CertificatePage {
  readonly code = input.required<string>();

  private readonly certificates = inject(CertificateService);
  readonly certificate = new RemoteData(() => this.certificates.getCertificate(this.code()));

  constructor() {
    effect(() => {
      this.code();
      untracked(() => this.certificate.load());
    });
  }
}
