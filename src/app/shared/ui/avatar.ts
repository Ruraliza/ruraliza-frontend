import { Component, computed, input } from '@angular/core';
import { PROFILE_EMOJIS, pickEmoji } from '../utils/farm-emoji';
import { apiAsset } from '../utils/images';
import { FarmEmoji } from './farm-emoji';

// Foto de perfil redonda, ou um emoji do campo (sempre o mesmo para o mesmo nome) quando não há foto.
@Component({
  selector: 'app-avatar',
  imports: [FarmEmoji],
  host: { '[style.--size.px]': 'size()' },
  template: `
    @if (photoUrl(); as url) {
      <img [src]="src(url)" [alt]="decorative() ? '' : 'Foto de ' + name()" [width]="size()" [height]="size()" loading="lazy" decoding="async" />
    } @else {
      <app-farm-emoji [emoji]="emoji()" [size]="emojiSize()" [label]="decorative() ? '' : name()" />
    }
  `,
  styles: `
    :host { display: inline-grid; flex: none; width: var(--size); height: var(--size); border-radius: 50%; overflow: hidden; background: var(--broto-soft); }
    img { width: 100%; height: 100%; object-fit: cover; }
    app-farm-emoji { place-self: center; }
  `
})
export class Avatar {
  readonly name = input.required<string>();
  readonly photoUrl = input<string | null>(null);
  readonly size = input(48);
  readonly decorative = input(true);

  readonly emojiSize = computed(() => Math.round(this.size() * 0.56));
  readonly emoji = computed(() => pickEmoji(this.name().trim().toLowerCase(), PROFILE_EMOJIS));

  src(url: string): string {
    return apiAsset(url);
  }
}
