import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Farmer, FarmerInput, FarmerUpdate } from '../../../models/farmer.model';
import { Farm, FarmInput } from '../../../models/farm.model';
import { FarmerServiceItem, Service, ServiceInput, ServiceUpdate, ServiceWithFarm } from '../../../models/service.model';
import { AnalyzeAction, ApplicationWithWorker, ServiceApplication } from '../../../models/service-application.model';
import { Payment } from '../../../models/payment.model';
import { ServiceStatus } from '../../../models/status';

@Injectable({ providedIn: 'root' })
export class FarmerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/farmers`;

  // --- Produtores ---

  getFarmers(): Observable<Farmer[]> {
    return this.http.get<Farmer[]>(this.apiUrl);
  }

  getFarmer(farmerId: number): Observable<Farmer> {
    return this.http.get<Farmer>(`${this.apiUrl}/${farmerId}`);
  }

  createFarmer(farmer: FarmerInput): Observable<{ message: string; farmer: Farmer }> {
    return this.http.post<{ message: string; farmer: Farmer }>(this.apiUrl, farmer);
  }

  updateFarmer(farmerId: number, changes: FarmerUpdate): Observable<{ message: string; farmer: Farmer }> {
    return this.http.patch<{ message: string; farmer: Farmer }>(`${this.apiUrl}/${farmerId}`, changes);
  }

  deleteFarmer(farmerId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${farmerId}`);
  }

  // --- Fazendas ---

  getFarms(farmerId: number): Observable<Farm[]> {
    return this.http.get<Farm[]>(`${this.apiUrl}/${farmerId}/farms`);
  }

  createFarm(farmerId: number, farm: FarmInput): Observable<{ message: string; farm: Farm }> {
    return this.http.post<{ message: string; farm: Farm }>(`${this.apiUrl}/${farmerId}/farms`, farm);
  }

  // --- Serviços ---

  getFarmerServices(farmerId: number, status?: ServiceStatus): Observable<FarmerServiceItem[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<FarmerServiceItem[]>(`${this.apiUrl}/${farmerId}/services`, { params });
  }

  getService(serviceId: number): Observable<ServiceWithFarm> {
    return this.http.get<ServiceWithFarm>(`${this.apiUrl}/services/${serviceId}`);
  }

  requestService(service: ServiceInput): Observable<{ message: string; service: Service }> {
    return this.http.post<{ message: string; service: Service }>(`${this.apiUrl}/services`, service);
  }

  updateService(serviceId: number, changes: ServiceUpdate): Observable<{ message: string; service: Service }> {
    return this.http.patch<{ message: string; service: Service }>(`${this.apiUrl}/services/${serviceId}`, changes);
  }

  cancelService(serviceId: number): Observable<{ message: string; service: Service }> {
    return this.http.patch<{ message: string; service: Service }>(`${this.apiUrl}/services/${serviceId}/cancel`, {});
  }

  getServiceApplications(serviceId: number): Observable<ApplicationWithWorker[]> {
    return this.http.get<ApplicationWithWorker[]>(`${this.apiUrl}/services/${serviceId}/applications`);
  }

  analyzeOffer(
    serviceId: number,
    applicationId: number,
    action: AnalyzeAction
  ): Observable<{ message: string; application: ServiceApplication; service?: Service }> {
    return this.http.patch<{ message: string; application: ServiceApplication; service?: Service }>(
      `${this.apiUrl}/services/${serviceId}/analyze`,
      { application_id: applicationId, action }
    );
  }

  processPayment(serviceId: number): Observable<{ message: string; service: Service; payment: Payment }> {
    return this.http.post<{ message: string; service: Service; payment: Payment }>(
      `${this.apiUrl}/services/${serviceId}/payment`,
      {}
    );
  }
}
