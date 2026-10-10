import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProfileCreateInput, SessionResponse, SessionUser, UserRole } from '../../../models/auth.model';

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
}
