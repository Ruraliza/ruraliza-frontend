import { Component, computed, input } from '@angular/core';
import { emojiSrc } from '../utils/farm-emoji';

// Emoji do campo como imagem (mesmo visual em qualquer celular). Decorativo, a não ser que receba `label`.
@Component({
  selector: 'app-farm-emoji',
  host: { '[style.--size.px]': 'size()' },
  template: `<img [src]="src()" [alt]="label()" [width]="size()" [height]="size()" loading="lazy" decoding="async" draggable="false" />`,
  styles: `
    :host { display: inline-grid; place-items: center; line-height: 0; }
    img { width: var(--size); height: var(--size); user-select: none; }
  `
})
export class FarmEmoji {
  readonly emoji = input.required<string>();
  readonly size = input(48);
  readonly label = input('');

  readonly src = computed(() => emojiSrc(this.emoji()));
}
