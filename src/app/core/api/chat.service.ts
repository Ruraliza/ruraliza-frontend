import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { SILENT_ERRORS } from '../http/error.interceptor';
import { UserRole } from '../models/auth.model';
import { Chat, ChatDetail, ChatMessageResponse, ChatResponse } from '../models/chat.model';
import { ProposalAnswer, ProposalInput, ProposalResponse } from '../models/service-application.model';

// Pedidos sem toast de erro: a lista roda em segundo plano (contador do menu), a leitura é
// automática e o envio mostra a falha na própria mensagem ("Tocar para reenviar").
const silent = (): { context: HttpContext } => ({ context: new HttpContext().set(SILENT_ERRORS, true) });

// Conversa do serviço entre o produtor e um candidato (usada pelos dois painéis): mensagens, propostas e WhatsApp.
@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  // Conversas do perfil, a de mensagem mais recente primeiro.
  list(role: UserRole, profileId: number): Observable<Chat[]> {
    const area = role === 'farmer' ? 'farmers' : 'workers';
    return this.http.get<Chat[]>(`${this.api}/${area}/${profileId}/chats`, silent());
  }

  get(chatId: number): Observable<ChatDetail> {
    return this.http.get<ChatDetail>(`${this.api}/chats/${chatId}`);
  }

  send(chatId: number, body: string): Observable<ChatMessageResponse> {
    return this.http.post<ChatMessageResponse>(`${this.api}/chats/${chatId}/messages`, { body }, silent());
  }

  markRead(chatId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/chats/${chatId}/read`, {}, silent());
  }

  // Proposta de valor e pagamento (a nova substitui a pendente).
  propose(chatId: number, input: ProposalInput): Observable<ProposalResponse> {
    return this.http.post<ProposalResponse>(`${this.api}/chats/${chatId}/proposals`, input);
  }

  // Aceita ou recusa a proposta do outro lado.
  answerProposal(chatId: number, proposalId: number, action: ProposalAnswer): Observable<ProposalResponse> {
    return this.http.patch<ProposalResponse>(`${this.api}/chats/${chatId}/proposals/${proposalId}`, { action });
  }

  // Libera (ou deixa de compartilhar) o próprio WhatsApp nesta conversa.
  sharePhone(chatId: number, share: boolean): Observable<ChatResponse> {
    return this.http.patch<ChatResponse>(`${this.api}/chats/${chatId}/phone`, { share });
  }
}
