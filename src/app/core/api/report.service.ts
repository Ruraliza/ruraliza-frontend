import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { UserRole } from '../models/auth.model';
import { ReportInput, ReportResponse } from '../models/report.model';

// Denúncia feita por quem usa o app (o trabalhador denuncia vaga ou produtor; o produtor, trabalhador).
// A fila e a decisão ficam na área do sistema (features/system/data-access/moderation.service.ts).
@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  send(role: UserRole, profileId: number, input: ReportInput): Observable<ReportResponse> {
    return this.http.post<ReportResponse>(`${this.api}/${role === 'farmer' ? 'farmers' : 'workers'}/${profileId}/reports`, input);
  }
}
