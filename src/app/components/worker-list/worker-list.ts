// src/app/components/worker-list/worker-list.ts
import { Component, inject, OnInit } from '@angular/core';
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

  workers: Worker[] = [];
  errorMessage: string = '';

  ngOnInit(): void {
    this.loadWorkers();
  }

  loadWorkers() {
    this.workerService.getWorkers().subscribe({
      next: (data) => {
        this.workers = data;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erro ao carregar a lista de trabalhadores.';
      }
    });
  }
}