import { PaymentStatus } from './status';

// Pagamento (simulado) que conclui o serviço: o produtor informa o total. Nenhum dinheiro é movimentado.
export interface Payment {
  id: number;
  service_id: number;
  farmer_id: number;
  worker_id: number;
  value: number;
  status: PaymentStatus;
  insertion_date: string;
}

// POST /farmers/services/:id/payment
export interface PaymentInput {
  value: number; // total em R$, maior que zero
}
