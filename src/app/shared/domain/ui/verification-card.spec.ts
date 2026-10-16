import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { VerificationService } from '@core/api/verification.service';
import { Verification } from '@core/models/verification.model';
import { VerificationCard } from './verification-card';

const NONE: Verification = { status: 'none', document_type: null, submitted_at: null, reviewed_at: null, rejection_reason: null, verified: false };

describe('VerificationCard', () => {
  let submitted: unknown[][];

  function render(current: Verification): { text: () => string; card: VerificationCard; detect: () => void } {
    submitted = [];
    TestBed.configureTestingModule({
      providers: [{
        provide: VerificationService,
        useValue: {
          get: () => of(current),
          submit: (...args: unknown[]) => {
            submitted.push(args);
            return of({ message: 'ok', verification: { ...NONE, status: 'pending', document_type: args[2], submitted_at: '2026-10-16T12:00:00.000Z' } });
          }
        }
      }]
    });
    const fixture = TestBed.createComponent(VerificationCard);
    fixture.componentRef.setInput('role', 'worker');
    fixture.componentRef.setInput('profileId', 7);
    fixture.componentRef.setInput('name', 'Maria Lima');
    TestBed.tick();
    fixture.detectChanges();
    return {
      text: () => (fixture.nativeElement as HTMLElement).textContent ?? '',
      card: fixture.componentInstance,
      detect: () => fixture.detectChanges()
    };
  }

  it('explains how to get the badge and asks for the document', () => {
    const { text } = render(NONE);

    expect(text()).toContain('Envie a foto do seu RG ou da sua CNH');
    expect(text()).toContain('Enviar foto do documento');
  });

  it('shows the reason of a refusal and lets the person send again', () => {
    const { text } = render({ ...NONE, status: 'rejected', rejection_reason: 'A foto ficou tremida', document_type: 'rg' });

    expect(text()).toContain('Não foi possível verificar: A foto ficou tremida');
    expect(text()).toContain('Enviar de novo');
  });

  it('shows the badge only while the name is the one checked', () => {
    expect(render({ ...NONE, status: 'approved', verified: true, reviewed_at: '2026-10-14T12:00:00.000Z' }).text()).toContain('Verificado');
    TestBed.resetTestingModule();
    expect(render({ ...NONE, status: 'approved', verified: false }).text()).toContain('Você mudou o nome do perfil');
  });

  it('sends the photo with the chosen document and waits for the review', async () => {
    const { card, text, detect } = render(NONE);
    card.documentType.set('rg');
    const photo = new File([new Uint8Array([1, 2, 3])], 'rg.jpg', { type: 'image/jpeg' });
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', { value: [photo] });

    await card.onFile({ target: input } as unknown as Event);
    detect();

    expect(submitted.map((args) => args.slice(0, 3))).toEqual([['worker', 7, 'rg']]);
    expect(text()).toContain('Em análise desde');
  });
});
