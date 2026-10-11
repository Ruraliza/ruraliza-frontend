import { AbstractControl, ValidationErrors } from '@angular/forms';

// Currículo do trabalhador: só PDF, até 5 MB (mesmo limite do servidor). O servidor guarda o
// arquivo como chegou e confere se é mesmo um PDF; aqui é só para avisar antes de enviar.

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_RESUME = 'application/pdf';

export const RESUME_MESSAGES = {
  pdf: 'Envie o currículo em PDF.',
  maxSize: 'O PDF passa de 5 MB. Envie um arquivo menor.'
};

// Erro do arquivo escolhido (`pdf` ou `maxSize`), ou null se estiver tudo certo.
export function resumeErrors(file: File | null): ValidationErrors | null {
  if (!file) return null;
  if (file.type !== ACCEPTED_RESUME && !file.name.toLowerCase().endsWith('.pdf')) return { pdf: true };
  if (file.size > MAX_RESUME_BYTES) return { maxSize: true };
  return null;
}

// Validador para um FormControl<File | null>.
export function resumeValidator(control: AbstractControl<File | null>): ValidationErrors | null {
  return resumeErrors(control.value);
}
