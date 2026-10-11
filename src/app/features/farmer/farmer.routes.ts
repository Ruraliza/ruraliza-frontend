import { Routes } from '@angular/router';
import { FarmerLayout } from './farmer-layout';
import { FarmerDashboardPage } from './pages/farmer-dashboard-page';
import { FarmsPage } from './pages/farms-page';
import { FarmFormPage } from './pages/farm-form-page';
import { FarmerServicesPage } from './pages/farmer-services-page';
import { ServiceFormPage } from './pages/service-form-page';
import { ServiceDetailPage } from './pages/service-detail-page';
import { FarmerProfilePage } from './pages/farmer-profile-page';
import { ChatsPage } from './pages/chats-page';
import { ChatPage } from './pages/chat-page';

// Área do produtor, carregada sob demanda a partir de /produtor.
export const FARMER_ROUTES: Routes = [
  {
    path: '',
    component: FarmerLayout,
    children: [
      { path: '', component: FarmerDashboardPage, title: 'Início · Ruraliza' },
      { path: 'fazendas', component: FarmsPage, title: 'Fazendas · Ruraliza' },
      { path: 'fazendas/nova', component: FarmFormPage, title: 'Nova fazenda · Ruraliza' },
      { path: 'fazendas/:id/editar', component: FarmFormPage, title: 'Editar fazenda · Ruraliza' },
      { path: 'servicos', component: FarmerServicesPage, title: 'Serviços · Ruraliza' },
      { path: 'servicos/novo', component: ServiceFormPage, title: 'Novo serviço · Ruraliza' },
      { path: 'servicos/:id', component: ServiceDetailPage, title: 'Serviço · Ruraliza' },
      { path: 'servicos/:id/editar', component: ServiceFormPage, title: 'Editar serviço · Ruraliza' },
      { path: 'conversas', component: ChatsPage, title: 'Conversas · Ruraliza' },
      { path: 'conversas/:id', component: ChatPage, title: 'Conversa · Ruraliza' },
      { path: 'perfil', component: FarmerProfilePage, title: 'Perfil · Ruraliza' }
    ]
  }
];
