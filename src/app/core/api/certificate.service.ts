import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { SILENT_ERRORS } from '../http/error.interceptor';
import { Certificate } from '../models/track.model';

// Validação pública dos certificados das trilhas (usada pela página pública e pela do trabalhador).
@Injectable({ providedIn: 'root' })
export class CertificateService {
  private readonly http = inject(HttpClient);

  // Código inexistente é um resultado esperado da tela, não um erro para toast.
  getCertificate(code: string): Observable<Certificate> {
    return this.http.get<Certificate>(`${environment.apiUrl}/certificates/${encodeURIComponent(code.trim())}`, {
      context: new HttpContext().set(SILENT_ERRORS, true)
    });
  }
}
