import type { WorkerReputation } from './review.model';
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

// GET /farmers/services/:id/applications: CPF, telefone e e-mail do trabalhador mascarados
// (o contato só é trocado pela conversa, quando os dois liberam o WhatsApp).
export interface ApplicationWithWorker extends ServiceApplication {
  worker: Worker;
  reputation: WorkerReputation; // avaliações publicadas do trabalhador
  verified: boolean; // identidade conferida pela equipe (selo)
}

// GET /workers/:id/applications
export interface ApplicationWithService extends ServiceApplication {
  service: OpenService;
}

export type AnalyzeAction = 'Accept' | 'Reject';
