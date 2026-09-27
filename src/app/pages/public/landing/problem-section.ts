import { Component } from '@angular/core';
import { Icon, IconName } from '../../../shared/ui/icon';
import { Photo } from './photo';
import { RevealDirective } from './reveal.directive';

@Component({
  selector: 'app-problem-section',
  imports: [Icon, Photo, RevealDirective],
  template: `
    <section class="problem" aria-labelledby="problema-title">
      <div class="container split">
        <app-photo class="talhao" file="problema" sizes="(min-width: 900px) 50vw, 100vw" />
        <div class="copy">
          <h2 id="problema-title">A safra não espera</h2>
          <p class="support">Quando a lavoura está no ponto, cada dia sem gente vira prejuízo. E quem sabe trabalhar nem sempre sabe onde há serviço.</p>
          <ul class="pains" role="list">
            @for (pain of pains; track pain.title; let i = $index) {
              <li appReveal [revealDelay]="i * 90">
                <span class="icon"><app-icon [name]="pain.icon" /></span>
                <div>
                  <h3>{{ pain.title }}</h3>
                  <p>{{ pain.text }}</p>
                </div>
              </li>
            }
          </ul>
        </div>
      </div>
    </section>
  `,
  styles: `
    .problem { background: var(--bg-alt); padding-block: var(--space-24); }
    .split { display: grid; gap: var(--space-12); align-items: center; }
    .talhao { aspect-ratio: 4 / 3; clip-path: url(#talhao-a); --photo-position: 40% 50%; }
    .copy { display: grid; gap: var(--space-6); }
    h2 { font: 800 clamp(34px, 5vw, 56px)/1.02 var(--font-display); letter-spacing: -0.03em; }
    .support { font-size: 18px; line-height: 28px; color: var(--ink-muted); max-width: 48ch; }
    .pains { display: grid; gap: var(--space-4); }
    .pains li { display: flex; gap: var(--space-4); align-items: flex-start; padding: var(--space-4) 0; border-top: 1px solid var(--line); }
    .icon { display: grid; place-items: center; flex: none; width: 48px; height: 48px; border-radius: 50%; background: var(--orange-100); color: var(--orange-700); }
    h3 { font: 700 20px/28px var(--font-display); }
    .pains p { color: var(--ink-muted); }
    @media (min-width: 900px) {
      .split { grid-template-columns: 1.1fr 1fr; gap: var(--space-16); }
      .talhao { aspect-ratio: 5 / 6; }
    }
  `
})
export class ProblemSection {
  readonly pains: { icon: IconName; title: string; text: string }[] = [
    { icon: 'clock', title: 'Falta gente no momento crítico', text: 'Colheita, plantio e aplicação têm janela curta. Achar mão de obra de última hora é difícil.' },
    { icon: 'user', title: 'Profissional bom sem visibilidade', text: 'Quem tem experiência e certificado depende do boca a boca para encontrar serviço.' },
    { icon: 'alert', title: 'Operação atrasa e custa caro', text: 'Serviço fora de hora afeta a qualidade da safra e o planejamento da fazenda.' }
  ];
}
