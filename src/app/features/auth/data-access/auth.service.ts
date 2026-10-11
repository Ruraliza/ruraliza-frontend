import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  LoginInput,
  LoginResponse,
  PasswordResetInput,
  PasswordResetRequestInput,
  PasswordResetRequestResponse
} from '@core/models/auth.model';

// Login e "esqueci a senha". A troca de senha com a conta aberta fica em FarmerService/WorkerService.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  login(input: LoginInput): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, input);
  }

  // Simulação: o código iria por e-mail; por enquanto o token volta na resposta.
  requestPasswordReset(input: PasswordResetRequestInput): Observable<PasswordResetRequestResponse> {
    return this.http.post<PasswordResetRequestResponse>(`${this.apiUrl}/password-reset`, input);
  }

  resetPassword(input: PasswordResetInput): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/password-reset/confirm`, input);
  }
}
