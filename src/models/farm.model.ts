export interface Farm {
  id?: number;
  farmer_id: number; // Adaptado de farm_id na raiz da tabela[cite: 4]
  address: string;
  city: string;
  state: string;
  insertion_date?: string;
}
