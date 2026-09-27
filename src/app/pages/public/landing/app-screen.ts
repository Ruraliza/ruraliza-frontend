import { Component, input } from '@angular/core';
import { CategoryChip } from '../../../shared/ui/category-chip';
import { Icon } from '../../../shared/ui/icon';
import { StatusBadge } from '../../../shared/ui/status-badge';

export type ScreenId = 'publish' | 'candidates' | 'pay' | 'jobs' | 'apply' | 'earn' | 'dashboard';

// Telas do app em miniatura para a landing (dados de exemplo, não interativas).
// Usam os mesmos componentes de status e categoria das telas reais.
@Component({
  selector: 'app-screen',
  imports: [CategoryChip, Icon, StatusBadge],
  host: { 'aria-hidden': 'true' },
  templateUrl: './app-screen.html',
  styleUrl: './app-screen.css'
})
export class AppScreen {
  readonly screen = input.required<ScreenId>();

  readonly workers = [
    { initials: 'MS', name: 'Maria Souza', exp: '6 anos em colheita de café' },
    { initials: 'JP', name: 'João Pedro', exp: 'Estudante de agronomia' }
  ];
  readonly jobs = [
    { name: 'Colheita de café', place: 'Três Rios, RJ', price: 'R$ 1.800,00' },
    { name: 'Plantio de milho', place: 'Paraíba do Sul, RJ', price: 'R$ 1.200,00' }
  ];
}

// Moldura de celular em CSS.
@Component({
  selector: 'app-phone',
  template: `<div class="notch"></div><div class="display"><ng-content /></div>`,
  styles: `
    :host {
      position: relative; display: block; width: 300px; max-width: 100%; aspect-ratio: 9 / 18.5;
      padding: 12px; border-radius: 44px; background: var(--ink); box-shadow: var(--shadow-float);
    }
    .notch { position: absolute; top: 20px; left: 50%; width: 84px; height: 22px; margin-left: -42px; border-radius: 999px; background: var(--ink); z-index: 2; }
    .display { position: relative; height: 100%; overflow: hidden; border-radius: 33px; background: var(--bg); }
  `
})
export class Phone {}
