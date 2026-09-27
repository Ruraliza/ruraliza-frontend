// src/app/components/farmer-list/farmer-list.ts
import { Component, inject, OnInit } from '@angular/core';
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

  farmers: Farmer[] = [];
  errorMessage: string = '';

  ngOnInit(): void {
    this.loadFarmers();
  }

  loadFarmers() {
    this.farmerService.getFarmers().subscribe({
      next: (data) => {
        this.farmers = data;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erro ao carregar a lista de produtores.';
      }
    });
  }
}
