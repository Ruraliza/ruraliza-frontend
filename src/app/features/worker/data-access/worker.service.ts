import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PasswordChangeInput } from '@core/models/auth.model';
import { Worker, WorkerUpdate } from '@core/models/worker.model';
import { JobFilters, OpenService, Service } from '@core/models/service.model';
import { ApplicationWithService, ServiceApplication } from '@core/models/service-application.model';

// Painel do trabalhador: perfil, foto, vagas, candidaturas e desistência. Ler o perfil, o cadastro e
// o currículo ficam no ProfileService (@core/api), usado também por outras features.
@Injectable({ providedIn: 'root' })
export class WorkerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/workers`;

  // --- Trabalhadores ---

  getWorkers(): Observable<Worker[]> {
    return this.http.get<Worker[]>(this.apiUrl);
  }

  updateWorker(workerId: number, changes: WorkerUpdate): Observable<{ message: string; worker: Worker }> {
    return this.http.patch<{ message: string; worker: Worker }>(`${this.apiUrl}/${workerId}`, changes);
  }

  deleteWorker(workerId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${workerId}`);
  }

  // Troca com a conta aberta: confirma a senha atual (sem código por e-mail).
  changePassword(workerId: number, input: PasswordChangeInput): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/${workerId}/password`, input);
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

  // Com `workerId` do trabalhador aceito no serviço, `farm` vem com o ponto no mapa.
  getOpenService(serviceId: number, workerId?: number): Observable<OpenService> {
    const params = workerId === undefined ? undefined : new HttpParams().set('worker_id', workerId);
    return this.http.get<OpenService>(`${this.apiUrl}/services/${serviceId}`, { params });
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
