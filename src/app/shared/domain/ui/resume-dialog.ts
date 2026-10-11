import { Component, ElementRef, afterRenderEffect, computed, inject, input, output, viewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { apiAsset } from '../../utils/images';
import { Button } from '../../ui/button';

// Currículo (PDF) em <dialog> modal, no visualizador de PDF do próprio navegador.
// Aberto enquanto `url` não for null; o PDF só é carregado ao abrir.
// Celulares que não mostram PDF embutido têm o link "Baixar PDF" como alternativa.
@Component({
  selector: 'app-resume-dialog',
  imports: [Button],
  template: `
    <dialog #dialog aria-labelledby="resume-title" (cancel)="onCancel($event)">
      <div class="head">
        <h2 id="resume-title">Currículo de {{ name() }}</h2>
        <button appButton variant="ghost" type="button" (click)="closed.emit()">Fechar</button>
      </div>
      @if (src(); as src) {
        <iframe [src]="src" [title]="'Currículo de ' + name()"></iframe>
        <p class="t-body-sm muted">
          O currículo não apareceu? <a [href]="href()" target="_blank" rel="noopener">Baixar PDF</a>
        </p>
      }
    </dialog>
  `,
  styles: `
    dialog {
      width: min(960px, calc(100vw - 2 * var(--space-4)));
      height: min(1100px, calc(100dvh - 2 * var(--space-4)));
      padding: var(--space-6); border: 0; border-radius: var(--radius-lg);
      background: var(--surface-raised); color: var(--ink); box-shadow: var(--shadow-float);
    }
    dialog::backdrop { background: var(--scrim); }
    dialog[open] { display: grid; grid-template-rows: auto 1fr auto; gap: var(--space-4); }
    .head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }
    h2 { margin: 0; overflow-wrap: anywhere; }
    p { margin: 0; }
    iframe { width: 100%; height: 100%; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--surface-sunken); }
    @media (max-width: 479px) {
      dialog { padding: var(--space-4); }
    }
  `
})
export class ResumeDialog {
  // resume_url do trabalhador (relativa à API); null = fechado.
  readonly url = input.required<string | null>();
  readonly name = input.required<string>();
  readonly closed = output<void>();

  private readonly sanitizer = inject(DomSanitizer);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly href = computed(() => {
    const url = this.url();
    return url ? apiAsset(url) : '';
  });
  // A URL vem da própria API (apiAsset), por isso pode ir para o iframe.
  readonly src = computed<SafeResourceUrl | null>(() =>
    this.href() ? this.sanitizer.bypassSecurityTrustResourceUrl(this.href()) : null
  );

  constructor() {
    afterRenderEffect(() => {
      const element = this.dialog().nativeElement;
      const open = this.url() !== null;
      if (open && !element.open) element.showModal();
      if (!open && element.open) element.close();
    });
  }

  // Esc: fecha pelo fluxo normal.
  onCancel(event: Event): void {
    event.preventDefault();
    this.closed.emit();
  }
}
