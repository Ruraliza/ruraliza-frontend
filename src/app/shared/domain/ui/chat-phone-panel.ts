import { Component, computed, input, output } from '@angular/core';
import { UserRole } from '@core/models/auth.model';
import { Chat } from '@core/models/chat.model';
import { formatPhone } from '../../utils/format';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { whatsappLink } from '../utils/chat';

// Topo da conversa: o WhatsApp de cada um fica protegido até os dois liberarem (consentimento duplo).
// Mostra quem já liberou e, com os dois, o número do outro com "Abrir no WhatsApp" e "Ligar".
@Component({
  selector: 'app-chat-phone-panel',
  imports: [Button, Icon],
  host: { '[class.both]': 'both()', role: 'region', 'aria-labelledby': 'wa-title' },
  template: `
    <span class="wa-icon"><app-icon [name]="both() ? 'phone' : 'lock'" [size]="22" /></span>
    <div class="wa-text">
      <h2 id="wa-title" class="t-label">{{ title() }}</h2>
      <p class="t-body-sm">{{ message() }}</p>
      @if (both() && other().phone; as phone) {
        <p class="phone">{{ format(phone) }}</p>
      }
      <div class="consent" aria-label="Quem liberou o WhatsApp">
        <span [class.on]="mine()"><span class="dot"></span>Você</span>
        <span [class.on]="theirs()"><span class="dot"></span>{{ otherFirst() }}</span>
      </div>
    </div>
    <div class="wa-actions">
      @if (both() && other().phone; as phone) {
        <a appButton [href]="wa(phone)" target="_blank" rel="noopener">Abrir no WhatsApp</a>
        <a appButton variant="secondary" [href]="'tel:' + phone">Ligar</a>
      } @else if (chat().open && !mine()) {
        <button appButton [variant]="theirs() ? 'primary' : 'secondary'" type="button" (click)="shareRequested.emit()">Liberar meu WhatsApp</button>
      }
      @if (chat().open && mine()) {
        <button appButton variant="ghost" type="button" [loading]="busy()" (click)="unshareRequested.emit()">Deixar de compartilhar</button>
      }
    </div>
  `,
  styles: `
    :host {
      display: grid; grid-template-columns: auto 1fr; gap: var(--space-3) var(--space-4); align-items: start;
      padding: var(--space-4); border-radius: var(--radius-lg); border: 1px solid var(--line); background: var(--bg-alt);
    }
    :host(.both) { border-color: var(--broto); background: var(--mint-100); }
    .wa-icon { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--surface-raised); color: var(--mata); }
    .wa-text { display: grid; gap: var(--space-1); min-width: 0; }
    h2, p { margin: 0; }
    .phone { font: 700 1.375rem/1.75rem var(--font-display); font-variant-numeric: tabular-nums; }
    .consent { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-1); }
    .consent > span {
      display: inline-flex; align-items: center; gap: var(--space-2); padding: 2px var(--space-3); border-radius: var(--radius-pill);
      border: 1px solid var(--line-strong); background: var(--surface-raised); color: var(--ink-muted); font-size: 0.875rem; font-weight: 600;
    }
    .consent > span.on { border-color: var(--mata); color: var(--ink); }
    .dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--line-strong); }
    .on .dot { border-color: var(--mata); background: var(--mata); }
    .wa-actions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .wa-actions:empty { display: none; }
    @media (min-width: 768px) {
      :host { grid-template-columns: auto 1fr auto; align-items: center; }
      .wa-actions { grid-column: auto; justify-content: flex-end; }
    }
  `
})
export class ChatPhonePanel {
  readonly chat = input.required<Chat>();
  readonly role = input.required<UserRole>();
  readonly busy = input(false);
  readonly shareRequested = output<void>();
  readonly unshareRequested = output<void>();

  readonly other = computed(() => (this.role() === 'farmer' ? this.chat().worker : this.chat().farmer));
  readonly otherFirst = computed(() => this.other().name.split(' ')[0] ?? '');
  readonly mine = computed(() => (this.role() === 'farmer' ? this.chat().farmer_shares_phone : this.chat().worker_shares_phone));
  readonly theirs = computed(() => (this.role() === 'farmer' ? this.chat().worker_shares_phone : this.chat().farmer_shares_phone));
  readonly both = computed(() => this.mine() && this.theirs());

  readonly title = computed(() => {
    if (this.both()) return 'WhatsApp liberado';
    if (this.theirs()) return `${this.otherFirst()} quer trocar WhatsApp`;
    if (this.mine()) return `Falta ${this.otherFirst()} liberar`;
    return 'Seu WhatsApp está protegido';
  });
  readonly message = computed(() => {
    if (this.both()) return `Vocês dois liberaram. Este é o número de ${this.otherFirst()}:`;
    if (this.theirs()) return 'Libere o seu também para os dois números aparecerem.';
    if (this.mine()) return 'Seu número aparece quando os dois tiverem liberado.';
    return 'Os números só aparecem quando vocês dois liberarem. Até lá, combinem tudo por aqui.';
  });

  format(phone: string): string {
    return formatPhone(phone);
  }

  wa(phone: string): string {
    return whatsappLink(phone);
  }
}
