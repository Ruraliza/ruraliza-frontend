import { Component, computed, input } from '@angular/core';
import { apiAsset } from '../utils/images';

// Foto de perfil redonda, ou as iniciais quando não há foto.
@Component({
  selector: 'app-avatar',
  host: { '[style.--size.px]': 'size()' },
  template: `
    @if (photoUrl(); as url) {
      <img [src]="src(url)" [alt]="decorative() ? '' : 'Foto de ' + name()" [width]="size()" [height]="size()" loading="lazy" decoding="async" />
    } @else {
      <span [attr.aria-hidden]="decorative() ? 'true' : null" [attr.aria-label]="decorative() ? null : name()">{{ initials() }}</span>
    }
  `,
  styles: `
    :host { display: inline-grid; flex: none; width: var(--size); height: var(--size); border-radius: 50%; overflow: hidden; background: var(--broto-soft); }
    img { width: 100%; height: 100%; object-fit: cover; }
    span { display: grid; place-items: center; color: var(--ink); font: 700 calc(var(--size) * 0.38) / 1 var(--font-display); }
  `
})
export class Avatar {
  readonly name = input.required<string>();
  readonly photoUrl = input<string | null>(null);
  readonly size = input(48);
  readonly decorative = input(true);

  readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('')
  );

  src(url: string): string {
    return apiAsset(url);
  }
}
