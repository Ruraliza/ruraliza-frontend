import { Component, computed, input } from '@angular/core';
import { encodeQr, qrPath } from '@shared/utils/qr-code';

// QR code em SVG: escuro sobre branco, com a margem clara de 4 módulos que os leitores pedem.
// Fica nítido em qualquer tamanho e na impressão; a largura vem de quem usa (a altura acompanha).
@Component({
  selector: 'app-qr-code',
  host: { role: 'img', '[attr.aria-label]': 'label()' },
  template: `
    <svg [attr.viewBox]="viewBox()" shape-rendering="crispEdges" aria-hidden="true" focusable="false">
      <rect [attr.width]="extent()" [attr.height]="extent()" fill="#fff" />
      <path [attr.d]="path()" fill="currentColor" />
    </svg>
  `,
  styles: `
    :host { display: block; aspect-ratio: 1; color: #10251a; }
    svg { display: block; width: 100%; height: 100%; }
  `
})
export class QrCode {
  readonly value = input.required<string>();
  readonly label = input('QR code');

  private readonly symbol = computed(() => encodeQr(this.value()));
  readonly extent = computed(() => this.symbol().size + 8);
  readonly viewBox = computed(() => `0 0 ${this.extent()} ${this.extent()}`);
  readonly path = computed(() => qrPath(this.symbol()));
}
