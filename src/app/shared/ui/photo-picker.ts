import { Directive, ElementRef, inject, input, output } from '@angular/core';
import { ToastService } from '../../core/toast/toast.service';
import { ACCEPTED_PHOTOS, PhotoError, preparePhoto } from '../utils/images';

// Transforma um <input type="file"> em seletor de fotos: aceita só imagens, reduz no navegador
// (≤ 1000px, WebP) e emite os arquivos prontos para envio. Uso:
// <input type="file" appPhotoPicker [multiple]="true" (photosPicked)="upload($event)">
@Directive({
  selector: 'input[type=file][appPhotoPicker]',
  host: { '[attr.accept]': 'accept', '(change)': 'onChange()' }
})
export class PhotoPicker {
  readonly max = input(1); // quantos arquivos aceitar de uma vez
  readonly photosPicked = output<Blob[]>();

  readonly accept = ACCEPTED_PHOTOS;
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly toast = inject(ToastService);

  async onChange(): Promise<void> {
    const files = Array.from(this.input.files ?? []);
    this.input.value = ''; // permite escolher o mesmo arquivo de novo
    if (files.length === 0) return;
    if (files.length > this.max()) {
      this.toast.error(this.max() === 1 ? 'Escolha uma foto só.' : `Escolha até ${this.max()} fotos.`);
      return;
    }
    try {
      this.photosPicked.emit(await Promise.all(files.map(preparePhoto)));
    } catch (error) {
      this.toast.error(error instanceof PhotoError ? error.message : 'Não foi possível ler a foto. Tente outra imagem.');
    }
  }
}
