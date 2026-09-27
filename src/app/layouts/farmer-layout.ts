import { Component } from '@angular/core';
import { AppShell, NavItem } from './app-shell';

@Component({
  selector: 'app-farmer-layout',
  imports: [AppShell],
  template: `<app-shell [items]="items" areaLabel="Área do produtor" />`
})
export class FarmerLayout {
  readonly items: NavItem[] = [
    { label: 'Início', icon: 'home', link: '/produtor', exact: true },
    { label: 'Serviços', icon: 'list', link: '/produtor/servicos' },
    { label: 'Novo serviço', icon: 'plus', link: '/produtor/servicos/novo', primary: true },
    { label: 'Fazendas', icon: 'farm', link: '/produtor/fazendas' },
    { label: 'Perfil', icon: 'user', link: '/produtor/perfil' }
  ];
}
