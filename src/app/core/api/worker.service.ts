import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Worker, WorkerInput, WorkerUpdate } from '../../../models/worker.model';
import { JobFilters, OpenService, Service } from '../../../models/service.model';
import { ApplicationWithService, ServiceApplication } from '../../../models/service-application.model';

@Injectable({ providedIn: 'root' })
export class WorkerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/workers`;

  // --- Trabalhadores ---

  getWorkers(): Observable<Worker[]> {
    return this.http.get<Worker[]>(this.apiUrl);
  }

  getWorker(workerId: number): Observable<Worker> {
    return this.http.get<Worker>(`${this.apiUrl}/${workerId}`);
  }

  createWorker(worker: WorkerInput): Observable<{ message: string; worker: Worker }> {
    return this.http.post<{ message: string; worker: Worker }>(this.apiUrl, worker);
  }

  updateWorker(workerId: number, changes: WorkerUpdate): Observable<{ message: string; worker: Worker }> {
    return this.http.patch<{ message: string; worker: Worker }>(`${this.apiUrl}/${workerId}`, changes);
  }

  deleteWorker(workerId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${workerId}`);
  }

  // Foto de perfil: o corpo é o próprio arquivo (o servidor reduz para ≤ 1000px e converte para WebP).
  uploadPhoto(workerId: number, photo: Blob): Observable<{ message: string; worker: Worker }> {
    return this.http.post<{ message: string; worker: Worker }>(`${this.apiUrl}/${workerId}/photo`, photo, {
      headers: { 'Content-Type': photo.type }
    });
  }

  deletePhoto(workerId: number): Observable<{ message: string; worker: Worker }> {
    return this.http.delete<{ message: string; worker: Worker }>(`${this.apiUrl}/${workerId}/photo`);
  }

  getWorkerApplications(workerId: number): Observable<ApplicationWithService[]> {
    return this.http.get<ApplicationWithService[]>(`${this.apiUrl}/${workerId}/applications`);
  }

  getWorkerServices(workerId: number): Observable<OpenService[]> {
    return this.http.get<OpenService[]>(`${this.apiUrl}/${workerId}/services`);
  }

  // --- Vagas ---

  // Vagas abertas com filtros (todos opcionais; campos vazios não vão na URL).
  searchServices(filters: JobFilters = {}): Observable<OpenService[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<OpenService[]>(`${this.apiUrl}/services`, { params });
  }

  getOpenService(serviceId: number): Observable<OpenService> {
    return this.http.get<OpenService>(`${this.apiUrl}/services/${serviceId}`);
  }

  applyForService(serviceId: number, workerId: number): Observable<{ message: string; application: ServiceApplication }> {
    return this.http.post<{ message: string; application: ServiceApplication }>(
      `${this.apiUrl}/services/${serviceId}/apply`,
      { worker_id: workerId }
    );
  }

  // Desiste: candidatura pendente é removida; se já aceito, o serviço volta a Pending.
  withdrawFromService(serviceId: number, workerId: number): Observable<{ message: string; service: Service }> {
    return this.http.patch<{ message: string; service: Service }>(
      `${this.apiUrl}/services/${serviceId}/withdraw`,
      { worker_id: workerId }
    );
  }
}
