import { Routes } from '@angular/router';
import { FarmerRegistrationComponent } from './components/farmer-registration/farmer-registration'; // Ajuste se tiver mantido o .ts no final

export const routes: Routes = [
  // Rota para o cadastro do produtor
  { 
    path: 'register/farmer', 
    component: FarmerRegistrationComponent 
  },
  
  // Redireciona a URL base (localhost:4200) direto para o cadastro provisoriamente
  { 
    path: '', 
    redirectTo: 'register/farmer', 
    pathMatch: 'full' 
  }
];