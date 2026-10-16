import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Sponsor, SponsorInput, SponsorResponse, SponsorUpdate } from '@core/models/sponsor.model';

// Gestão dos patrocínios pela equipe (permissão content:manage). O authInterceptor envia o token de sistema.
@Injectable({ providedIn: 'root' })
export class SponsorsAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/sponsors`;

  list(): Observable<Sponsor[]> {
    return this.http.get<Sponsor[]>(this.apiUrl);
  }

  create(input: SponsorInput): Observable<SponsorResponse> {
    return this.http.post<SponsorResponse>(this.apiUrl, input);
  }

  update(id: number, changes: SponsorUpdate): Observable<SponsorResponse> {
    return this.http.patch<SponsorResponse>(`${this.apiUrl}/${id}`, changes);
  }

  remove(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // A logo: o corpo é o próprio arquivo (o servidor reduz e converte para WebP).
  uploadImage(id: number, image: Blob): Observable<SponsorResponse> {
    return this.http.post<SponsorResponse>(`${this.apiUrl}/${id}/image`, image, { headers: { 'Content-Type': image.type || 'image/jpeg' } });
  }

  removeImage(id: number): Observable<SponsorResponse> {
    return this.http.delete<SponsorResponse>(`${this.apiUrl}/${id}/image`);
  }
}
