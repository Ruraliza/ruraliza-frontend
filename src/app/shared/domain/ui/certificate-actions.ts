import { Component, computed, inject, input, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Certificate } from '@core/models/track.model';
import { ToastService } from '@core/toast/toast.service';
import { Button } from '@shared/ui/button';
import { Icon } from '@shared/ui/icon';

// Ações de um certificado: "Baixar PDF" (impressão do navegador, A4 deitado) e copiar o link
// público de validação. Fica fora do papel (.no-print).
@Component({
  selector: 'app-certificate-actions',
  imports: [Button, Icon],
  host: { class: 'no-print' },
  template: `
    <div class="cluster">
      <button appButton type="button" (click)="print()"><app-icon name="download" [size]="20" />Baixar PDF</button>
      <button appButton variant="secondary" type="button" (click)="copyLink()">
        <app-icon [name]="copied() ? 'check' : 'share'" [size]="20" />{{ copied() ? 'Link copiado' : 'Copiar link de validação' }}
      </button>
    </div>
    <p class="t-body-sm muted">No "Baixar PDF", escolha <b>Salvar como PDF</b> no destino da impressão.</p>
  `,
  styles: `:host { display: grid; gap: var(--space-2); }`
})
export class CertificateActions {
  readonly certificate = input.required<Certificate>();

  private readonly document = inject(DOCUMENT);
  private readonly toast = inject(ToastService);
  readonly copied = signal(false);

  readonly link = computed(() => `${this.document.location.origin}/certificados/${this.certificate().code}`);

  print(): void {
    this.document.defaultView?.print();
  }

  copyLink(): void {
    const clipboard = this.document.defaultView?.navigator.clipboard;
    if (!clipboard) {
      this.toast.info(this.link());
      return;
    }
    void clipboard.writeText(this.link()).then(
      () => this.copied.set(true),
      () => this.toast.info(this.link())
    );
  }
}
