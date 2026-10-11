import { Component } from '@angular/core';
import { Photo } from './photo';

// Trilhas de qualificação: recurso em desenvolvimento. Cargas horárias são previstas
// e a barra de progresso é só um exemplo de como vai aparecer.
@Component({
  selector: 'app-tracks-section',
  imports: [Photo],
  template: `
    <section class="tracks" aria-labelledby="trilhas-title">
      <div class="container">
        <div class="head">
          <h2 id="trilhas-title">Trilhas de qualificação</h2>
          <span class="soon">Em breve</span>
        </div>
        <p class="support">
          Estamos preparando cursos práticos para quem quer começar ou crescer no campo.
          O recurso ainda está em desenvolvimento; abaixo, uma prévia de como vai funcionar.
        </p>
        <ul class="list" role="list">
          @for (t of tracks; track t.title) {
            <li class="track">
              <app-photo class="img" [file]="t.photo" [decorative]="true" sizes="(min-width: 900px) 33vw, 100vw" />
              <div class="body">
                <h3>{{ t.title }}</h3>
                <p class="hours">Carga horária prevista: {{ t.hours }} horas</p>
                <div class="progress">
                  <span class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="t.example" [attr.aria-label]="'Exemplo de progresso: ' + t.example + '%'">
                    <span [style.width.%]="t.example"></span>
                  </span>
                  <small>Exemplo de progresso</small>
                </div>
              </div>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    .tracks { padding-block: var(--space-24); background: var(--bg-alt); }
    .head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-4); }
    h2 { font: 800 clamp(34px, 5vw, 56px)/1.02 var(--font-display); letter-spacing: -0.03em; }
    .soon { padding: var(--space-1) var(--space-4); border-radius: var(--radius-pill); background: var(--orange-500); color: var(--ink); font-weight: 700; }
    .support { margin: var(--space-4) 0 var(--space-12); font-size: 18px; line-height: 28px; color: var(--ink-muted); max-width: 56ch; }
    .list { display: grid; gap: var(--space-4); }
    @media (min-width: 900px) { .list { grid-template-columns: repeat(3, 1fr); } }
    .track { overflow: hidden; border-radius: var(--radius-lg); background: var(--bg); border: 1px solid var(--line); }
    .img { aspect-ratio: 16 / 10; }
    .body { display: grid; gap: var(--space-3); padding: var(--space-6); }
    h3 { font: 700 20px/26px var(--font-display); }
    .hours { color: var(--ink-muted); }
    .progress { display: grid; gap: var(--space-1); }
    .bar { display: block; height: 8px; border-radius: var(--radius-pill); background: var(--lime-100); overflow: hidden; }
    .bar span { display: block; height: 100%; border-radius: inherit; background: var(--lime-500); }
    small { color: var(--ink-muted); font-size: 13px; }
  `
})
export class TracksSection {
  readonly tracks = [
    { title: 'Aplicação segura de defensivos', hours: 16, example: 35, photo: 'trilha-defensivos' },
    { title: 'Operação de máquinas agrícolas', hours: 40, example: 60, photo: 'trilha-maquinas' },
    { title: 'Manejo de gado de corte e leite', hours: 24, example: 15, photo: 'trilha-gado' }
  ];
}
