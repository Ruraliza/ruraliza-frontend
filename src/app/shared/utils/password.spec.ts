import { FormControl, FormGroup } from '@angular/forms';
import { matchesField, passwordValidators } from './password';

describe('password', () => {
  it('requires 8 to 128 characters, counting spaces', () => {
    const control = new FormControl('', passwordValidators);
    expect(control.hasError('required')).toBe(true);
    control.setValue('1234567');
    expect(control.hasError('minlength')).toBe(true);
    control.setValue('    1234');
    expect(control.valid).toBe(true);
    control.setValue('a'.repeat(129));
    expect(control.hasError('maxlength')).toBe(true);
  });

  it('flags a confirmation that differs from the password', () => {
    const form = new FormGroup({
      password: new FormControl('senha-forte-1'),
      confirmation: new FormControl('', matchesField('password'))
    });
    const confirmation = form.controls.confirmation;
    expect(confirmation.valid).toBe(true); // vazio fica por conta do required

    confirmation.setValue('senha-forte-2');
    expect(confirmation.hasError('mismatch')).toBe(true);
    confirmation.setValue('senha-forte-1');
    expect(confirmation.valid).toBe(true);
  });
});
