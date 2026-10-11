import { OpenService } from './service.model';
import { ApplicationStatus } from './status';
import { Worker } from './worker.model';

export interface ServiceApplication {
  id: number;
  service_id: number;
  worker_id: number;
  status: ApplicationStatus;
  auto_rejected?: boolean; // recusada pelo aceite de outro; volta a Pending se o aceito desistir
  insertion_date: string;
}

// GET /farmers/services/:id/applications (CPF do trabalhador mascarado)
export interface ApplicationWithWorker extends ServiceApplication {
  worker: Worker;
}

// GET /workers/:id/applications
export interface ApplicationWithService extends ServiceApplication {
  service: OpenService;
}

export type AnalyzeAction = 'Accept' | 'Reject';
