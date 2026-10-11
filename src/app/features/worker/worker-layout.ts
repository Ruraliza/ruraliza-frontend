import { Component } from '@angular/core';
import { AppShell, NavItem } from '@core/layout/app-shell';

@Component({
  selector: 'app-worker-layout',
  imports: [AppShell],
  template: `<app-shell [items]="items" area="worker" areaLabel="Área do trabalhador" />`
})
export class WorkerLayout {
  readonly items: NavItem[] = [
    { label: 'Início', icon: 'home', link: '/trabalhador', exact: true },
    { label: 'Vagas', icon: 'briefcase', link: '/trabalhador/vagas' },
    { label: 'Buscar', icon: 'search', link: '/trabalhador/vagas', queryParams: { buscar: '1' }, primary: true },
    { label: 'Candidaturas', icon: 'list', link: '/trabalhador/candidaturas' },
    { label: 'Trilhas', icon: 'book', link: '/trabalhador/trilhas' },
    { label: 'Perfil', icon: 'user', link: '/trabalhador/perfil' }
  ];
}
