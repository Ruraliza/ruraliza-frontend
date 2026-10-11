import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { LoginInput } from '@core/models/auth.model';
import { SystemLoginResponse, SystemUser, SystemUserResponse, SystemUserUpdate } from '@core/models/system.model';

// Login da equipe (usuários de sistema), separado do login das contas do app.
@Injectable({ providedIn: 'root' })
export class SystemAuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth/system`;

  login(input: LoginInput): Observable<SystemLoginResponse> {
    return this.http.post<SystemLoginResponse>(`${this.apiUrl}/login`, input);
  }

  // Dono do token, com o cargo atual.
  me(): Observable<SystemUser> {
    return this.http.get<SystemUser>(`${this.apiUrl}/me`);
  }

  // O próprio perfil: nome e e-mail (o cargo só um administrador muda).
  updateMe(changes: SystemUserUpdate): Observable<SystemUserResponse> {
    return this.http.patch<SystemUserResponse>(`${this.apiUrl}/me`, changes);
  }
}
