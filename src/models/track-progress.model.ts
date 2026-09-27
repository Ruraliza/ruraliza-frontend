export interface TrackProgress {
  id?: number;
  qualification_track_id: number;
  worker_id: number; // Adaptado de contractor_id[cite: 4]
  workload_done: number;
  status: string;
  insertion_date?: string;
}
