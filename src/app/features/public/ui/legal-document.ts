import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TERMS_VERSION_LABEL } from '@core/models/legal';
import { Icon } from '@shared/ui/icon';
import { LegalDocument } from '../models/legal-content';

// Página de documento legal (Termos de Uso, Política de Privacidade): resumo em linguagem simples no topo,
// sumário fixo ao lado no desktop e as cláusulas numeradas (o número é o que se cita numa conversa).
@Component({
  selector: 'app-legal-document',
  imports: [RouterLink, Icon],
  template: `
    <article class="container doc">
      <header class="head">
        <h1>{{ doc().title }}</h1>
        <p class="version t-body-sm">Versão de {{ version }}</p>
        <p class="intro">{{ doc().intro }}</p>
        <p class="t-body-sm"><a [routerLink]="other().link">{{ other().label }}</a></p>
      </header>

      <section class="summary" aria-labelledby="resumo">
        <h2 id="resumo" class="t-h3">Em resumo</h2>
        <ul role="list">
          @for (item of doc().summary; track item) {
            <li><app-icon name="check" [size]="20" />{{ item }}</li>
          }
        </ul>
      </section>

      <div class="body">
        <nav class="toc" aria-label="Nesta página">
          <p class="t-label muted">Nesta página</p>
          <ol>
            @for (section of doc().sections; track section.id; let i = $index) {
              <li><a [href]="'#' + section.id" (click)="jump($event, section.id)">{{ section.title }}</a></li>
            }
          </ol>
        </nav>

        <div class="sections">
          @for (section of doc().sections; track section.id; let i = $index) {
            <section [id]="section.id" [attr.aria-labelledby]="section.id + '-title'">
              <h2 [id]="section.id + '-title'"><span class="num">{{ i + 1 }}.</span> {{ section.title }}</h2>
              @for (block of section.blocks; track $index) {
                @if ('p' in block) { <p>{{ block.p }}</p> }
                @else { <ul>@for (item of block.list; track item) { <li>{{ item }}</li> }</ul> }
              }
            </section>
          }
        </div>
      </div>
    </article>
  `,
  styles: `
    .doc { display: grid; gap: var(--space-8); padding-block: var(--space-8) var(--space-16); }
    .head { display: grid; gap: var(--space-3); max-width: 72ch; }
    .head h1 { font: 800 clamp(2.25rem, 6vw, 3.25rem)/1.05 var(--font-display); letter-spacing: -0.02em; }
    .version { color: var(--ink-muted); font-weight: 600; }
    .intro { font-size: 1.125rem; line-height: 1.75rem; color: var(--ink); text-wrap: pretty; }
    .summary { max-width: 72ch; display: grid; gap: var(--space-3); padding: var(--space-6); border-radius: var(--radius-lg); background: var(--bg-alt); }
    .summary ul { display: grid; gap: var(--space-3); }
    .summary li { display: grid; grid-template-columns: auto 1fr; gap: var(--space-3); align-items: start; line-height: 1.5rem; }
    .summary app-icon { color: var(--mata); margin-top: 2px; }
    .body { display: grid; gap: var(--space-8); }
    .toc ol { display: grid; gap: var(--space-1); margin: var(--space-2) 0 0; padding-left: 1.4em; color: var(--ink-muted); }
    .toc a { display: block; padding-block: 0.3125rem; font-weight: 600; text-decoration: none; }
    .toc a:hover { text-decoration: underline; }
    .sections { display: grid; gap: var(--space-8); max-width: 72ch; }
    section { display: grid; gap: var(--space-3); scroll-margin-top: calc(var(--header-offset) + var(--space-4)); }
    section h2 { font: 700 1.375rem/1.75rem var(--font-display); text-wrap: balance; }
    .num { color: var(--mata); font-variant-numeric: tabular-nums; }
    section p, section li { font-size: 1.0625rem; line-height: 1.75rem; text-wrap: pretty; }
    section ul { display: grid; gap: var(--space-2); padding-left: 1.25em; }
    section li::marker { color: var(--mata); }
    @media (max-width: 1023px) { .toc { display: none; } }
    @media (min-width: 1024px) {
      .body { grid-template-columns: 260px minmax(0, 1fr); align-items: start; }
      .toc { position: sticky; top: calc(var(--header-offset) + var(--space-6)); }
    }
    @media print { .toc { display: none; } .summary { break-inside: avoid; } }
  `
})
export class LegalDocumentView {
  readonly doc = input.required<LegalDocument>();
  readonly other = input.required<{ label: string; link: string }>();
  readonly version = TERMS_VERSION_LABEL;

  // Âncora sem mudar a rota (o RouterLink com fragment rolaria a página inteira de novo).
  jump(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `${location.pathname}#${id}`);
  }
}
