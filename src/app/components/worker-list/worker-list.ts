// src/app/components/worker-list/worker-list.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkerService } from '../../services/worker';
import { Worker } from '../../../models/worker.model';

@Component({
  selector: 'app-worker-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './worker-list.html',
  styleUrls: ['./worker-list.css']
})
export class WorkerListComponent implements OnInit {
  private workerService = inject(WorkerService);

  // Estados convertidos para Signals
  workers = signal<Worker[]>([]);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadWorkers();
  }

  loadWorkers() {
    this.workerService.getWorkers().subscribe({
      next: (data) => {
        this.workers.set(data);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Erro ao carregar a lista de trabalhadores.');
      }
    });
  }
}