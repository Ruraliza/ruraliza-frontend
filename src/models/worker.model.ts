export interface Worker {
  id?: number;
  email: string;
  name: string;
  certificates?: string | null;
  experience?: string | null;
  phone: string;
  cpf: string;
  insertion_date?: string;
}
