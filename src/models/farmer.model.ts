export interface Farmer {
  id: number;
  email: string;
  name: string;
  farms: number[]; // IDs das fazendas, mantidos pelo backend
  phone: string;
  cpf: string; // completo só no GET do próprio perfil; mascarado em listas
  insertion_date: string;
}

export interface FarmerInput {
  email: string;
  name: string;
  phone: string;
  cpf: string;
}

// Edição do perfil: id e cpf não podem ser alterados.
export type FarmerUpdate = Partial<Omit<FarmerInput, 'cpf'>>;
