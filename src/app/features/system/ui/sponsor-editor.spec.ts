import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CategoryService } from '@core/api/category.service';
import { SponsorInput } from '@core/models/sponsor.model';
import { SponsorEditor } from './sponsor-editor';

describe('SponsorEditor', () => {
  function render(): { editor: SponsorEditor; saved: SponsorInput[] } {
    TestBed.configureTestingModule({ providers: [{ provide: CategoryService, useValue: { getCategories: () => of(['Colheita', 'Plantio']) } }] });
    const fixture = TestBed.createComponent(SponsorEditor);
    fixture.detectChanges();
    const saved: SponsorInput[] = [];
    fixture.componentInstance.saved.subscribe((input) => saved.push(input));
    return { editor: fixture.componentInstance, saved };
  }

  it('only sends a sponsor with an https link', () => {
    const { editor, saved } = render();
    editor.form.patchValue({ sponsor: 'Loja', title: 'Oferta', url: 'http://loja.com' });

    editor.submit();

    expect(saved).toEqual([]);
    expect(editor.form.controls.url.hasError('pattern')).toBe(true);
  });

  it('sends the targeting and drops the interests when the ad is only for farmers', () => {
    const { editor, saved } = render();
    editor.form.patchValue({ sponsor: ' Loja ', title: 'Oferta', url: 'https://loja.com.br', audience: 'farmer' });
    editor.toggle('states', 'RJ');
    editor.toggle('states', 'MG');
    editor.toggle('states', 'RJ');
    editor.toggle('categories', 'Colheita');

    editor.submit();

    expect(saved).toEqual([{
      sponsor: 'Loja', title: 'Oferta', text: null, cta_label: 'Ver a oferta', url: 'https://loja.com.br', audience: 'farmer',
      states: ['MG'], categories: [], starts_on: null, ends_on: null, active: true
    }]);
  });

  it('shows a preview with placeholders while the form is empty', () => {
    const { editor } = render();

    expect([editor.preview().sponsor, editor.preview().title]).toEqual(['Nome do anunciante', 'A chamada aparece aqui']);
  });
});
