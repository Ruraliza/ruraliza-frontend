import { Component, computed, input } from '@angular/core';
import { ChatThread } from '@shared/domain/ui/chat-thread';

// Uma conversa do produtor (/produtor/conversas/:id).
@Component({
  selector: 'app-farmer-chat-page',
  imports: [ChatThread],
  template: `<app-chat-thread [chatId]="chatId()" role="farmer" />`
})
export class ChatPage {
  readonly id = input.required<string>(); // parâmetro :id da rota
  readonly chatId = computed(() => Number(this.id()));
}
