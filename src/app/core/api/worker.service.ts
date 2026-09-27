import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Worker, WorkerInput } from '../../../models/worker.model';
import { OpenService } from '../../../models/service.model';
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

  getWorkerApplications(workerId: number): Observable<ApplicationWithService[]> {
    return this.http.get<ApplicationWithService[]>(`${this.apiUrl}/${workerId}/applications`);
  }

  getWorkerServices(workerId: number): Observable<OpenService[]> {
    return this.http.get<OpenService[]>(`${this.apiUrl}/${workerId}/services`);
  }

  // --- Vagas ---

  searchServices(category?: string): Observable<OpenService[]> {
    const params = category ? new HttpParams().set('category', category) : undefined;
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
}
