import { Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { NotificationService } from '@core/api/notification.service';
import { PreferencesService } from '@core/preferences/preferences.service';
import { formatPhone, isMobilePhone } from '../../utils/format';
import { SwitchField } from '../../ui/switch-field';

// Cartão "Avisos no WhatsApp" do perfil do trabalhador (issue #30): quando um produtor aceita a
// candidatura, chega uma mensagem no WhatsApp com o link para o app. Só com o sim da pessoa, só para
// celular com DDD e só quando o servidor tem a integração configurada (senão o cartão explica).
@Component({
  selector: 'app-whatsapp-alerts',
  imports: [SwitchField],
  template: `
    <section class="card stack" aria-labelledby="whatsapp-alerts-title">
      <div class="stack-sm">
        <h2 id="whatsapp-alerts-title" class="t-h3">Avisos no WhatsApp</h2>
        <p class="t-body-sm muted">Quando um produtor aceitar sua candidatura, você recebe uma mensagem no WhatsApp com o link para combinar os detalhes.</p>
      </div>
      @switch (state()) {
        @case ('available') {
          <app-switch-field
            fieldId="whatsapp-alerts"
            label="Receber no WhatsApp"
            [hint]="'No número ' + phoneLabel() + '.'"
            [checked]="prefs.preferences().whatsapp_alerts"
            (checkedChange)="prefs.update({ whatsapp_alerts: $event })"
          />
        }
        @case ('landline') {
          <p class="note">Para receber no WhatsApp, cadastre um celular com DDD, como (24) 99999-8888, em <b>Editar perfil</b>.</p>
        }
        @case ('unavailable') {
          <p class="note">Os avisos no WhatsApp ainda não estão ligados nesta versão do Ruraliza. Por enquanto, os avisos chegam no sino e nas notificações do celular.</p>
        }
      }
    </section>
  `,
  styles: `
    .note { padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: var(--surface-sunken); font-size: 0.875rem; line-height: 1.25rem; }
  `
})
export class WhatsAppAlerts {
  // Telefone do perfil (só dígitos, como vem da API).
  readonly phone = input.required<string>();

  protected readonly prefs = inject(PreferencesService);
  private readonly enabled = toSignal(
    inject(NotificationService).whatsappConfig().pipe(map((config) => config.enabled), catchError(() => of(false))),
    { initialValue: false }
  );

  readonly phoneLabel = computed(() => formatPhone(this.phone()));
  readonly state = computed<'available' | 'landline' | 'unavailable'>(() => {
    if (!this.enabled()) return 'unavailable';
    return isMobilePhone(this.phone()) ? 'available' : 'landline';
  });
}
