import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

// Revela o elemento ao entrar na tela: sobe 16px e vai de 40% a 100% de opacidade.
// O estado inicial só é aplicado no browser (SSR e sem JS mostram tudo pronto)
// e nada acontece com prefers-reduced-motion.
@Directive({ selector: '[appReveal]' })
export class RevealDirective {
  readonly revealDelay = input(0);

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      element.style.setProperty('--reveal-delay', `${this.revealDelay()}ms`);
      element.classList.add('reveal-armed');
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          element.classList.add('reveal-in');
          observer.disconnect();
        },
        { rootMargin: '0px 0px -10% 0px' }
      );
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
