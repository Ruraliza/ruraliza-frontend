export interface Service {
  id?: number;
  farmer_id: number;
  farm_id: number;
  payment_id?: number | null;
  worker_id?: number | null;
  name: string;
  category: string;
  duration: number;
  price: number;
  status: string;
  insertion_date?: string;
}
