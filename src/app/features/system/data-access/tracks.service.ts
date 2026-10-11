import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { ManagedTrack, ManagedTrackResponse, ManagedTrackSummary, TrackContentInput, TrackInput, TrackStatusInput, TrackTutor, TrackUpdate } from '@core/models/track.model';

// Trilhas de estudo do lado dos tutores (/admin/tracks; o authInterceptor envia o token de sistema).
@Injectable({ providedIn: 'root' })
export class TracksService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/tracks`;

  list(): Observable<ManagedTrackSummary[]> {
    return this.http.get<ManagedTrackSummary[]>(this.apiUrl);
  }

  tutors(): Observable<TrackTutor[]> {
    return this.http.get<TrackTutor[]>(`${this.apiUrl}/tutors`);
  }

  get(trackId: number): Observable<ManagedTrack> {
    return this.http.get<ManagedTrack>(`${this.apiUrl}/${trackId}`);
  }

  create(input: TrackInput): Observable<ManagedTrackResponse> {
    return this.http.post<ManagedTrackResponse>(this.apiUrl, input);
  }

  update(trackId: number, changes: TrackUpdate): Observable<ManagedTrackResponse> {
    return this.http.patch<ManagedTrackResponse>(`${this.apiUrl}/${trackId}`, changes);
  }

  // Substitui todos os módulos e aulas (itens com `id` são mantidos; sem `id`, são novos).
  saveContent(trackId: number, content: TrackContentInput): Observable<ManagedTrackResponse> {
    return this.http.put<ManagedTrackResponse>(`${this.apiUrl}/${trackId}/content`, content);
  }

  // Publicar, descontinuar ou reativar (trilhas não são removidas).
  setStatus(trackId: number, status: TrackStatusInput['status']): Observable<ManagedTrackResponse> {
    return this.http.patch<ManagedTrackResponse>(`${this.apiUrl}/${trackId}/status`, { status });
  }
}
