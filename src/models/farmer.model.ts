export interface Farmer {
  id: number;
  email: string;
  name: string;
  farms: number; // contador de fazendas, mantido pelo backend
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
