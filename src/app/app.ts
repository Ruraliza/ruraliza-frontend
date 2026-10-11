import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InstallPromptService } from '@core/pwa/install-prompt.service';
import { PushService } from '@core/pwa/push.service';
import { PwaBanners } from '@core/layout/pwa-banners';
import { ToastContainer } from '@core/layout/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, PwaBanners],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor() {
    // Desde a abertura: o navegador oferece a instalação uma vez só (cedo), e a inscrição
    // de push é reenviada ao backend assim que houver conta aberta.
    inject(InstallPromptService);
    inject(PushService);
  }
}
