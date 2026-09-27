// src/app/components/worker-registration/worker-registration.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { WorkerService } from '../../services/worker'; 
import { Worker } from '../../../models/worker.model';

@Component({
  selector: 'app-worker-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './worker-registration.html',
  styleUrls: ['./worker-registration.css']
})
export class WorkerRegistrationComponent {
  private fb = inject(FormBuilder);
  private workerService = inject(WorkerService);

  workerForm: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';

  constructor() {
    this.workerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      cpf: ['', Validators.required],
      certificates: [''], // Opcional
      experience: [''] // Opcional
    });
  }

  onSubmit() {
    if (this.workerForm.invalid) {
      this.errorMessage = 'Por favor, preencha todos os campos obrigatórios.';
      return;
    }

    const newWorker: Worker = this.workerForm.value;

    this.workerService.createWorker(newWorker).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.errorMessage = '';
        this.workerForm.reset();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erro ao cadastrar trabalhador. Verifique os dados e tente novamente.';
        this.successMessage = '';
      }
    });
  }
}