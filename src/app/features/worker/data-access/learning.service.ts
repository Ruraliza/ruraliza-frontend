import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { SILENT_ERRORS } from '@core/http/error.interceptor';
import { Certificate, EnrolledTrack, EnrolledTrackResponse, LessonCompletionResponse, TrackDetail, TrackFilters, WorkerTrackSummary } from '@core/models/track.model';

// Trilhas de estudo do lado do trabalhador: listar, ver, começar, estudar e os certificados.
@Injectable({ providedIn: 'root' })
export class LearningService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/workers`;

  listTracks(filters: TrackFilters = {}): Observable<WorkerTrackSummary[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<WorkerTrackSummary[]>(`${this.apiUrl}/tracks`, { params });
  }

  getTrack(trackId: number, workerId: number): Observable<TrackDetail> {
    return this.http.get<TrackDetail>(`${this.apiUrl}/tracks/${trackId}`, { params: { worker_id: workerId } });
  }

  // Repetir é seguro: quem já começou recebe a matrícula que tem.
  enroll(trackId: number, workerId: number): Observable<EnrolledTrackResponse> {
    return this.http.post<EnrolledTrackResponse>(`${this.apiUrl}/tracks/${trackId}/enroll`, { worker_id: workerId });
  }

  // 403 = ainda não começou: a tela leva para a página da trilha, sem toast.
  getEnrolledTrack(workerId: number, trackId: number): Observable<EnrolledTrack> {
    return this.http.get<EnrolledTrack>(`${this.apiUrl}/${workerId}/tracks/${trackId}`, {
      context: new HttpContext().set(SILENT_ERRORS, true)
    });
  }

  completeLesson(workerId: number, trackId: number, lessonId: number): Observable<LessonCompletionResponse> {
    return this.http.put<LessonCompletionResponse>(`${this.lessonUrl(workerId, trackId, lessonId)}/completion`, null);
  }

  uncompleteLesson(workerId: number, trackId: number, lessonId: number): Observable<EnrolledTrackResponse> {
    return this.http.delete<EnrolledTrackResponse>(`${this.lessonUrl(workerId, trackId, lessonId)}/completion`);
  }

  getCertificates(workerId: number): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.apiUrl}/${workerId}/certificates`);
  }

  private lessonUrl(workerId: number, trackId: number, lessonId: number): string {
    return `${this.apiUrl}/${workerId}/tracks/${trackId}/lessons/${lessonId}`;
  }
}
