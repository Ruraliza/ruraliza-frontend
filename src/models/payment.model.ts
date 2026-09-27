export interface Payment {
  id?: number;
  service_id: number;
  farmer_id: number;
  worker_id: number; // Adaptado de contractor_id[cite: 4]
  value: number;
  status: string;
  insertion_date?: string;
}
