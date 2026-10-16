import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { AdminReport, AdminReportResponse, ReportReviewInput, ReportStatus } from '@core/models/report.model';

// Fila de denúncias da equipe (permissão moderation:manage). O authInterceptor envia o token de sistema.
@Injectable({ providedIn: 'root' })
export class ModerationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/reports`;

  reports(status?: ReportStatus): Observable<AdminReport[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<AdminReport[]>(this.apiUrl, params ? { params } : {});
  }

  review(id: number, input: ReportReviewInput): Observable<AdminReportResponse> {
    return this.http.patch<AdminReportResponse>(`${this.apiUrl}/${id}`, input);
  }
}
