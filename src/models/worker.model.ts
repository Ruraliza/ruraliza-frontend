export interface Worker {
  id: number;
  email: string;
  name: string;
  certificates: string | null;
  experience: string | null;
  phone: string;
  cpf: string; // completo só no GET do próprio perfil; mascarado em listas
  insertion_date: string;
}

export interface WorkerInput {
  email: string;
  name: string;
  phone: string;
  cpf: string;
  certificates?: string | null;
  experience?: string | null;
}
