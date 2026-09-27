import { Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Button } from '../shared/ui/button';
import { Icon } from '../shared/ui/icon';
import { Logo } from '../shared/ui/logo';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, Button, Icon, Logo],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css'
})
export class PublicLayout {
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);

  private readonly path = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url.split(/[?#]/)[0])
    ),
    { initialValue: this.router.url.split(/[?#]/)[0] }
  );

  // Na landing o header começa transparente sobre a foto do hero.
  readonly isLanding = computed(() => this.path() === '/');
  readonly transparent = computed(() => this.isLanding() && !this.scrolled() && !this.menuOpen());

  readonly links = [
    { label: 'Como funciona', fragment: 'como-funciona' },
    { label: 'Para produtores', fragment: 'produtores' },
    { label: 'Para trabalhadores', fragment: 'trabalhadores' },
    { label: 'Categorias', fragment: 'categorias' },
    { label: 'Dúvidas', fragment: 'duvidas' }
  ];

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const onScroll = () => this.scrolled.set(window.scrollY > 24);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
    });
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    document.body.style.overflow = this.menuOpen() ? 'hidden' : '';
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    document.body.style.overflow = '';
  }
}
