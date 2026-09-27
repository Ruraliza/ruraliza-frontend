export interface Farm {
  id: number;
  farmer_id: number;
  address: string;
  city: string;
  state: string;
  insertion_date: string;
}

export interface FarmInput {
  address: string;
  city: string;
  state: string;
}

// Local da fazenda exposto ao trabalhador (sem o endereço completo).
export interface FarmLocation {
  city: string;
  state: string;
}
