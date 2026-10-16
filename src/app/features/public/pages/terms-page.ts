import { Component } from '@angular/core';
import { TERMS_OF_USE } from '../models/legal-content';
import { LegalDocumentView } from '../ui/legal-document';

// Termos de Uso (aceitos no cadastro; versão em core/models/legal.ts).
@Component({
  selector: 'app-terms-page',
  imports: [LegalDocumentView],
  template: `<app-legal-document [doc]="doc" [other]="{ label: 'Leia também a Política de Privacidade', link: '/privacidade' }" />`
})
export class TermsPage {
  readonly doc = TERMS_OF_USE;
}
