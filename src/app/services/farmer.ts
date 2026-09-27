import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Farmer } from '../../models/farmer.model';
import { Farm } from '../../models/farm.model';
import { Service } from '../../models/service.model';

@Injectable({
  providedIn: 'root'
})
export class FarmerService {
  private apiUrl = `${environment.apiUrl}/farmers`;

  constructor(private http: HttpClient) {}

  getFarmers(): Observable<Farmer[]> {
    return this.http.get<Farmer[]>(this.apiUrl);
  }

  createFarmer(farmer: Farmer): Observable<{ message: string; farmer: Farmer }> {
    return this.http.post<{ message: string; farmer: Farmer }>(this.apiUrl, farmer);
  }

  createFarm(farmerId: number, farm: Farm): Observable<{ message: string; farm: Farm }> {
    return this.http.post<{ message: string; farm: Farm }>(`${this.apiUrl}/${farmerId}/farms`, farm);
  }

  requestService(service: Service): Observable<{ message: string; service: Service }> {
    return this.http.post<{ message: string; service: Service }>(`${this.apiUrl}/services`, service);
  }

  analyzeOffer(serviceId: number, workerId: number, action: 'Accept' | 'Reject'): Observable<{ message: string; service?: Service }> {
    return this.http.patch<{ message: string; service?: Service }>(`${this.apiUrl}/services/${serviceId}/analyze`, { worker_id: workerId, action });
  }

  processPayment(serviceId: number): Observable<{ message: string; service: Service }> {
    return this.http.post<{ message: string; service: Service }>(`${this.apiUrl}/services/${serviceId}/payment`, {});
  }
}