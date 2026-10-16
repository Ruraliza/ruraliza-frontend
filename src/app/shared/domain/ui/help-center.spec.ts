import { HelpArticle } from '@core/models/help.model';
import { groupByTopic } from './help-center';

const article = (id: number, topic: HelpArticle['topic']): HelpArticle => ({
  id, question: `P${id}?`, answer: 'r', topic, position: id, published: true, updated_at: '2026-10-16T00:00:00.000Z'
});

describe('groupByTopic', () => {
  it('keeps the API order and labels each topic', () => {
    const groups = groupByTopic([article(1, 'comecar'), article(2, 'comecar'), article(3, 'pagamentos')]);

    expect(groups.map((g) => [g.label, g.articles.map((a) => a.id)])).toEqual([['Primeiros passos', [1, 2]], ['Pagamentos e avaliações', [3]]]);
  });
});
