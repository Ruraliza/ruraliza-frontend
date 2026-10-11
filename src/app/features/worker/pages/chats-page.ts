import { Component } from '@angular/core';
import { ChatList } from '@shared/domain/ui/chat-list';

// Conversas do trabalhador (a lista se atualiza sozinha pelo ChatInboxService).
@Component({
  selector: 'app-worker-chats-page',
  imports: [ChatList],
  template: `<app-chat-list role="worker" />`
})
export class ChatsPage {}
