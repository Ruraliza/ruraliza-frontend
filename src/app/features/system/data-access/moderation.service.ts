import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AdminReport, AdminReportResponse, ReportReviewInput, ReportStatus } from '@core/models/report.model';
import { AdminVerification, AdminVerificationResponse, VerificationReviewInput } from '@core/models/verification.model';

// Filas de denúncias e de verificações de identidade da equipe (permissão moderation:manage).
// O authInterceptor envia o token de sistema (também na foto do documento, baixada como Blob).
@Injectable({ providedIn: 'root' })
export class ModerationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/reports`;
  private readonly verificationsUrl = `${environment.apiUrl}/admin/verifications`;

  reports(status?: ReportStatus): Observable<AdminReport[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<AdminReport[]>(this.apiUrl, params ? { params } : {});
  }

  review(id: number, input: ReportReviewInput): Observable<AdminReportResponse> {
    return this.http.patch<AdminReportResponse>(`${this.apiUrl}/${id}`, input);
  }

  verifications(): Observable<AdminVerification[]> {
    return this.http.get<AdminVerification[]>(this.verificationsUrl);
  }

  // A foto não vai num <img src> direto: o pedido precisa do token de sistema no cabeçalho.
  verificationDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.verificationsUrl}/${id}/document`, { responseType: 'blob' });
  }

  reviewVerification(id: number, input: VerificationReviewInput): Observable<AdminVerificationResponse> {
    return this.http.patch<AdminVerificationResponse>(`${this.verificationsUrl}/${id}`, input);
  }
}
