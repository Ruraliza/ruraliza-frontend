import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { UserRole } from '../models/auth.model';
import {
  FarmReviewInput,
  FarmReviewsPage,
  FarmerReviewResponse,
  FarmerServiceReviews,
  PendingReview,
  WorkerReviewInput,
  WorkerReviewResponse,
  WorkerReviewsPage,
  WorkerServiceReviews
} from '../models/review.model';

// Avaliação dupla (usada pelo produtor e pelo trabalhador): avaliar o outro lado depois do serviço
// concluído, ver o que falta avaliar e a reputação publicada de trabalhadores e fazendas.
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  // --- Produtor avalia o trabalhador ---

  farmerServiceReviews(serviceId: number): Observable<FarmerServiceReviews> {
    return this.http.get<FarmerServiceReviews>(`${this.api}/farmers/services/${serviceId}/reviews`);
  }

  reviewWorker(serviceId: number, input: WorkerReviewInput): Observable<FarmerReviewResponse> {
    return this.http.post<FarmerReviewResponse>(`${this.api}/farmers/services/${serviceId}/review`, input);
  }

  // --- Trabalhador avalia a fazenda ---

  workerServiceReviews(serviceId: number, workerId: number): Observable<WorkerServiceReviews> {
    const params = new HttpParams().set('worker_id', workerId);
    return this.http.get<WorkerServiceReviews>(`${this.api}/workers/services/${serviceId}/reviews`, { params });
  }

  reviewFarm(serviceId: number, input: FarmReviewInput): Observable<WorkerReviewResponse> {
    return this.http.post<WorkerReviewResponse>(`${this.api}/workers/services/${serviceId}/review`, input);
  }

  // Serviços concluídos esperando a avaliação do perfil (o que vence primeiro vem antes).
  pending(role: UserRole, profileId: number): Observable<PendingReview[]> {
    const area = role === 'farmer' ? 'farmers' : 'workers';
    return this.http.get<PendingReview[]>(`${this.api}/${area}/${profileId}/reviews/pending`);
  }

  // --- Reputação publicada ---

  workerReviews(workerId: number): Observable<WorkerReviewsPage> {
    return this.http.get<WorkerReviewsPage>(`${this.api}/reviews/workers/${workerId}`);
  }

  farmReviews(farmId: number): Observable<FarmReviewsPage> {
    return this.http.get<FarmReviewsPage>(`${this.api}/reviews/farms/${farmId}`);
  }
}
