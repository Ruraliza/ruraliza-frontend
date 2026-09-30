import { Component, computed, input, output } from '@angular/core';

import { Icon } from './icon';
import { PhotoPicker } from './photo-picker';

export interface GridPhoto {
  id: string;
  src: string; // URL pronta para <img> (da API ou local, antes do envio)
}

// Grade de fotos com adicionar (várias de uma vez, até `max`) e remover. A primeira é a capa.
@Component({
  selector: 'app-photo-grid-editor',
  imports: [Icon, PhotoPicker],
  template: `
    <div class="head">
      <p class="t-label">{{ label() }} <span class="muted">({{ photos().length }} de {{ max() }})</span></p>
      <p class="t-body-sm muted">A primeira foto é a capa. Mostre a área, a estrutura e o acesso.</p>
    </div>
    <ul class="grid" role="list">
      @for (photo of photos(); track photo.id; let first = $first) {
        <li class="tile">
          <img [src]="photo.src" [alt]="first ? 'Foto de capa' : 'Foto da fazenda'" loading="lazy" decoding="async" />
          @if (first) { <span class="cover">Capa</span> }
          <button type="button" class="remove" [disabled]="busy()" [attr.aria-label]="'Remover foto ' + ($index + 1)" (click)="removed.emit(photo.id)">
            <app-icon name="x" [size]="18" />
          </button>
        </li>
      }
      @if (remaining() > 0) {
        <li>
          <label class="add" [class.is-busy]="busy()">
            <input type="file" appPhotoPicker class="visually-hidden" [multiple]="true" [max]="remaining()" [disabled]="busy()" (photosPicked)="added.emit($event)">
            <app-icon name="plus" [size]="24" />
            <span>{{ busy() ? 'Enviando…' : 'Adicionar fotos' }}</span>
          </label>
        </li>
      }
    </ul>
  `,
  styles: `
    :host { display: grid; gap: var(--space-3); }
    .head { display: grid; gap: var(--space-1); }
    .grid { display: grid; gap: var(--space-3); grid-template-columns: repeat(auto-fill, minmax(min(100%, 140px), 1fr)); }
    .tile, .add { position: relative; aspect-ratio: 4 / 3; border-radius: var(--radius-md); overflow: hidden; }
    .tile img { width: 100%; height: 100%; object-fit: cover; }
    .cover { position: absolute; left: var(--space-2); top: var(--space-2); padding: 2px var(--space-2); border-radius: var(--radius-pill); background: var(--lime-500); color: var(--ink); font-size: 13px; font-weight: 700; }
    .remove {
      position: absolute; right: var(--space-2); top: var(--space-2); display: grid; place-items: center;
      width: 36px; height: 36px; border: 0; border-radius: 50%; background: rgba(0,40,20,.72); color: var(--on-dark);
    }
    .add {
      display: grid; place-items: center; align-content: center; gap: var(--space-1); height: 100%; cursor: pointer;
      border: 2px dashed var(--line-strong); color: var(--green-900); font-weight: 600; background: var(--bg-alt);
    }
    .add:focus-within { box-shadow: var(--focus-ring); }
    .add.is-busy { opacity: .6; pointer-events: none; }
  `
})
export class PhotoGridEditor {
  readonly photos = input.required<GridPhoto[]>();
  readonly max = input(6);
  readonly busy = input(false);
  readonly label = input('Fotos');
  readonly added = output<Blob[]>();
  readonly removed = output<string>();

  readonly remaining = computed(() => this.max() - this.photos().length);
}
