import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { UserRole } from '../models/auth.model';
import { Verification, VerificationDocumentType, VerificationResponse } from '../models/verification.model';

// Verificação de identidade do próprio perfil (produtor ou trabalhador). A fila e a decisão ficam na
// área do sistema (features/system/data-access/moderation.service.ts).
@Injectable({ providedIn: 'root' })
export class VerificationService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  get(role: UserRole, profileId: number): Observable<Verification> {
    return this.http.get<Verification>(this.url(role, profileId));
  }

  // O corpo é a própria foto (o navegador já reduziu para ≤ 1600px; o servidor garante a regra).
  submit(role: UserRole, profileId: number, documentType: VerificationDocumentType, photo: Blob): Observable<VerificationResponse> {
    return this.http.post<VerificationResponse>(this.url(role, profileId), photo, {
      params: new HttpParams().set('document_type', documentType),
      headers: { 'Content-Type': photo.type || 'image/jpeg' }
    });
  }

  private url(role: UserRole, profileId: number): string {
    return `${this.api}/${role === 'farmer' ? 'farmers' : 'workers'}/${profileId}/verification`;
  }
}
