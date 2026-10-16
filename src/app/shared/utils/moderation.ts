import { AbstractControl, ValidationErrors } from '@angular/forms';
import { BLOCKED_TERMS } from '@core/models/moderation.model';

// Filtro de palavrões (issue #27), igual ao da API: o formulário avisa antes de enviar, sem apagar o texto.
const LOOKALIKES: Readonly<Record<string, string>> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's' };

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[013457@$]/g, (char) => LOOKALIKES[char] ?? char);
}

// Cada letra pode se repetir ("porraaa"); o espaço das frases aceita ponto, hífen e sublinhado.
function termPattern(term: string): string {
  return term.replace(/[a-z]/g, '$&+').replace(/ /g, '[\s._-]+');
}

// Só a palavra inteira: "curral", "disputa" e "deputado" passam.
const BLOCKED = new RegExp(`(?<![a-z])(?:${BLOCKED_TERMS.map(termPattern).join('|')})(?![a-z])`);

export function hasBlockedTerm(text: string): boolean {
  return BLOCKED.test(normalize(text));
}

// Validator: { blocked: true } quando o texto tem palavrão ou ofensa (mensagem padrão no FormField).
export function noBlockedTerms(control: AbstractControl<string | null>): ValidationErrors | null {
  const value = control.value;
  return value && hasBlockedTerm(value) ? { blocked: true } : null;
}
