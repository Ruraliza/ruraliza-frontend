import { Component, input, model } from '@angular/core';

// Interruptor liga/desliga com rótulo e dica, sobre um checkbox nativo com role="switch":
// teclado (Espaço), leitor de tela ("ligado/desligado") e toque na linha inteira funcionam sem script.
// Uso: <app-switch-field fieldId="contraste" label="Alto contraste" hint="..." [(checked)]="on" />
@Component({
  selector: 'app-switch-field',
  template: `
    <label class="row" [for]="fieldId()">
      <span class="text">
        <span class="label">{{ label() }}</span>
        @if (hint()) { <span class="hint" [id]="fieldId() + '-hint'">{{ hint() }}</span> }
      </span>
      <input
        type="checkbox"
        role="switch"
        [id]="fieldId()"
        [checked]="checked()"
        [attr.aria-describedby]="hint() ? fieldId() + '-hint' : null"
        (change)="checked.set($any($event.target).checked)"
      >
      <span class="track" aria-hidden="true"><span class="thumb"></span></span>
    </label>
  `,
  styles: `
    :host { display: block; }
    .row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); min-height: 56px; cursor: pointer; }
    .text { display: grid; gap: 2px; }
    .label { font-weight: 600; }
    .hint { font-size: 0.875rem; line-height: 1.25rem; color: var(--ink-muted); }
    input { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }
    .track {
      position: relative; flex: none; width: 52px; height: 32px; border-radius: var(--radius-pill);
      background: var(--surface-sunken); border: 2px solid var(--line-strong); transition: background-color .15s ease, border-color .15s ease;
    }
    .thumb {
      position: absolute; top: 4px; left: 4px; width: 20px; height: 20px; border-radius: 50%;
      background: var(--line-strong); transition: transform .2s var(--ease-out), background-color .15s ease;
    }
    input:checked + .track { background: var(--mata); border-color: var(--mata); }
    input:checked + .track .thumb { transform: translateX(20px); background: var(--on-mata); }
    input:focus-visible + .track { box-shadow: var(--focus-ring); }
  `
})
export class SwitchField {
  readonly fieldId = input.required<string>();
  readonly label = input.required<string>();
  readonly hint = input<string>('');
  readonly checked = model(false);
}
