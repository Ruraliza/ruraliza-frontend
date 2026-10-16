import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { HelpArticle, HelpArticleInput, HelpArticleResponse, HelpArticleUpdate } from '@core/models/help.model';

// Gestão da central de ajuda pela equipe (permissão content:manage). O authInterceptor envia o token de sistema.
@Injectable({ providedIn: 'root' })
export class HelpAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/help`;

  list(): Observable<HelpArticle[]> {
    return this.http.get<HelpArticle[]>(this.apiUrl);
  }

  create(input: HelpArticleInput): Observable<HelpArticleResponse> {
    return this.http.post<HelpArticleResponse>(this.apiUrl, input);
  }

  update(id: number, changes: HelpArticleUpdate): Observable<HelpArticleResponse> {
    return this.http.patch<HelpArticleResponse>(`${this.apiUrl}/${id}`, changes);
  }

  move(id: number, direction: 'up' | 'down'): Observable<HelpArticleResponse> {
    return this.http.patch<HelpArticleResponse>(`${this.apiUrl}/${id}/move`, { direction });
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
