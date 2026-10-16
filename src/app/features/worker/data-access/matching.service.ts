import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { JobPreferences, JobPreferencesResponse, RecommendedJob } from '@core/models/matching.model';

// Vagas para você: as preferências do trabalhador e as vagas recomendadas.
@Injectable({ providedIn: 'root' })
export class MatchingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/workers`;

  preferences(workerId: number): Observable<JobPreferences> {
    return this.http.get<JobPreferences>(`${this.apiUrl}/${workerId}/job-preferences`);
  }

  savePreferences(workerId: number, preferences: JobPreferences): Observable<JobPreferencesResponse> {
    return this.http.put<JobPreferencesResponse>(`${this.apiUrl}/${workerId}/job-preferences`, preferences);
  }

  recommended(workerId: number, limit: number): Observable<RecommendedJob[]> {
    return this.http.get<RecommendedJob[]>(`${this.apiUrl}/${workerId}/recommended-jobs`, { params: new HttpParams().set('limit', limit) });
  }
}
