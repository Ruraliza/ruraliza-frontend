export interface Farmer {
  id?: number;
  email: string;
  name: string;
  farms?: number | null;
  phone: string;
  cpf: string;
  insertion_date?: string;
}
