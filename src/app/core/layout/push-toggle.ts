import { Component, inject } from '@angular/core';
import { PushService } from '../pwa/push.service';
import { Button } from '@shared/ui/button';
import { Icon } from '@shared/ui/icon';

// Liga/desliga as notificações push neste aparelho (páginas de perfil, perto do "Sair").
// Vale para os dois perfis da conta. Sem suporte no navegador, não aparece.
@Component({
  selector: 'app-push-toggle',
  imports: [Button, Icon],
  template: `
    @switch (push.state()) {
      @case ('off') {
        <button appButton variant="secondary" type="button" [loading]="push.busy()" (click)="push.enable()">
          <app-icon name="bell" [size]="20" />Ativar notificações
        </button>
      }
      @case ('on') {
        <button appButton variant="secondary" type="button" [loading]="push.busy()" (click)="push.disable()">
          <app-icon name="bell" [size]="20" />Desativar notificações
        </button>
      }
      @case ('denied') {
        <p class="blocked"><app-icon name="bell" [size]="18" />Notificações bloqueadas no navegador. Libere nas configurações do site para recebê-las.</p>
      }
    }
  `,
  styles: `
    :host { display: contents; }
    .blocked { flex-basis: 100%; display: flex; align-items: center; gap: var(--space-2); color: var(--ink-muted); font-size: 14px; }
  `
})
export class PushToggle {
  protected readonly push = inject(PushService);
}
