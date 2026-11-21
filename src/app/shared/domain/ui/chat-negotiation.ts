import { Component, ElementRef, afterRenderEffect, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatService } from '@core/api/chat.service';
import { UserRole } from '@core/models/auth.model';
import { ChatDetail } from '@core/models/chat.model';
import { AgreementTerms, PriceUnit } from '@core/models/service.model';
import { noBlockedTerms } from '../../utils/moderation';
import { positiveNumberValidator } from '../../utils/validators';
import { Button } from '../../ui/button';
import { FormField } from '../../ui/form-field';
import { Icon } from '../../ui/icon';
import { MaskedInput } from '../../ui/masked-input';
import { UNIT_OPTIONS, priceLabel } from '../utils/agreement';

// A negociação na conversa, antes do aceite: o que falta para contratar e o botão "Fazer proposta",
// que abre um formulário curto (valor, unidade e observações). A primeira proposta parte da estimativa da vaga.
// A contraproposta abre o mesmo formulário já preenchido (`counter`).
@Component({
  selector: 'app-chat-negotiation',
  imports: [ReactiveFormsModule, RouterLink, Button, FormField, Icon, MaskedInput],
  template: `
    @if (negotiating()) {
      <section class="negotiation" aria-labelledby="negotiation-title">
        <h2 id="negotiation-title" class="t-label"><app-icon name="money" [size]="18" />Valor a combinar</h2>
        <p class="t-body-sm">{{ hint() }}</p>
        <div class="actions">
          @if (!accepted()) {
            <button appButton type="button" (click)="open()">{{ pending() ? 'Nova proposta' : 'Fazer proposta' }}</button>
          } @else if (role() === 'farmer') {
            <a appButton [routerLink]="['/produtor/servicos', chat().service_id]">Aceitar a candidatura</a>
          }
        </div>
      </section>
    }

    <dialog #dialog aria-labelledby="proposal-title" (cancel)="close($event)">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <h2 id="proposal-title">{{ countering() ? 'Contraproposta' : 'Proposta' }}</h2>
        <p class="t-body-sm muted">{{ formHint() }}</p>
        <app-form-field label="Valor (R$)" fieldId="proposal-amount" [control]="form.controls.amount" [messages]="amountMessages">
          <input appMask="currency" formControlName="amount" inputmode="numeric" placeholder="R$ 0,00">
        </app-form-field>
        <app-form-field label="Cobrado" fieldId="proposal-unit" [control]="form.controls.unit">
          <select formControlName="unit">
            @for (u of units; track u.value) { <option [value]="u.value">{{ u.label }}</option> }
          </select>
        </app-form-field>
        <app-form-field label="Observações" fieldId="proposal-notes" [optional]="true" [control]="form.controls.notes" [messages]="notesMessages"
          hint="Até 300 caracteres. Telefone e e-mail não aparecem.">
          <textarea formControlName="notes" rows="2" maxlength="300" placeholder="Ex.: almoço por conta da fazenda."></textarea>
        </app-form-field>
        <div class="dialog-actions">
          <button appButton variant="secondary" type="button" [disabled]="sending()" (click)="close()">Cancelar</button>
          <button appButton type="submit" [loading]="sending()">Enviar proposta</button>
        </div>
      </form>
    </dialog>
  `,
  styles: `
    .negotiation {
      display: grid; gap: var(--space-2); padding: var(--space-4); border-radius: var(--radius-lg);
      border: 1px solid var(--line-strong); background: var(--bg-alt);
    }
    h2 { margin: 0; display: inline-flex; align-items: center; gap: var(--space-2); }
    .negotiation p { margin: 0; }
    .actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .actions:empty { display: none; }
    dialog {
      width: min(480px, calc(100vw - 2 * var(--space-4))); max-height: calc(100dvh - 2 * var(--space-4)); padding: var(--space-6);
      border: 0; border-radius: var(--radius-lg); background: var(--surface-raised); color: var(--ink); box-shadow: var(--shadow-float);
    }
    dialog::backdrop { background: var(--scrim); }
    form { display: grid; gap: var(--space-4); }
    form h2 { font: 700 1.25rem/1.75rem var(--font-display); }
    form p { margin: 0; }
    .dialog-actions { display: flex; flex-wrap: wrap-reverse; justify-content: flex-end; gap: var(--space-3); }
    @media (max-width: 479px) {
      .dialog-actions { flex-direction: column-reverse; }
      .dialog-actions > button { width: 100%; }
    }
  `
})
export class ChatNegotiation {
  readonly chat = input.required<ChatDetail>();
  readonly role = input.required<UserRole>();
  readonly sent = output<void>();

