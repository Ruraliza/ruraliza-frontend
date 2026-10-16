import { Component } from '@angular/core';
import { PRIVACY_POLICY } from '../models/legal-content';
import { LegalDocumentView } from '../ui/legal-document';

// Política de Privacidade (LGPD; aceita no cadastro junto com os Termos de Uso).
@Component({
  selector: 'app-privacy-page',
  imports: [LegalDocumentView],
  template: `<app-legal-document [doc]="doc" [other]="{ label: 'Leia também os Termos de Uso', link: '/termos' }" />`
})
export class PrivacyPage {
  readonly doc = PRIVACY_POLICY;
}
