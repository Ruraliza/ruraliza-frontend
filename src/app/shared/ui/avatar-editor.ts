import { Component, input, output } from '@angular/core';
import { Avatar } from './avatar';
import { Button } from './button';
import { Icon } from './icon';
import { PhotoPicker } from './photo-picker';

// Foto de perfil com os botões de enviar/trocar e remover. Quem usa faz o envio (API) e passa `busy`.
@Component({
  selector: 'app-avatar-editor',
  imports: [Avatar, Button, Icon, PhotoPicker],
  template: `
    <app-avatar [name]="name()" [photoUrl]="photoUrl()" [size]="96" [decorative]="false" />
    <div class="side">
      <p class="t-label">Foto de perfil</p>
      <p class="t-body-sm muted">Uma foto do rosto ajuda a passar confiança. JPEG, PNG, WebP ou AVIF, até 10 MB.</p>
      <div class="cluster">
        <label class="pick" [class.is-busy]="busy()">
          <input type="file" appPhotoPicker class="visually-hidden" [disabled]="busy()" (photosPicked)="picked.emit($event[0])">
          <app-icon name="plus" [size]="18" />{{ photoUrl() ? 'Trocar foto' : 'Enviar foto' }}
        </label>
        @if (photoUrl()) {
          <button appButton variant="ghost" type="button" [disabled]="busy()" (click)="removed.emit()">Remover foto</button>
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-6); }
    .side { display: grid; gap: var(--space-2); flex: 1; min-width: 220px; }
    .pick {
      display: inline-flex; align-items: center; gap: var(--space-2); min-height: 48px; padding: 0 var(--space-6);
      border: 1px solid var(--line-strong); border-radius: var(--radius-pill); background: var(--surface-raised);
      color: var(--ink); font-weight: 600; cursor: pointer;
    }
    .pick:hover { background: var(--surface-sunken); }
    .pick:focus-within { box-shadow: var(--focus-ring); }
    .pick.is-busy { opacity: .6; pointer-events: none; }
  `
})
export class AvatarEditor {
  readonly name = input.required<string>();
  readonly photoUrl = input<string | null>(null);
  readonly busy = input(false);
  readonly picked = output<Blob>();
  readonly removed = output<void>();
}
