import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { VerificationService } from '@core/api/verification.service';
import { UserRole } from '@core/models/auth.model';
import { VerificationDocumentType } from '@core/models/verification.model';
import { ToastService } from '@core/toast/toast.service';
import { Button } from '../../ui/button';
import { Icon } from '../../ui/icon';
import { SegmentOption, SegmentedControl } from '../../ui/segmented-control';
import { Skeleton } from '../../ui/skeleton';
import { formatDate } from '../../utils/format';
import { ACCEPTED_PHOTOS, PhotoError, preparePhoto } from '../../utils/images';
import { RemoteData } from '../../utils/remote-data';
import { VerifiedBadge } from './verified-badge';

const DOCUMENT_MAX_SIDE = 1600; // o nome e o CPF precisam ficar legíveis

// Cartão "Verificação de identidade" do perfil (issue #20): envia a foto da frente do RG ou da CNH,
// acompanha a análise e mostra o selo. Recarrega quando o nome do perfil muda (o selo vale para o nome
// conferido no documento).
@Component({
  selector: 'app-verification-card',
  imports: [Button, Icon, SegmentedControl, Skeleton, VerifiedBadge],
  template: `
    <section class="card stack" aria-labelledby="verification-title" aria-live="polite">
      <div class="head">
        <h2 id="verification-title" class="t-h3">Verificação de identidade</h2>
        @if (verification.data()?.verified) { <app-verified-badge /> }
      </div>

      @switch (verification.state().status) {
        @case ('loading') { <app-skeleton [count]="1" [height]="72" /> }
        @case ('error') { <p class="t-body-sm muted">Não foi possível ver a verificação agora. Tente de novo mais tarde.</p> }
        @case ('success') {
          @if (verification.data(); as v) {
            @if (v.verified) {
              <p class="t-body-sm muted">A equipe conferiu seu documento em {{ date(v.reviewed_at) }}, e o selo aparece para quem vê seu perfil. A foto já foi apagada.</p>
            } @else {
              @switch (v.status) {
                @case ('pending') {
                  <p class="note">Em análise desde {{ date(v.submitted_at) }}. Você recebe um aviso quando a equipe conferir.</p>
                }
                @case ('rejected') {
                  <p class="note danger"><b>Não foi possível verificar:</b> {{ v.rejection_reason }}</p>
                }
                @case ('approved') {
                  <p class="note">Você mudou o nome do perfil depois da verificação, então o selo saiu. Envie o documento de novo para recuperar.</p>
                }
                @default {
                  <p class="t-body-sm muted">Envie a foto do seu RG ou da sua CNH. A equipe confere o nome e o CPF com os do seu perfil, e você ganha o selo de verificado: mais confiança para quem contrata e para quem trabalha.</p>
                }
              }

              @if (v.status === 'pending' && !resending()) {
                <div><button appButton variant="secondary" type="button" (click)="resending.set(true)">Enviar outra foto</button></div>
              } @else {
                <app-segmented-control label="Documento" [options]="documents" [(value)]="documentType" />
                <ul class="tips t-body-sm" role="list">
                  <li><app-icon name="check" [size]="18" />A frente, onde aparecem o nome e o CPF</li>
                  <li><app-icon name="check" [size]="18" />O documento inteiro, com boa luz e sem reflexo</li>
                  <li><app-icon name="check" [size]="18" />O original, não uma cópia ou um print</li>
                </ul>
                <input #file type="file" class="visually-hidden" tabindex="-1" aria-hidden="true" [attr.accept]="accept" (change)="onFile($event)">
                <div><button appButton type="button" [loading]="sending()" (click)="file.click()">{{ v.status === 'none' ? 'Enviar foto do documento' : 'Enviar de novo' }}</button></div>
                <p class="privacy t-body-sm"><app-icon name="lock" [size]="16" />A foto fica guardada só até a conferência e depois é apagada. Para os outros, aparece só o selo.</p>
              }
            }
          }
        }
      }
    </section>
  `,
  styles: `
    .head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-3); }
    h2 { margin: 0; }
    p { margin: 0; }
    .note { padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); background: var(--surface-sunken); font-size: 0.875rem; line-height: 1.25rem; }
    .note.danger { background: var(--danger-soft); }
    .tips { display: grid; gap: var(--space-1); margin: 0; padding: 0; list-style: none; }
    .tips li { display: flex; gap: var(--space-2); align-items: center; }
    .tips app-icon { color: var(--mata); }
    .privacy { display: flex; gap: var(--space-2); align-items: flex-start; color: var(--ink-muted); }
    .privacy app-icon { margin-top: 2px; }
  `
})
export class VerificationCard {
  readonly role = input.required<UserRole>();
  readonly profileId = input.required<number>();
  readonly name = input.required<string>(); // nome atual do perfil

  private readonly service = inject(VerificationService);
  private readonly toast = inject(ToastService);

  readonly verification = new RemoteData(() => this.service.get(this.role(), this.profileId()));
  readonly documentType = signal<VerificationDocumentType>('cnh');
  readonly resending = signal(false);
  readonly sending = signal(false);
  readonly accept = ACCEPTED_PHOTOS;
  readonly documents: SegmentOption<VerificationDocumentType>[] = [
    { value: 'cnh', label: 'CNH' },
    { value: 'rg', label: 'RG' }
  ];
  readonly date = (iso: string | null): string => (iso ? formatDate(iso) : '');

  constructor() {
    effect(() => {
      this.name(); // trocou o nome: o selo pode ter saído
      untracked(() => this.verification.refresh());
    });
  }

  async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // permite escolher a mesma foto de novo
    if (!file) return;
    let photo: Blob;
    try {
      photo = await preparePhoto(file, DOCUMENT_MAX_SIDE);
    } catch (error) {
      this.toast.error(error instanceof PhotoError ? error.message : 'Não foi possível ler a foto. Tente outra imagem.');
      return;
    }
    this.sending.set(true);
    this.service.submit(this.role(), this.profileId(), this.documentType(), photo).subscribe({
      next: ({ verification }) => {
        this.sending.set(false);
        this.resending.set(false);
        this.verification.replace(verification);
        this.toast.success('Documento enviado. A equipe vai conferir e avisar você.');
      },
      error: () => this.sending.set(false) // a mensagem (ex.: foto ilegível) saiu no toast
    });
  }
}
