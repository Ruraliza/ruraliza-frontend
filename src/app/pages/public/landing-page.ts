import { Component, afterNextRender, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../core/api/category.service';
import { RemoteData } from '../../shared/utils/remote-data';
import { Button } from '../../shared/ui/button';
import { CategoryChip } from '../../shared/ui/category-chip';
import { ErrorState } from '../../shared/ui/error-state';
import { Icon } from '../../shared/ui/icon';
import { Skeleton } from '../../shared/ui/skeleton';

// Linhas de plantio do hero em perspectiva: cada linha é um triângulo fino que
// sai da base e converge no ponto de fuga, onde nasce o sol (como no logo).
const VANISHING_X = 600;
const HORIZON_Y = 60;
const BOTTOM_Y = 360;
const ROW_HALF_WIDTH = 22;
const FIELD_ROWS = Array.from({ length: 31 }, (_, i) => -1800 + i * 160).map(
  (x) => `${x - ROW_HALF_WIDTH},${BOTTOM_Y} ${x + ROW_HALF_WIDTH},${BOTTOM_Y} ${VANISHING_X},${HORIZON_Y}`
);

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, Button, CategoryChip, ErrorState, Icon, Skeleton],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css'
})
export class LandingPage {
  private readonly categoryService = inject(CategoryService);

  readonly categories = new RemoteData(() => this.categoryService.getCategories());
  readonly fieldRows = FIELD_ROWS;

  readonly steps = [
    { title: 'Publicar', text: 'O produtor diz o que precisa, em qual fazenda, quantas horas e quanto paga.' },
    { title: 'Candidatar-se', text: 'Quem sabe fazer encontra a vaga pela categoria e se candidata.' },
    { title: 'Aceitar e pagar', text: 'O produtor escolhe quem vai fazer e libera o pagamento no final.' }
  ];

  constructor() {
    // A landing é pré-renderizada no build: as categorias vêm só no browser.
    afterNextRender(() => this.categories.load());
  }
}
