import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Farmer, FarmerUpdate } from '../../../models/farmer.model';
import { AdminUser, SystemUser, SystemUserInput, SystemUserResponse } from '../../../models/system.model';
import { Worker, WorkerUpdate } from '../../../models/worker.model';

// Administração: contas do app (lista, edição e remoção) e equipe. O authInterceptor envia o token de sistema.
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  listUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.apiUrl}/users`);
  }

  getUser(accountId: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.apiUrl}/users/${accountId}`);
  }

  // Remove a conta e os dois perfis.
  deleteUser(accountId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${accountId}`);
  }

  updateFarmer(farmerId: number, changes: FarmerUpdate): Observable<{ message: string; farmer: Farmer }> {
    return this.http.patch<{ message: string; farmer: Farmer }>(`${this.apiUrl}/farmers/${farmerId}`, changes);
  }

  updateWorker(workerId: number, changes: WorkerUpdate): Observable<{ message: string; worker: Worker }> {
    return this.http.patch<{ message: string; worker: Worker }>(`${this.apiUrl}/workers/${workerId}`, changes);
  }

  // Remove só um perfil: a conta continua se tiver o outro.
  deleteFarmer(farmerId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/farmers/${farmerId}`);
  }

  deleteWorker(workerId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/workers/${workerId}`);
  }

  // Remove a foto de perfil (ex.: imagem imprópria).
  deleteFarmerPhoto(farmerId: number): Observable<{ message: string; farmer: Farmer }> {
    return this.http.delete<{ message: string; farmer: Farmer }>(`${this.apiUrl}/farmers/${farmerId}/photo`);
  }

  deleteWorkerPhoto(workerId: number): Observable<{ message: string; worker: Worker }> {
    return this.http.delete<{ message: string; worker: Worker }>(`${this.apiUrl}/workers/${workerId}/photo`);
  }

  listSystemUsers(): Observable<SystemUser[]> {
    return this.http.get<SystemUser[]>(`${this.apiUrl}/system-users`);
  }

  createSystemUser(input: SystemUserInput): Observable<SystemUserResponse> {
    return this.http.post<SystemUserResponse>(`${this.apiUrl}/system-users`, input);
  }
}
