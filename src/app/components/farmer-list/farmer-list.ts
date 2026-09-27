import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FarmerService } from '../../services/farmer';
import { Farmer } from '../../../models/farmer.model';

@Component({
  selector: 'app-farmer-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './farmer-list.html',
  styleUrls: ['./farmer-list.css']
})
export class FarmerListComponent implements OnInit {
  private farmerService = inject(FarmerService);

  // Transformando os estados em Signals
  farmers = signal<Farmer[]>([]);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.loadFarmers();
  }

  loadFarmers() {
    this.farmerService.getFarmers().subscribe({
      next: (data) => {
        // Atualiza o Signal, forçando a tela a redesenhar
        this.farmers.set(data);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Erro ao carregar a lista de produtores.');
      }
    });
  }
}