  private readonly chatService = inject(ChatService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  readonly units = UNIT_OPTIONS;
  readonly amountMessages = { required: 'Informe o valor.', positive: 'Informe um valor maior que zero.' };
  readonly notesMessages = { maxlength: 'Até 300 caracteres.' };

  readonly showing = signal(false);
  readonly countering = signal(false);
  readonly sending = signal(false);

  readonly form = this.fb.group({
    amount: this.fb.control<number | null>(null, [Validators.required, positiveNumberValidator]),
    unit: this.fb.control<PriceUnit>('day'),
    notes: ['', [Validators.maxLength(300), noBlockedTerms]]
  });

  // Em negociação: conversa aberta, candidatura pendente e ainda sem aceite.
  readonly negotiating = computed(() => this.chat().open && this.chat().application_id !== null && !this.chat().hired);
  readonly accepted = computed(() => this.chat().proposals.find((p) => p.status === 'Accepted') ?? null);
  readonly pending = computed(() => this.chat().proposals.find((p) => p.status === 'Pending') ?? null);
  readonly hint = computed(() => {
    const accepted = this.accepted();
    if (accepted) {
      return this.role() === 'farmer'
        ? `Vocês combinaram ${priceLabel(accepted)}. Agora é só aceitar a candidatura na página do serviço.`
        : `Vocês combinaram ${priceLabel(accepted)}. Falta o produtor aceitar sua candidatura.`;
    }
    if (this.pending()) return 'Há uma proposta aguardando resposta. Uma proposta nova substitui a anterior.';
    return 'Proponha o valor e a unidade (por dia, hora, metro, hectare ou empreitada). O produtor só aceita a candidatura com uma proposta aceita pelos dois.';
  });

  // A estimativa da vaga, só enquanto a conversa ainda não tem proposta.
  firstProposalDefaults(): Pick<AgreementTerms, 'amount' | 'unit'> | null {
    const { estimate, proposals } = this.chat();
    return estimate && proposals.length === 0 ? { amount: estimate.price, unit: estimate.price_unit } : null;
  }

  readonly formHint = computed(() => {
    const estimate = this.chat().estimate;
    const from = estimate && this.chat().proposals.length === 0 && !this.countering()
      ? ` Começa pela estimativa da vaga (${priceLabel({ amount: estimate.price, unit: estimate.price_unit })}); mude o que precisar.`
      : '';
    return `No fim do serviço, o produtor libera o pagamento pelo app.${from}`;
  });

  constructor() {
    afterRenderEffect(() => {
      const element = this.dialog().nativeElement;
      if (this.showing() && !element.open) element.showModal();
      if (!this.showing() && element.open) element.close();
    });
  }

  // Abre o formulário: na contraproposta, com os termos da proposta recebida; na primeira proposta da conversa,
  // com a estimativa da vaga. Qualquer lado pode mudar.
  open(base?: Pick<AgreementTerms, 'amount' | 'unit'>): void {
    this.countering.set(base !== undefined);
    const start = base ?? this.firstProposalDefaults();
    this.form.reset({ amount: start?.amount ?? null, unit: start?.unit ?? 'day', notes: '' });
    this.showing.set(true);
  }

  close(event?: Event): void {
    event?.preventDefault();
    if (!this.sending()) this.showing.set(false);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { amount, unit, notes } = this.form.getRawValue();
    this.sending.set(true);
    this.chatService.propose(this.chat().id, { amount: amount as number, unit, notes: notes.trim() || null }).subscribe({
      next: () => {
        this.sending.set(false);
        this.showing.set(false);
        this.sent.emit();
      },
      error: () => this.sending.set(false)
    });
  }
}
