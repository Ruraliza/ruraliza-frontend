import { Signal, computed, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiError } from '../../core/http/api-error';

export type RemoteState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

// Junta vários estados numa tela: qualquer erro → erro; qualquer carregando → carregando.
export function mergeStates(
  ...states: RemoteState<unknown>[]
): { status: 'loading' } | { status: 'error'; message: string } | { status: 'success' } {
  const failed = states.find((s) => s.status === 'error');
  if (failed && failed.status === 'error') return { status: 'error', message: failed.message };
  if (states.some((s) => s.status === 'loading')) return { status: 'loading' };
  return { status: 'success' };
}

// Estado de uma leitura (GET) para as telas: carregando → sucesso | erro.
// `load()` pode ser chamado de novo para "Tentar de novo".
export class RemoteData<T> {
  private readonly current = signal<RemoteState<T>>({ status: 'loading' });

  readonly state: Signal<RemoteState<T>> = this.current.asReadonly();
  readonly data = computed(() => {
    const s = this.current();
    return s.status === 'success' ? s.data : null;
  });
  readonly error = computed(() => {
    const s = this.current();
    return s.status === 'error' ? s.message : '';
  });

  constructor(private readonly source: () => Observable<T>) {}

  load(): void {
    this.current.set({ status: 'loading' });
    this.source().subscribe({
      next: (data) => this.current.set({ status: 'success', data }),
      error: (error: unknown) =>
        this.current.set({
          status: 'error',
          message: error instanceof ApiError ? error.message : 'Algo deu errado ao carregar. Tente de novo.'
        })
    });
  }
}
