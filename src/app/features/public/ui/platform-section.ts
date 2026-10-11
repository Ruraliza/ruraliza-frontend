import { Component } from '@angular/core';
import { AppScreen, Phone, ScreenId } from './app-screen';
import { TalhaoPattern } from './talhao';

// Faixa verde com três telas reais do app, levemente inclinadas.
@Component({
  selector: 'app-platform-section',
  imports: [AppScreen, Phone, TalhaoPattern],
  template: `
    <section class="platform" aria-labelledby="plataforma-title">
      <app-talhao-pattern [density]="18" />
      <div class="container inner">
        <h2 id="plataforma-title">Por dentro da plataforma</h2>
        <p class="support">As mesmas telas que produtores e trabalhadores usam no dia a dia.</p>
        <ul class="shots" role="list">
          @for (s of screens; track s.screen; let i = $index) {
            <li [class]="'shot shot--' + i">
              <app-phone><app-screen [screen]="s.screen" /></app-phone>
              <p class="caption">{{ s.caption }}</p>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    .platform {
      position: relative; overflow: hidden; padding-block: var(--space-24);
      background: var(--green-900); color: var(--on-dark); --pattern-color: var(--lime-500); --pattern-opacity: .16;
    }
    .inner { position: relative; }
    h2 { font: 800 clamp(34px, 5vw, 56px)/1.02 var(--font-display); letter-spacing: -0.03em; }
    .support { margin: var(--space-4) 0 var(--space-12); font-size: 18px; line-height: 28px; max-width: 48ch; text-wrap: pretty; }
    .shots { display: flex; gap: var(--space-8); overflow-x: auto; scroll-snap-type: x mandatory; padding: var(--space-4) var(--space-2) var(--space-6); scrollbar-width: none; }
    .shot { flex: none; display: grid; justify-items: center; gap: var(--space-4); scroll-snap-align: center; }
    .shot app-phone { width: 250px; }
    .caption { font-weight: 600; text-align: center; max-width: 24ch; }
    @media (min-width: 1024px) {
      .shots { justify-content: center; overflow: visible; gap: var(--space-12); }
      .shot app-phone { width: 270px; }
      .shot--0 app-phone { transform: rotate(-4deg) translateY(16px); }
      .shot--2 app-phone { transform: rotate(4deg) translateY(16px); }
    }
  `
})
export class PlatformSection {
  readonly screens: { screen: ScreenId; caption: string }[] = [
    { screen: 'dashboard', caption: 'Painel do produtor com o que precisa de atenção' },
    { screen: 'jobs', caption: 'Lista de vagas abertas, com filtro por categoria' },
    { screen: 'candidates', caption: 'Candidatos de um serviço, prontos para aceitar' }
  ];
}
