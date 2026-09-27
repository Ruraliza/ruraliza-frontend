import { Component, computed, input } from '@angular/core';
import { photo } from './landing-content';

const WIDTHS = [480, 800, 1600, 2400];

export function photoSrcset(file: string): string {
  return WIDTHS.map((w) => `assets/images/landing/${file}-${w}.webp ${w}w`).join(', ');
}

// Foto local da landing em WebP com srcset. `priority` só no hero (LCP).
@Component({
  selector: 'app-photo',
  template: `
    <img
      [src]="src()"
      [srcset]="srcset()"
      [sizes]="sizes()"
      [width]="meta().width"
      [height]="meta().height"
      [alt]="decorative() ? '' : meta().alt"
      [attr.loading]="priority() ? 'eager' : 'lazy'"
      [attr.fetchpriority]="priority() ? 'high' : null"
      decoding="async"
    />
  `,
  styles: `
    :host { display: block; overflow: hidden; }
    img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: var(--photo-position, center); }
  `
})
export class Photo {
  readonly file = input.required<string>();
  readonly sizes = input('100vw');
  readonly priority = input(false);
  readonly decorative = input(false);

  readonly meta = computed(() => photo(this.file()));
  readonly src = computed(() => `assets/images/landing/${this.file()}-1600.webp`);
  readonly srcset = computed(() => photoSrcset(this.file()));
}
