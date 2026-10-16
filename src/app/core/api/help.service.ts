import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { HelpArticle } from '../models/help.model';

// Central de ajuda pública (perguntas publicadas). A gestão pela equipe fica em features/system.
@Injectable({ providedIn: 'root' })
export class HelpService {
  private readonly http = inject(HttpClient);

  list(): Observable<HelpArticle[]> {
    return this.http.get<HelpArticle[]>(`${environment.apiUrl}/help`);
  }
}
