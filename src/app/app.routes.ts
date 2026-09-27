import { Routes } from '@angular/router';
import { FarmerRegistrationComponent } from './components/farmer-registration/farmer-registration';
import { WorkerRegistrationComponent } from './components/worker-registration/worker-registration';

export const routes: Routes = [
  // Rota para o cadastro do produtor
  { 
    path: 'register/farmer', 
    component: FarmerRegistrationComponent 
  },
  
  { 
    path: 'register/worker', 
    component: WorkerRegistrationComponent // Nova rota
  },
  
  // Redireciona a URL base (localhost:4200) direto para o cadastro provisoriamente
  { 
    path: '', 
    redirectTo: 'register/farmer', 
    pathMatch: 'full' 
  }
];