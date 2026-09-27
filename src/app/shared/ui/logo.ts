import { Component, input } from '@angular/core';

// Símbolo (duas linhas de plantio que se encontram num ponto ipê) + wordmark "ruraliza".
@Component({
  selector: 'app-logo',
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="16" class="bg" />
      <path d="M12 46 C24 44 30 36 32 24" class="line" />
      <path d="M52 46 C40 44 34 36 32 24" class="line" />
      <path d="M22 52 H42" class="base" />
      <circle cx="32" cy="17" r="4.5" class="dot" />
    </svg>
    @if (wordmark()) { <span class="wordmark">ruraliza</span> }
    @else { <span class="visually-hidden">ruraliza</span> }
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: var(--space-2); color: var(--ink); }
    .bg { fill: var(--logo-bg); }
    .line { stroke: var(--logo-line); stroke-width: 5; fill: none; stroke-linecap: round; }
    .base { stroke: var(--logo-accent); stroke-width: 5; stroke-linecap: round; }
    .dot { fill: var(--logo-accent); }
    .wordmark { font: 700 24px/1 var(--font-display); letter-spacing: -0.02em; }
  `
})
export class Logo {
  readonly size = input(36);
  readonly wordmark = input(true);
}
