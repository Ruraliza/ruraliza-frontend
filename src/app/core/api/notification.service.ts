import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { UserRole } from '../models/auth.model';
import { NotificationsPage, NotificationsReadInput, NotificationsReadResponse } from '../models/notification.model';
import { WhatsAppConfig } from '../models/push.model';
import { SILENT_ERRORS } from '../http/error.interceptor';

// Central de notificações do perfil (produtor ou trabalhador). Chamadas em segundo plano: sem toast,
// porque quem mostra o estado é o sino e a tela de avisos.
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);

  list(role: UserRole, profileId: number): Observable<NotificationsPage> {
    return this.http.get<NotificationsPage>(this.url(role, profileId), { context: silent() });
  }

  // Sem `ids`, marca todos como lidos.
  markRead(role: UserRole, profileId: number, ids?: number[]): Observable<NotificationsReadResponse> {
    const body: NotificationsReadInput = ids ? { ids } : {};
    return this.http.post<NotificationsReadResponse>(`${this.url(role, profileId)}/read`, body, { context: silent() });
  }

  // Se o servidor manda avisos por WhatsApp (o app só oferece a opção quando manda).
  whatsappConfig(): Observable<WhatsAppConfig> {
    return this.http.get<WhatsAppConfig>(`${environment.apiUrl}/config/whatsapp`, { context: silent() });
  }

  private url(role: UserRole, profileId: number): string {
    return `${environment.apiUrl}/${role === 'farmer' ? 'farmers' : 'workers'}/${profileId}/notifications`;
  }
}

function silent(): HttpContext {
  return new HttpContext().set(SILENT_ERRORS, true);
}
