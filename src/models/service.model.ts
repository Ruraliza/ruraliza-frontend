import { Farm, FarmLocation } from './farm.model';
import { ServiceStatus } from './status';

export interface Service {
  id: number;
  farmer_id: number;
  farm_id: number;
  payment_id: number | null;
  worker_id: number | null;
  name: string;
  category: string;
  duration: number; // horas
  price: number; // R$
  status: ServiceStatus;
  insertion_date: string;
}

export interface ServiceInput {
  farmer_id: number;
  farm_id: number;
  name: string;
  category: string;
  duration: number;
  price: number;
}

// GET /farmers/services/:id
export interface ServiceWithFarm extends Service {
  farm: Farm;
}

// GET /farmers/:id/services
export interface FarmerServiceItem extends ServiceWithFarm {
  applications_pending: number;
}

// GET /workers/services, /workers/services/:id, /workers/:id/services
export interface OpenService extends Service {
  farm: FarmLocation;
}
