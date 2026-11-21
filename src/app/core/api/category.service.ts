import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { CategoryGroup } from '@core/models/service.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  // Lista plana dos tipos de serviço (o valor gravado na vaga).
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/categories`);
  }

  // Os mesmos tipos por grupo, para escolher em dois níveis.
  getGroups(): Observable<CategoryGroup[]> {
    return this.http.get<CategoryGroup[]>(`${environment.apiUrl}/categories/groups`);
  }
}
