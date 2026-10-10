import { Component, inject, input } from '@angular/core';
import { UserRole } from '../../core/session/current-user.service';
import { RoleSwitchService } from '../../core/session/role-switch.service';
import { Button } from './button';
import { Icon } from './icon';

// "Ir para a área do trabalhador" / "Quero ser produtor", acima do "Sair" nas páginas de perfil
// (no mobile não há sidebar; na sidebar, o AppShell mostra o mesmo item).
@Component({
  selector: 'app-role-switch-button',
  imports: [Button, Icon],
  template: `
    <button appButton variant="secondary" type="button" [loading]="switcher.switching()" (click)="switcher.switchFrom(area())">
      <app-icon name="swap" [size]="20" />{{ switcher.labelFor(area()) }}
    </button>
  `,
  styles: `
    :host { display: contents; }
  `
})
export class RoleSwitchButton {
  // Painel em que a pessoa está agora.
  readonly area = input.required<UserRole>();

  protected readonly switcher = inject(RoleSwitchService);
}
