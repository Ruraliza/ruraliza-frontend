import { Component, ElementRef, afterRenderEffect, computed, input, linkedSignal, output, signal, viewChild } from '@angular/core';
import { PhotoError, type SquareCrop, centeredCrop, clampCrop, cropSquare, resizeCrop } from '../utils/images';
import { Button } from './button';
import { Icon } from './icon';

const MAX_ZOOM = 4;
const MIN_CROP_SIDE = 100; // px da foto original: não deixa ampliar até virar borrão

// Recorte quadrado da foto de perfil, em <dialog> modal. Arrastar move a foto; zoom pelo controle,
// pela roda do mouse ou com dois dedos; no teclado, setas movem e + / − ampliam.
// O círculo mostra o que aparece no avatar; o arquivo enviado é o quadrado inteiro.
@Component({
  selector: 'app-photo-crop-dialog',
  imports: [Button, Icon],
  template: `
    <dialog #dialog aria-labelledby="crop-title" aria-describedby="crop-help" (cancel)="onCancel($event)">
      <h2 id="crop-title">Ajustar foto de perfil</h2>
      <p id="crop-help" class="t-body-sm muted">Arraste para posicionar e use o zoom para enquadrar o rosto.</p>
      <div class="stage">
        <canvas
          #canvas
          tabindex="0"
          aria-label="Área de recorte. Use as setas para mover a foto e as teclas + e − para o zoom."
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (pointercancel)="onPointerUp($event)"
          (wheel)="onWheel($event)"
          (keydown)="onKeydown($event)"
        ></canvas>
        <div class="ring" aria-hidden="true"></div>
      </div>
      <label class="zoom">
        <app-icon name="dash" [size]="20" />
        <input
          type="range" min="1" step="0.01" aria-label="Zoom"
          [max]="maxZoom()" [value]="zoom()" [disabled]="maxZoom() === 1"
          (input)="onZoomInput($event)"
        >
        <app-icon name="plus" [size]="20" />
      </label>
      @if (error(); as message) {
        <p class="t-body-sm error" role="alert">{{ message }}</p>
      }
      <div class="actions">
        <button appButton variant="secondary" type="button" [disabled]="saving()" (click)="cancelled.emit()">Cancelar</button>
        <button appButton type="button" [loading]="saving()" (click)="confirm()">Usar foto</button>
      </div>
    </dialog>
  `,
  styles: `
    dialog {
      width: min(440px, calc(100vw - 2 * var(--space-4)));
      padding: var(--space-6); border: 0; border-radius: var(--radius-lg);
      background: var(--surface-raised); color: var(--ink); box-shadow: var(--shadow-float);
    }
    dialog::backdrop { background: var(--scrim); }
    dialog[open] { display: grid; gap: var(--space-4); }
    h2 { margin: 0; }
    p { margin: 0; }
    .stage {
      position: relative; aspect-ratio: 1; overflow: hidden;
      border-radius: var(--radius-md); background: var(--ink);
    }
    canvas {
      display: block; width: 100%; height: 100%;
      cursor: grab; touch-action: none; outline: none;
    }
    canvas:active { cursor: grabbing; }
    .stage:has(canvas:focus-visible) { box-shadow: var(--focus-ring); }
    /* Escurece o que fica fora do avatar redondo. */
    .ring {
      position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, .45); outline: 2px solid rgba(255, 255, 255, .85); outline-offset: -2px;
    }
    .zoom { display: flex; align-items: center; gap: var(--space-3); color: var(--ink-muted); }
    .zoom input { flex: 1; min-height: 44px; accent-color: var(--mata); }
    .error { color: var(--danger); }
    .actions { display: flex; flex-wrap: wrap-reverse; justify-content: flex-end; gap: var(--space-3); }
    @media (max-width: 479px) {
      .actions { flex-direction: column-reverse; }
      .actions > button { width: 100%; }
    }
  `
})
export class PhotoCropDialog {
  // Foto já aberta no navegador; o diálogo fica aberto enquanto houver uma.
  readonly photo = input<ImageBitmap | null>(null);
  readonly cropped = output<Blob>();
  readonly cancelled = output<void>();

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  // Recomeça centralizado a cada foto nova.
  private readonly crop = linkedSignal<ImageBitmap | null, SquareCrop>({
    source: this.photo,
    computation: (photo) => (photo ? centeredCrop(photo.width, photo.height) : { x: 0, y: 0, size: 1 })
  });

