import { Component } from '@angular/core';
import { Icon } from '../../../shared/ui/icon';

// Dúvidas frequentes com <details>: acessível por padrão, sem JavaScript.
@Component({
  selector: 'app-faq-section',
  imports: [Icon],
  template: `
    <section id="duvidas" class="faq" aria-labelledby="duvidas-title">
      <div class="container grid">
        <div>
          <h2 id="duvidas-title">Dúvidas frequentes</h2>
          <p class="support">Respostas diretas sobre como a RURALIZA funciona hoje.</p>
        </div>
        <div class="list">
          @for (q of questions; track q.q) {
            <details>
              <summary>{{ q.q }}<app-icon name="plus" /></summary>
              <p>{{ q.a }}</p>
            </details>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .faq { padding-block: var(--space-24); background: var(--bg); scroll-margin-top: var(--header-height); }
    .grid { display: grid; gap: var(--space-8); }
    @media (min-width: 1024px) { .grid { grid-template-columns: 1fr 1.6fr; gap: var(--space-16); } }
    h2 { font: 800 clamp(34px, 5vw, 56px)/1.02 var(--font-display); letter-spacing: -0.03em; }
    .support { margin-top: var(--space-4); font-size: 18px; line-height: 28px; color: var(--ink-muted); }
    .list { border-top: 1px solid var(--line); }
    details { border-bottom: 1px solid var(--line); }
    summary {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-4);
      min-height: 64px; padding-block: var(--space-4); cursor: pointer; list-style: none;
      font: 700 20px/28px var(--font-display);
    }
    summary::-webkit-details-marker { display: none; }
    summary app-icon { flex: none; color: var(--green-900); transition: transform .3s var(--ease-out); }
    details[open] summary app-icon { transform: rotate(45deg); }
    details p { padding-bottom: var(--space-6); font-size: 18px; line-height: 28px; color: var(--ink-muted); max-width: 62ch; }
  `
})
export class FaqSection {
  readonly questions = [
    { q: 'Quem pode se cadastrar?', a: 'Produtores rurais que precisam de mão de obra e trabalhadores, prestadores de serviço e estudantes que querem trabalhar no campo. O cadastro pede nome, e-mail, telefone e CPF.' },
    { q: 'Quanto custa?', a: 'Nesta fase de testes não há cobrança para produtores nem para trabalhadores.' },
    { q: 'Como funciona o pagamento?', a: 'Hoje o pagamento é simulado: quando o serviço termina, o produtor libera o pagamento no app e ele fica registrado no serviço. Nenhum dinheiro é movimentado.' },
    { q: 'Estudantes podem usar?', a: 'Sim. Estudantes se cadastram como trabalhadores e se candidatam às vagas. As trilhas de qualificação, pensadas também para estudantes, estão em desenvolvimento.' },
    { q: 'Como sou avaliado?', a: 'Ainda não há avaliações. Hoje o produtor decide com base na experiência e nos certificados informados no seu perfil.' },
    { q: 'Meus dados estão seguros?', a: 'Este é um ambiente de teste: os dados ficam só na memória do servidor e são apagados quando ele reinicia. Para outros usuários o CPF aparece mascarado. Evite usar dados reais por enquanto.' }
  ];
}
