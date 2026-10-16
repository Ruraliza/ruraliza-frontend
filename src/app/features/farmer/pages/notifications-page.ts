import { Component } from '@angular/core';
import { NotificationList } from '@shared/domain/ui/notification-list';

// Central de notificações do produtor (a lista se atualiza sozinha pelo NotificationInboxService).
@Component({
  selector: 'app-farmer-notifications-page',
  imports: [NotificationList],
  template: `<app-notification-list />`
})
export class NotificationsPage {}
