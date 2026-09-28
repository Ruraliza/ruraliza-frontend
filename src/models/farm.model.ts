export interface Farm {
  id: number;
  farmer_id: number;
  address: string;
  city: string;
  state: string;
  insertion_date: string;
  deleted_at?: string; // fazenda removida pelo produtor, mantida só no histórico dos serviços
}

export interface FarmInput {
  address: string;
  city: string;
  state: string;
}

export type FarmUpdate = Partial<FarmInput>;

// Local da fazenda exposto ao trabalhador (sem o endereço completo).
export interface FarmLocation {
  city: string;
  state: string;
}
