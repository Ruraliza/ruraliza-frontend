import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { SponsorService } from '@core/api/sponsor.service';
import { SponsorCard } from '@core/models/sponsor.model';
import { SponsorCardView } from './sponsor-card';

// Espaço de patrocínio (issue #17): pede o cartão da vez para o público e a segmentação conhecida (só a UF e os
// interesses vão na URL, sem login) e mostra o cartão "Patrocinado". Sem patrocínio, não aparece nada.
@Component({
  selector: 'app-sponsor-slot',
  imports: [SponsorCardView],
  template: `@if (card(); as c) { <app-sponsor-card [card]="c" (opened)="sponsors.click($event.id)" /> }`
})
export class SponsorSlot {
  readonly audience = input.required<'farmer' | 'worker'>();
  readonly state = input<string | null>(null);
  readonly categories = input<readonly string[]>([]);

  protected readonly sponsors = inject(SponsorService);
  readonly card = signal<SponsorCard | null>(null);

  constructor() {
    // Pede o cartão quando o público ou a segmentação muda (quem usa só mostra o espaço depois de saber a UF ou
    // os interesses, para não contar duas aparições).
    effect(() => {
      const target = { audience: this.audience(), state: this.state(), categories: this.categories() };
      untracked(() => this.sponsors.slot(target).subscribe({ next: ({ card }) => this.card.set(card), error: () => this.card.set(null) }));
    });
  }
}
