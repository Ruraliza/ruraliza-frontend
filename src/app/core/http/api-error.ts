import { HttpErrorResponse } from '@angular/common/http';

export const SERVER_UNREACHABLE_MESSAGE =
  'Não conseguimos falar com o servidor. Verifique se a API está rodando em localhost:3000.';

// Erro de API já traduzido para a pessoa usuária. É o que os componentes recebem.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Converte a resposta HTTP em uma mensagem clara, dizendo o que aconteceu e o que fazer.
export function toApiError(response: HttpErrorResponse): ApiError {
  if (response.status === 0) {
    return new ApiError(0, SERVER_UNREACHABLE_MESSAGE);
  }

  const apiMessage = typeof response.error?.error === 'string' ? response.error.error : null;
  if (apiMessage) {
    return new ApiError(response.status, apiMessage);
  }

  if (response.status === 404) {
    return new ApiError(404, 'Não encontramos o que você procurava. Confira o endereço e tente de novo.');
  }
  if (response.status >= 500) {
    return new ApiError(response.status, 'O servidor teve um problema. Tente de novo em instantes.');
  }
  return new ApiError(response.status, `A requisição falhou (erro ${response.status}). Tente de novo.`);
}
