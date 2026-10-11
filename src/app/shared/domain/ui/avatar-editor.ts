import { Component, inject, input, output, signal } from '@angular/core';
import { ToastService } from '@core/toast/toast.service';
import { ACCEPTED_PHOTOS, PhotoError, loadPhoto } from '../../utils/images';
import { Avatar } from './avatar';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { PhotoCropDialog } from '../../ui/photo-crop-dialog';

// Foto de perfil com os botões de enviar/trocar e remover. Antes do envio, a foto escolhida passa
// pelo recorte quadrado. Quem usa faz o envio (API) e passa `busy`.
@Component({
  selector: 'app-avatar-editor',
  imports: [Avatar, Button, Icon, PhotoCropDialog],
  template: `
    <app-avatar [name]="name()" [photoUrl]="photoUrl()" [size]="96" [decorative]="false" />
    <div class="side">
      <p class="t-label">Foto de perfil</p>
      <p class="t-body-sm muted">Uma foto do rosto ajuda a passar confiança. JPEG, PNG, WebP ou AVIF, até 10 MB.</p>
      <div class="cluster">
        <label class="pick" [class.is-busy]="busy()">
          <input type="file" class="visually-hidden" [accept]="accept" [disabled]="busy()" (change)="onFileChange($event)">
          <app-icon name="plus" [size]="18" />{{ photoUrl() ? 'Trocar foto' : 'Enviar foto' }}
        </label>
        @if (photoUrl()) {
          <button appButton variant="ghost" type="button" [disabled]="busy()" (click)="removed.emit()">Remover foto</button>
        }
      </div>
    </div>
    <app-photo-crop-dialog [photo]="cropping()" (cropped)="onCropped($event)" (cancelled)="closeCrop()" />
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

  readonly accept = ACCEPTED_PHOTOS;
  readonly cropping = signal<ImageBitmap | null>(null);
  private readonly toast = inject(ToastService);

  async onFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permite escolher o mesmo arquivo de novo
    if (!file) return;
    try {
      const bitmap = await loadPhoto(file);
      // Formato que o navegador não abre (ex.: HEIC): vai o original e o servidor recorta o centro.
      if (bitmap) this.cropping.set(bitmap);
      else this.picked.emit(file);
    } catch (error) {
      this.toast.error(error instanceof PhotoError ? error.message : 'Não foi possível ler a foto. Tente outra imagem.');
    }
  }

  onCropped(photo: Blob): void {
    this.closeCrop();
    this.picked.emit(photo);
  }

  closeCrop(): void {
    this.cropping()?.close();
    this.cropping.set(null);
  }
}
