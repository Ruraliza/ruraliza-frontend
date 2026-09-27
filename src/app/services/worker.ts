import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Worker } from '../../models/worker.model';
import { Service } from '../../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  private apiUrl = `${environment.apiUrl}/workers`;

  constructor(private http: HttpClient) {}

  getWorkers(): Observable<Worker[]> {
    return this.http.get<Worker[]>(this.apiUrl);
  }

  createWorker(worker: Worker): Observable<{ message: string; worker: Worker }> {
    return this.http.post<{ message: string; worker: Worker }>(this.apiUrl, worker);
  }

  searchServices(category?: string): Observable<Service[]> {
    let params = new HttpParams();
    if (category) {
      params = params.set('category', category);
    }
    return this.http.get<Service[]>(`${this.apiUrl}/services`, { params });
  }

  applyForService(serviceId: number, workerId: number): Observable<{ message: string; service_id: number; worker_id: number }> {
    return this.http.post<{ message: string; service_id: number; worker_id: number }>(`${this.apiUrl}/services/${serviceId}/apply`, { worker_id: workerId });
  }
}
