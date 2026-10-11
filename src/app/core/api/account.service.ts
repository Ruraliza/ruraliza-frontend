import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ProfileCreateInput, SessionResponse, SessionUser, UserRole } from '../models/auth.model';
import { PushSubscriptionInput, PushUnsubscribeInput } from '../models/push.model';
import { SILENT_ERRORS } from '../http/error.interceptor';

// Conta única: um e-mail e uma senha, com perfil de produtor e/ou de trabalhador.
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/accounts`;

  getSession(accountId: number): Observable<SessionUser> {
    return this.http.get<SessionUser>(`${this.apiUrl}/${accountId}`);
  }

  // Cria o outro perfil na mesma conta (e-mail e senha são os da conta) e já abre o painel dele.
  createProfile(accountId: number, input: ProfileCreateInput): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(`${this.apiUrl}/${accountId}/profiles`, input);
  }

  // Troca o painel aberto (e o que abre no próximo login).
  setActiveRole(accountId: number, role: UserRole): Observable<SessionResponse> {
    return this.http.patch<SessionResponse>(`${this.apiUrl}/${accountId}/active-role`, { role });
  }

  // Notificações push neste navegador (para os dois perfis da conta). Chamadas em segundo plano: sem toast.
  subscribePush(accountId: number, input: PushSubscriptionInput): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${accountId}/push-subscriptions`, input, { context: silent() });
  }

  // `token`: o da sessão que está saindo (ao sair da conta, o pedido parte depois de a sessão ser limpa).
  unsubscribePush(accountId: number, input: PushUnsubscribeInput, token?: string): Observable<{ message: string }> {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${accountId}/push-subscriptions`, { body: input, headers, context: silent() });
  }
}

function silent(): HttpContext {
  return new HttpContext().set(SILENT_ERRORS, true);
}
