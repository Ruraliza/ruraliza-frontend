import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../../shared/ui/button';
import { Photo } from './photo';

@Component({
  selector: 'app-final-cta',
  imports: [RouterLink, Button, Photo],
  template: `
    <section class="cta" aria-labelledby="cta-title">
      <app-photo class="bg" file="por-do-sol" [decorative]="true" sizes="100vw" />
      <div class="overlay" aria-hidden="true"></div>
      <div class="container inner">
        <h2 id="cta-title">Vamos para o campo?</h2>
        <p>Crie sua conta e publique o primeiro serviço ou encontre a próxima vaga.</p>
        <div class="ctas">
          <a appButton variant="accent" routerLink="/cadastro/produtor">Preciso de gente no campo</a>
          <a appButton variant="inverse" routerLink="/cadastro/trabalhador">Quero trabalhar</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .cta { position: relative; isolation: isolate; overflow: hidden; padding-block: var(--space-24); color: var(--on-dark); }
    .bg { position: absolute; inset: 0; z-index: -2; }
    .overlay { position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(0,85,42,.9), rgba(0,85,42,.55) 50%, rgba(0,85,42,.08) 85%); }
    .inner { display: grid; gap: var(--space-6); justify-items: start; }
    h2 { font: 800 clamp(40px, 7vw, 80px)/1 var(--font-display); letter-spacing: -0.03em; }
    p { font-size: 18px; line-height: 28px; max-width: 44ch; }
    .ctas { display: flex; flex-wrap: wrap; gap: var(--space-3); }
    @media (max-width: 767px) { .overlay { background: rgba(0,85,42,.84); } }
  `
})
export class FinalCta {}
