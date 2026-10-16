import { Component } from '@angular/core';
import { HelpCenter } from '@shared/domain/ui/help-center';

// Central de ajuda do trabalhador (dentro da área logada).
@Component({
  selector: 'app-worker-help-page',
  imports: [HelpCenter],
  template: `<app-help-center />`
})
export class HelpPage {}
