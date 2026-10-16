import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HelpService } from '@core/api/help.service';
import { HelpArticle, HelpTopic } from '@core/models/help.model';
import { RemoteData } from '../../utils/remote-data';
import { matchesAllWords } from '../../utils/search';
import { Button } from '../../ui/button';
import { EmptyState } from '../../ui/empty-state';
import { ErrorState } from '../../ui/error-state';
import { Icon } from '../../ui/icon';
import { Skeleton } from '../../ui/skeleton';
import { CategoryChip } from './category-chip';

export const HELP_TOPIC_LABEL: Record<HelpTopic, string> = {
  comecar: 'Primeiros passos',
  produtores: 'Para produtores',
  trabalhadores: 'Para trabalhadores',
  pagamentos: 'Pagamentos e avaliações',
  seguranca: 'Segurança e privacidade',
  trilhas: 'Trilhas e certificados',
  conta: 'Conta e acesso'
};

interface TopicGroup {
  topic: HelpTopic;
  label: string;
  articles: HelpArticle[];
}

// Agrupa as perguntas (já na ordem da API) pelo tema, mantendo a ordem dos temas.
export function groupByTopic(articles: readonly HelpArticle[]): TopicGroup[] {
  const groups: TopicGroup[] = [];
  for (const article of articles) {
    const last = groups.at(-1);
    if (last?.topic === article.topic) last.articles.push(article);
    else groups.push({ topic: article.topic, label: HELP_TOPIC_LABEL[article.topic], articles: [article] });
  }
  return groups;
}

// Central de ajuda (issue #34): busca sem acento nas perguntas e respostas, filtro por tema e as respostas
// abrindo no lugar (<details>, acessível sem script). Aparece em /ajuda e dentro das áreas logadas.
@Component({
  selector: 'app-help-center',
  imports: [RouterLink, Button, CategoryChip, EmptyState, ErrorState, Icon, Skeleton],
  template: `
    <div class="container page help">
      <div class="page-header">
        <div>
          <h1>Central de ajuda</h1>
          <p class="muted">Respostas diretas sobre como o Ruraliza funciona hoje.</p>
        </div>
      </div>

      <label class="search">
        <span class="visually-hidden">Buscar uma dúvida</span>
        <app-icon name="search" [size]="20" />
        <input type="search" placeholder="Busque: pagamento, senha, certificado…" [value]="query()" (input)="query.set($any($event.target).value)">
      </label>

      @switch (articles.state().status) {
        @case ('loading') { <app-skeleton [count]="5" [height]="64" /> }
        @case ('error') { <app-error-state [message]="articles.error()" (retry)="articles.load()" /> }
        @case ('success') {
          <div class="topics" role="group" aria-label="Temas">
            <button appCategoryChip [interactive]="true" [selected]="topic() === null" (click)="topic.set(null)">Todos</button>
            @for (t of topics(); track t.topic) {
              <button appCategoryChip [interactive]="true" [selected]="topic() === t.topic" (click)="topic.set(t.topic)">{{ t.label }}</button>
            }
          </div>

          @if (query().trim()) {
            <p class="t-body-sm muted" role="status">{{ resultLabel() }}</p>
          }

          @for (group of groups(); track group.topic) {
            <section class="group" [attr.aria-labelledby]="'tema-' + group.topic">
              <h2 class="t-h3" [id]="'tema-' + group.topic">{{ group.label }}</h2>
              <div class="list">
                @for (article of group.articles; track article.id) {
                  <details>
                    <summary><span>{{ article.question }}</span><app-icon name="plus" [size]="20" /></summary>
                    <div class="answer">@for (paragraph of paragraphs(article.answer); track $index) { <p>{{ paragraph }}</p> }</div>
                  </details>
                }
              </div>
            </section>
          } @empty {
            <app-empty-state icon="search" title="Nenhuma resposta para essa busca" message="Tente outra palavra, como pagamento, senha ou candidatura.">
              <button appButton variant="secondary" type="button" (click)="clear()">Limpar busca</button>
            </app-empty-state>
          }

          <p class="legal t-body-sm muted">
            Regras do Ruraliza: <a routerLink="/termos">Termos de Uso</a> e <a routerLink="/privacidade">Política de Privacidade</a>.
          </p>
        }
      }
    </div>
  `,
  styles: `
    .help { max-width: 840px; }
    .search { position: relative; display: block; }
    .search app-icon { position: absolute; left: 14px; top: 14px; color: var(--ink-muted); pointer-events: none; }
    .search input { padding-left: 44px; border-radius: var(--radius-pill); }
    .topics { display: flex; gap: var(--space-2); overflow-x: auto; padding-bottom: var(--space-1); scrollbar-width: thin; }
    .group { display: grid; gap: var(--space-3); }
    .list { border-top: 1px solid var(--line); }
    details { border-bottom: 1px solid var(--line); }
    summary {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-4);
      min-height: 56px; padding-block: var(--space-3); cursor: pointer; list-style: none; font-weight: 700;
    }
    summary::-webkit-details-marker { display: none; }
    summary app-icon { flex: none; color: var(--mata); transition: transform .2s var(--ease-out); }
    details[open] summary app-icon { transform: rotate(45deg); }
    .answer { display: grid; gap: var(--space-2); padding-bottom: var(--space-4); max-width: 68ch; color: var(--ink-muted); }
    .legal { padding-top: var(--space-4); border-top: 1px solid var(--line); }
  `
})
export class HelpCenter {
  private readonly help = inject(HelpService);

  readonly articles = new RemoteData(() => this.help.list());
  readonly query = signal('');
  readonly topic = signal<HelpTopic | null>(null);

  // Temas que têm pergunta publicada, na ordem da API.
  readonly topics = computed(() => groupByTopic(this.articles.data() ?? []).map(({ topic, label }) => ({ topic, label })));

  readonly filtered = computed(() => {
    const query = this.query().trim();
    const topic = this.topic();
    return (this.articles.data() ?? []).filter(
      (a) => (topic === null || a.topic === topic) && (!query || matchesAllWords(`${a.question} ${a.answer}`, query))
    );
  });
  readonly groups = computed(() => groupByTopic(this.filtered()));
  readonly resultLabel = computed(() => {
    const count = this.filtered().length;
    return count === 1 ? '1 resposta encontrada' : `${count} respostas encontradas`;
  });

  constructor() {
    this.articles.load();
  }

  paragraphs(answer: string): string[] {
    return answer.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  }

  clear(): void {
    this.query.set('');
    this.topic.set(null);
  }
}
