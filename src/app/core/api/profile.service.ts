import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { SessionUser } from '../models/auth.model';
import { Farmer, FarmerInput } from '../models/farmer.model';
import { Worker, WorkerInput } from '../models/worker.model';

// Perfis de produtor e trabalhador usados por mais de uma feature: cadastro (auth), segundo perfil
// da conta (account) e os painéis (farmer, worker). O resto de cada perfil fica no data-access da feature.
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly farmersUrl = `${environment.apiUrl}/farmers`;
  private readonly workersUrl = `${environment.apiUrl}/workers`;

  getFarmer(farmerId: number): Observable<Farmer> {
    return this.http.get<Farmer>(`${this.farmersUrl}/${farmerId}`);
  }

  getWorker(workerId: number): Observable<Worker> {
    return this.http.get<Worker>(`${this.workersUrl}/${workerId}`);
  }

  // Cadastro: cria a conta com este perfil e já devolve a sessão (`user`).
  createFarmer(farmer: FarmerInput): Observable<{ message: string; farmer: Farmer; user: SessionUser; token: string }> {
    return this.http.post<{ message: string; farmer: Farmer; user: SessionUser; token: string }>(this.farmersUrl, farmer);
  }

  createWorker(worker: WorkerInput): Observable<{ message: string; worker: Worker; user: SessionUser; token: string }> {
    return this.http.post<{ message: string; worker: Worker; user: SessionUser; token: string }>(this.workersUrl, worker);
  }

  // Currículo: o corpo é o próprio PDF (o servidor guarda como chegou, até 5 MB).
  uploadResume(workerId: number, pdf: Blob): Observable<{ message: string; worker: Worker }> {
    return this.http.post<{ message: string; worker: Worker }>(`${this.workersUrl}/${workerId}/resume`, pdf, {
      headers: { 'Content-Type': 'application/pdf' }
    });
  }

  deleteResume(workerId: number): Observable<{ message: string; worker: Worker }> {
    return this.http.delete<{ message: string; worker: Worker }>(`${this.workersUrl}/${workerId}/resume`);
  }
}
