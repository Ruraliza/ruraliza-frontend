import { Component } from '@angular/core';
import { ChatList } from '@shared/domain/ui/chat-list';

// Conversas do produtor (a lista se atualiza sozinha pelo ChatInboxService).
@Component({
  selector: 'app-farmer-chats-page',
  imports: [ChatList],
  template: `<app-chat-list role="farmer" />`
})
export class ChatsPage {}
