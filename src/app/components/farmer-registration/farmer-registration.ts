// src/app/components/farmer-registration/farmer-registration.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { FarmerService } from '../../services/farmer'; // Importação atualizada
import { Farmer } from '../../../models/farmer.model';

@Component({
  selector: 'app-farmer-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './farmer-registration.html',
  styleUrls: ['./farmer-registration.css']
})
export class FarmerRegistrationComponent {
  // Injeção de dependências no padrão Angular moderno
  private fb = inject(FormBuilder);
  private farmerService = inject(FarmerService);

  farmerForm: FormGroup;
  successMessage: string = '';
  errorMessage: string = '';

  constructor() {
    // Espelha a validação de obrigatoriedade que criamos no backend
    this.farmerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      cpf: ['', Validators.required],
      farms: [null] // Opcional, como definido na regra de negócio
    });
  }

  onSubmit() {
    if (this.farmerForm.invalid) {
      this.errorMessage = 'Por favor, preencha todos os campos obrigatórios.';
      return;
    }

    const newFarmer: Farmer = this.farmerForm.value;

    this.farmerService.createFarmer(newFarmer).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.errorMessage = '';
        this.farmerForm.reset();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erro ao cadastrar produtor. Verifique os dados e tente novamente.';
        this.successMessage = '';
      }
    });
  }
}