  private readonly minSide = computed(() => {
    const photo = this.photo();
    return photo ? Math.min(photo.width, photo.height) : 1;
  });
  readonly maxZoom = computed(() => Math.max(1, Math.min(MAX_ZOOM, this.minSide() / MIN_CROP_SIDE)));
  readonly zoom = computed(() => this.minSide() / this.crop().size);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly pointers = new Map<number, { x: number; y: number }>();

  constructor() {
    afterRenderEffect(() => {
      const element = this.dialog().nativeElement;
      const open = this.photo() !== null;
      if (open && !element.open) {
        this.saving.set(false);
        this.error.set(null);
        element.showModal();
      }
      if (!open && element.open) element.close();
    });

    // Redesenha a prévia sempre que a foto ou o recorte mudam.
    afterRenderEffect(() => {
      const photo = this.photo();
      const crop = this.crop();
      const canvas = this.canvas().nativeElement;
      if (!photo || canvas.clientWidth === 0) return;
      const side = Math.round(canvas.clientWidth * (window.devicePixelRatio || 1));
      if (canvas.width !== side) canvas.width = canvas.height = side;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.imageSmoothingQuality = 'high';
      context.drawImage(photo, crop.x, crop.y, crop.size, crop.size, 0, 0, side, side);
    });
  }

  async confirm(): Promise<void> {
    const photo = this.photo();
    if (!photo || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      this.cropped.emit(await cropSquare(photo, this.crop()));
    } catch (error) {
      this.error.set(error instanceof PhotoError ? error.message : 'Não foi possível recortar a foto. Tente outra imagem.');
    } finally {
      this.saving.set(false);
    }
  }

  // Esc: fecha pelo fluxo normal de cancelamento (não enquanto prepara o arquivo).
  onCancel(event: Event): void {
    event.preventDefault();
    if (!this.saving()) this.cancelled.emit();
  }

  onZoomInput(event: Event): void {
    this.setZoom(Number((event.target as HTMLInputElement).value));
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.setZoom(this.zoom() * Math.exp(-event.deltaY * 0.002));
  }

  onKeydown(event: KeyboardEvent): void {
    const step = this.crop().size * 0.05;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step]
    };
    const move = moves[event.key];
    if (move) {
      this.moveBy(move[0], move[1]);
    } else if (event.key === '+' || event.key === '=') {
      this.setZoom(this.zoom() * 1.1);
    } else if (event.key === '-') {
      this.setZoom(this.zoom() / 1.1);
    } else {
      return;
    }
    event.preventDefault();
  }

  onPointerDown(event: PointerEvent): void {
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }

  onPointerMove(event: PointerEvent): void {
    const previous = this.pointers.get(event.pointerId);
    if (!previous) return;
    const before = this.pinchDistance();
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.pointers.size === 1) {
      // Arrastar a foto para a direita mostra o que está à esquerda: o recorte anda ao contrário.
      const sourcePerPixel = this.crop().size / this.canvas().nativeElement.clientWidth;
      this.moveBy((previous.x - event.clientX) * sourcePerPixel, (previous.y - event.clientY) * sourcePerPixel);
    } else if (before > 0) {
      this.setZoom(this.zoom() * (this.pinchDistance() / before));
    }
  }

  onPointerUp(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);
  }

  private setZoom(zoom: number): void {
    const photo = this.photo();
    if (!photo) return;
    const clamped = Math.min(Math.max(zoom, 1), this.maxZoom());
    this.crop.update((crop) => resizeCrop(crop, this.minSide() / clamped, photo.width, photo.height));
  }

  private moveBy(dx: number, dy: number): void {
    const photo = this.photo();
    if (!photo) return;
    this.crop.update((crop) => clampCrop({ ...crop, x: crop.x + dx, y: crop.y + dy }, photo.width, photo.height));
  }

  // Distância entre os dois primeiros dedos na tela (0 se não houver dois).
  private pinchDistance(): number {
    const [a, b] = [...this.pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }
}
