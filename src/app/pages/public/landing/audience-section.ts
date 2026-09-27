import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../../shared/ui/button';
import { Icon, IconName } from '../../../shared/ui/icon';
import { Photo } from './photo';
import { RevealDirective } from './reveal.directive';
import { TalhaoPattern } from './talhao';

type Audience = 'farmer' | 'worker';

interface AudienceCopy {
  id: string;
  title: string;
  support: string;
  photo: string;
  cta: string;
  link: string;
  benefits: { icon: IconName; title: string; text: string; soon?: boolean }[];
}

const COPY: Record<Audience, AudienceCopy> = {
  farmer: {
    id: 'produtores',
    title: 'Para produtores',
    support: 'Publique o serviço e escolha quem vai executar, sem depender só de indicação.',
    photo: 'produtor',
    cta: 'Publicar meu primeiro serviço',
    link: '/cadastro/produtor',
    benefits: [
      { icon: 'plus', title: 'Publique em poucos passos', text: 'O quê, em qual fazenda, quantas horas e quanto paga.' },
      { icon: 'user', title: 'Conheça quem se candidata', text: 'Experiência e certificados de cada pessoa antes de aceitar.' },
      { icon: 'list', title: 'Acompanhe cada serviço', text: 'Aguardando, em andamento e concluído, tudo num painel.' },
      { icon: 'money', title: 'Libere o pagamento no app', text: 'Quando o serviço termina. Nesta fase, o pagamento é simulado.' }
    ]
  },
  worker: {
    id: 'trabalhadores',
    title: 'Para trabalhadores e estudantes',
    support: 'Encontre serviço no campo perto de você e construa seu histórico de trabalho.',
    photo: 'trabalhador',
    cta: 'Criar meu perfil',
    link: '/cadastro/trabalhador',
    benefits: [
      { icon: 'search', title: 'Vagas claras', text: 'Categoria, cidade, horas e valor antes de se candidatar.' },
      { icon: 'check', title: 'Candidatura com um toque', text: 'E a resposta do produtor aparece nas suas candidaturas.' },
      { icon: 'briefcase', title: 'Histórico de serviços', text: 'Os trabalhos que você fez ficam registrados no seu perfil.' },
      { icon: 'sprout', title: 'Trilhas de qualificação', text: 'Cursos práticos para quem está começando no campo.', soon: true }
    ]
  }
};

// Seção de público. O produtor tem foto à esquerda e bloco lime;
// o trabalhador é espelhado, com foto à direita e bloco laranja.
@Component({
  selector: 'app-audience-section',
  imports: [RouterLink, Button, Icon, Photo, RevealDirective, TalhaoPattern],
  host: { '[class.mirror]': 'audience() === "worker"' },
  templateUrl: './audience-section.html',
  styleUrl: './audience-section.css'
})
export class AudienceSection {
  readonly audience = input.required<Audience>();
  readonly copy = computed(() => COPY[this.audience()]);
}
