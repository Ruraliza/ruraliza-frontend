import { Routes } from '@angular/router';
import { FarmerRegistrationComponent } from './components/farmer-registration/farmer-registration';
import { WorkerRegistrationComponent } from './components/worker-registration/worker-registration';
import { FarmerListComponent } from './components/farmer-list/farmer-list';
import { WorkerListComponent } from './components/worker-list/worker-list';

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

    {
        path: 'farmers', component: FarmerListComponent
    },
    {
        path: 'workers', component: WorkerListComponent
    },

    // Redireciona a URL base (localhost:4200) direto para o cadastro provisoriamente
    {
        path: '',
        redirectTo: 'register/farmer',
        pathMatch: 'full'
    }
];