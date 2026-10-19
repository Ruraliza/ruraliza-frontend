import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../data-access/auth.service';
import { ForgotPasswordPage } from './forgot-password-page';

describe('ForgotPasswordPage', () => {
  // A API responde o mesmo 200 com e sem conta e nunca devolve o código: ele chega só ao dono do e-mail.
  function open(): { page: ForgotPasswordPage; text: () => string; detect: () => void; navigate: ReturnType<typeof vi.spyOn> } {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { requestPasswordReset: () => of({ message: 'If this e-mail has an account, a reset code will be sent to it.' }) } }
      ]
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ForgotPasswordPage);
    fixture.detectChanges();
    return {
      page: fixture.componentInstance,
      text: () => (fixture.nativeElement as HTMLElement).textContent ?? '',
      detect: () => { fixture.detectChanges(); },
      navigate
    };
  }

  it('depois do pedido, pede o código recebido em vez de seguir sozinha para a nova senha', () => {
    const { page, text, detect, navigate } = open();

    page.form.controls.email.setValue('ana@exemplo.com');
    page.submit();
    detect();

    expect(navigate).not.toHaveBeenCalled();
    expect(text()).toContain('Se houver uma conta com este e-mail');
    expect(text()).toContain('Código');
  });

  it('o código digitado leva à criação da nova senha', () => {
    const { page, navigate } = open();
    page.form.controls.email.setValue('ana@exemplo.com');
    page.submit();

    page.codeForm.controls.code.setValue('  codigo-do-email  ');
    page.continueWithCode();

    expect(navigate).toHaveBeenCalledWith('/entrar/nova-senha', { state: { email: 'ana@exemplo.com', token: 'codigo-do-email' } });
  });
});
