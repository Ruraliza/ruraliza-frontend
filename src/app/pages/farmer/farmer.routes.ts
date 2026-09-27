import { Routes } from '@angular/router';
import { FarmerLayout } from '../../layouts/farmer-layout';
import { FarmerDashboardPage } from './farmer-dashboard-page';
import { FarmsPage } from './farms-page';
import { FarmFormPage } from './farm-form-page';
import { FarmerServicesPage } from './farmer-services-page';
import { ServiceFormPage } from './service-form-page';
import { ServiceDetailPage } from './service-detail-page';
import { FarmerProfilePage } from './farmer-profile-page';

// Área do produtor, carregada sob demanda a partir de /produtor.
export const FARMER_ROUTES: Routes = [
  {
    path: '',
    component: FarmerLayout,
    children: [
      { path: '', component: FarmerDashboardPage, title: 'Início · Ruraliza' },
      { path: 'fazendas', component: FarmsPage, title: 'Fazendas · Ruraliza' },
      { path: 'fazendas/nova', component: FarmFormPage, title: 'Nova fazenda · Ruraliza' },
      { path: 'servicos', component: FarmerServicesPage, title: 'Serviços · Ruraliza' },
      { path: 'servicos/novo', component: ServiceFormPage, title: 'Novo serviço · Ruraliza' },
      { path: 'servicos/:id', component: ServiceDetailPage, title: 'Serviço · Ruraliza' },
      { path: 'perfil', component: FarmerProfilePage, title: 'Perfil · Ruraliza' }
    ]
  }
];
