import { Component, computed, inject, input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Certificate } from '@core/models/track.model';
import { formatLongDate, formatWorkload } from '@shared/utils/format';
import { Logo } from '@shared/ui/logo';
import { QrCode } from '@shared/ui/qr-code';
import { hashGroups } from '../utils/certificate-hash';

// O certificado de conclusão de uma trilha, em nome da Ruraliza, no formato A4 deitado.
// Na impressão ("Baixar PDF" = imprimir e salvar em PDF) só ele aparece: a casca do app some
// pelas regras de @media print (ver styles/base.css e as cascas em core/layout).
// Para conferir: o código, o QR code que abre a validação pública e o resumo SHA-256 dos dados.
@Component({
  selector: 'app-certificate-view',
  imports: [Logo, QrCode],
  template: `
    <article class="sheet" aria-label="Certificado de conclusão">
      <div class="frame">
        <header class="head">
          <app-logo [size]="56" />
          <p class="kicker">Certificado de conclusão</p>
        </header>

        <div class="body">
          <p class="lead">A Ruraliza certifica que</p>
          <p class="name">{{ certificate().worker_name }}</p>
          <p class="lead">concluiu a trilha de estudos</p>
          <p class="track">{{ certificate().track_title }}</p>
          <p class="lead">com carga horária de <strong>{{ workload() }}</strong>, em <strong>{{ completedAt() }}</strong>.</p>
        </div>

        <footer class="foot">
          <div class="sign">
            <span class="line" aria-hidden="true"></span>
            <span class="who">Ruraliza</span>
            <span class="role">Trilhas de estudo</span>
          </div>
          <div class="check">
            <div class="check-text">
              <span>Código de validação</span>
              <strong class="code">{{ certificate().code }}</strong>
              <span class="url">{{ validationUrl() }}</span>
              @if (hash().length) {
                <span class="hash-label">Resumo SHA-256 dos dados</span>
                <span class="hash">@for (group of hash(); track $index) {<span>{{ group }}</span>}</span>
              }
            </div>
            <app-qr-code class="qr" [value]="link()" label="QR code para validar o certificado" />
          </div>
        </footer>
      </div>
    </article>
  `,
  styles: `
    :host { display: block; container-type: inline-size; }
    .sheet {
      aspect-ratio: 297 / 210; width: 100%;
      padding: 2.4cqi; background: #fff; color: #10251a;
      border-radius: var(--radius-lg); box-shadow: var(--shadow-card);
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }
    .frame {
      height: 100%; display: grid; grid-template-rows: auto 1fr auto; gap: 2cqi;
      padding: 3.2cqi 4.8cqi; border: 0.5cqi solid var(--green-900); outline: 0.15cqi solid var(--orange-500); outline-offset: -1.2cqi;
      background: linear-gradient(180deg, #fff 70%, var(--lime-100));
    }
    .head { display: flex; align-items: center; justify-content: space-between; gap: 2cqi; }
    /* O logo acompanha a largura da folha (no celular ela tem ~340px; impressa, 297mm). */
    .head app-logo { gap: 1cqi; }
    .head app-logo ::ng-deep svg { width: 6cqi; height: 6cqi; }
    .head app-logo ::ng-deep .wordmark { font-size: 3.8cqi !important; }
    .kicker { font: 700 1.6cqi/1 var(--font-sans); letter-spacing: 0.2em; text-transform: uppercase; color: var(--orange-700); }
    .body { display: grid; align-content: center; justify-items: center; gap: 0.9cqi; text-align: center; }
    .lead { font-size: 1.9cqi; line-height: 1.4; }
    .name { font: 800 4.6cqi/1.1 var(--font-display); color: var(--green-900); overflow-wrap: anywhere; }
    .track { font: 700 2.8cqi/1.2 var(--font-display); overflow-wrap: anywhere; }
    .foot { display: flex; justify-content: space-between; align-items: flex-end; gap: 3cqi; font-size: 1.3cqi; }
    .sign { display: grid; justify-items: center; gap: 0.4cqi; min-width: 24cqi; }
    .line { width: 100%; border-top: 0.12cqi solid #10251a; }
    .who { font: 700 1.7cqi/1 var(--font-display); color: var(--green-900); }
    .role { color: #4a5d52; }
    .check { display: flex; align-items: flex-end; gap: 1.6cqi; min-width: 0; }
    .check-text { display: grid; justify-items: end; gap: 0.3cqi; min-width: 0; text-align: right; color: #4a5d52; }
    .code { font: 700 1.8cqi/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.08em; color: #10251a; }
    .url { overflow-wrap: anywhere; }
    .hash-label { margin-top: 0.5cqi; }
    /* Os 64 caracteres em duas linhas de 4 grupos; o espaço entre eles é só visual (copiar dá o resumo inteiro). */
    .hash {
      display: grid; grid-template-columns: repeat(4, auto); column-gap: 0.7ch;
      font: 500 1.1cqi/1.35 ui-monospace, SFMono-Regular, Menlo, monospace; color: #10251a;
    }
    /* ~27 mm na folha impressa: o tamanho que a câmera do celular lê sem esforço. */
    .qr { flex: none; width: 9cqi; }

    @media print {
      @page { size: A4 landscape; margin: 0; }
      :host { width: 297mm; }
      .sheet { width: 297mm; height: 210mm; border-radius: 0; box-shadow: none; }
    }
  `
})
export class CertificateView {
  readonly certificate = input.required<Certificate>();

  private readonly origin = inject(DOCUMENT).location?.origin ?? '';

  readonly workload = computed(() => formatWorkload(this.certificate().workload_minutes));
  readonly completedAt = computed(() => formatLongDate(this.certificate().completed_at));
  // O QR code leva o endereço completo; impresso ao lado, sem o https://.
  readonly link = computed(() => `${this.origin}/certificados/${this.certificate().code}`);
  readonly validationUrl = computed(() => this.link().replace(/^https?:\/\//, ''));
  // Sem o resumo (API anterior a ele), a linha não aparece.
  readonly hash = computed(() => hashGroups(this.certificate().data_hash ?? ''));
}
