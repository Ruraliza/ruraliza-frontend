import { Component, DOCUMENT, DestroyRef, PLATFORM_ID, afterNextRender, inject, signal } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Button } from '../../../shared/ui/button';
import { CategoryChip } from '../../../shared/ui/category-chip';
import { Icon } from '../../../shared/ui/icon';
import { HERO_ROTATING_WORDS } from './landing-content';
import { Photo, photoSrcset } from './photo';

const ROTATE_MS = 2400;

@Component({
  selector: 'app-hero-section',
  imports: [RouterLink, Button, CategoryChip, Icon, Photo],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css'
})
export class HeroSection {
  readonly lead = ['Mão', 'de', 'obra', 'no', 'campo,'];
  readonly rotating = HERO_ROTATING_WORDS;
  readonly active = signal(0);

  constructor() {
    // No HTML pré-renderizado, pede a foto do hero antes de o navegador ler o CSS inline (LCP).
    if (isPlatformServer(inject(PLATFORM_ID))) {
      const doc = inject(DOCUMENT);
      const link = doc.createElement('link');
      link.setAttribute('rel', 'preload');
      link.setAttribute('as', 'image');
      link.setAttribute('type', 'image/webp');
      link.setAttribute('fetchpriority', 'high');
      link.setAttribute('imagesrcset', photoSrcset('hero-colheita'));
      link.setAttribute('imagesizes', '100vw');
      // Depois do meta viewport: antes dele, o navegador calcula 100vw com 980px e pede a foto de 2400px.
      const viewport = doc.head.querySelector('meta[name="viewport"]');
      doc.head.insertBefore(link, viewport ? viewport.nextSibling : null);
    }

    const destroyRef = inject(DestroyRef);
    // Só no browser, e parado com prefers-reduced-motion.
    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let timer = 0;
      const start = setTimeout(() => {
        timer = window.setInterval(() => this.active.update((i) => (i + 1) % this.rotating.length), ROTATE_MS);
      }, 1600);
      destroyRef.onDestroy(() => {
        clearTimeout(start);
        clearInterval(timer);
      });
    });
  }
}
