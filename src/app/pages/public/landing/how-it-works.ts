import { Component, ElementRef, afterRenderEffect, computed, signal, viewChild, viewChildren } from '@angular/core';
import { AppScreen, Phone, ScreenId } from './app-screen';

type Role = 'farmer' | 'worker';

interface Step {
  title: string;
  text: string;
  screen: ScreenId;
}

const STEPS: Record<Role, Step[]> = {
  farmer: [
    { title: 'Publicar serviço', text: 'Diga o que precisa, em qual fazenda, quantas horas e quanto paga.', screen: 'publish' },
    { title: 'Receber candidatos', text: 'Quem sabe fazer se candidata. Você vê experiência e certificados de cada pessoa.', screen: 'candidates' },
    { title: 'Aceitar e liberar pagamento', text: 'Escolha quem vai executar. Quando o serviço termina, você libera o pagamento pelo app.', screen: 'pay' }
  ],
  worker: [
    { title: 'Encontrar vagas perto', text: 'Filtre por categoria e busque pela sua cidade. As vagas mostram local, horas e valor.', screen: 'jobs' },
    { title: 'Candidatar-se', text: 'Um toque para se candidatar. Você acompanha a resposta do produtor em Candidaturas.', screen: 'apply' },
    { title: 'Trabalhar e receber', text: 'Aceito, o serviço fica em andamento. Terminou, o produtor libera o pagamento.', screen: 'earn' }
  ]
};

@Component({
  selector: 'app-how-it-works',
  imports: [AppScreen, Phone],
  templateUrl: './how-it-works.html',
  styleUrl: './how-it-works.css'
})
export class HowItWorks {
  readonly role = signal<Role>('farmer');
  readonly active = signal(0);
  readonly steps = computed(() => STEPS[this.role()]);

  private readonly stepEls = viewChildren<ElementRef<HTMLElement>>('stepEl');
  private readonly carousel = viewChild<ElementRef<HTMLElement>>('carousel');

  constructor() {
    // Desktop: o passo mais perto do meio da tela fica ativo e troca a tela do celular.
    afterRenderEffect((onCleanup) => {
      const elements = this.stepEls();
      if (!elements.length) return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) this.active.set(Number((entry.target as HTMLElement).dataset['index']));
          }
        },
        { rootMargin: '-45% 0px -45% 0px' }
      );
      elements.forEach((el) => observer.observe(el.nativeElement));
      onCleanup(() => observer.disconnect());
    });
  }

  setRole(role: Role): void {
    this.role.set(role);
    this.active.set(0);
    this.carousel()?.nativeElement.scrollTo({ left: 0 });
  }

  // Mobile: o slide visível no carrossel define o passo ativo.
  onCarouselScroll(event: Event): void {
    const el = event.target as HTMLElement;
    this.active.set(Math.round(el.scrollLeft / el.clientWidth));
  }

  goTo(index: number): void {
    const el = this.carousel()?.nativeElement;
    el?.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  }
}
