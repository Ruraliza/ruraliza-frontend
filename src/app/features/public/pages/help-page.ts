import { Component } from '@angular/core';
import { HelpCenter } from '@shared/domain/ui/help-center';

// Central de ajuda pública (sem login).
@Component({
  selector: 'app-public-help-page',
  imports: [HelpCenter],
  template: `<app-help-center />`
})
export class HelpPage {}
