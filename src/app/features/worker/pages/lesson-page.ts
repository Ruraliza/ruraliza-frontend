import { Component, ElementRef, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, filter, throwError } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { CurrentUserService } from '@core/session/current-user.service';
import { Certificate, EnrolledTrack, Lesson } from '@core/models/track.model';
import { RemoteData } from '@shared/utils/remote-data';
import { formatDuration } from '@shared/utils/format';
import { renderMarkdown } from '@shared/utils/markdown';
import { videoEmbed } from '@shared/utils/video';
import { Button } from '@shared/ui/button';
import { ErrorState } from '@shared/ui/error-state';
import { Icon } from '@shared/ui/icon';
import { ProgressBar } from '@shared/ui/progress-bar';
import { Skeleton } from '@shared/ui/skeleton';
import { LearningService } from '../data-access/learning.service';
import { TrackOutline } from '../ui/track-outline';

interface Position {
  lesson: Lesson;
  moduleTitle: string;
  moduleNumber: number;
  previous: Lesson | null;
  next: Lesson | null;
}

// Player da trilha: a aula (vídeo e texto) e, à direita, módulos e aulas com o progresso.
// No celular/tablet (< 1024px) o conteúdo da trilha vira um painel retrátil, aberto pelo botão
// "Conteúdo da trilha" (<dialog> modal: foco preso e Esc para fechar).
// Sem aula na URL (/aulas), abre a primeira aula ainda não concluída.
@Component({
  selector: 'app-lesson-page',
  imports: [NgTemplateOutlet, RouterLink, Button, ErrorState, Icon, ProgressBar, Skeleton, TrackOutline],
  template: `
    @switch (track.state().status) {
      @case ('loading') { <div class="container page"><app-skeleton [count]="2" [height]="240" /></div> }
      @case ('error') { <div class="container page"><app-error-state [message]="track.error()" (retry)="track.load()" /></div> }
      @case ('success') {
        @if (track.data(); as t) {
          <div class="player">
            <div class="lesson container page">
              <a class="back-link" [routerLink]="['/trabalhador/trilhas', t.id]"><app-icon name="arrow-left" [size]="20" />{{ t.title }}</a>

              <button type="button" class="outline-toggle" aria-controls="conteudo-trilha" [attr.aria-expanded]="drawerOpen()" (click)="openDrawer()">
                <app-icon name="list" [size]="20" />
                <span>Conteúdo da trilha</span>
                <span class="muted t-body-sm">{{ t.progress.completed_lessons }}/{{ t.progress.total_lessons }}</span>
              </button>

              @if (position(); as pos) {
                <header class="stack-sm">
                  <p class="t-label muted">Módulo {{ pos.moduleNumber }}: {{ pos.moduleTitle }}</p>
                  <h1>{{ pos.lesson.title }}</h1>
                  <p class="t-body-sm muted with-icon"><app-icon name="clock" [size]="16" />{{ duration(pos.lesson.duration_minutes) }}</p>
                </header>

                @if (embed(); as src) {
                  <div class="video">
                    <iframe
                      [src]="src"
                      [title]="'Vídeo da aula: ' + pos.lesson.title"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowfullscreen
                      referrerpolicy="strict-origin-when-cross-origin"
                    ></iframe>
                  </div>
                }

                @if (contentHtml()) { <div class="prose" [innerHTML]="contentHtml()"></div> }

                <div class="actions">
                  @if (isDone()) {
                    <p class="done t-label"><app-icon name="check" [size]="20" />Aula concluída</p>
                    <button appButton variant="ghost" type="button" [loading]="saving()" (click)="uncomplete(t, pos.lesson)">Desmarcar</button>
                  } @else {
                    <button appButton type="button" [loading]="saving()" (click)="complete(t, pos)">
                      {{ pos.next ? 'Concluir e continuar' : 'Concluir aula' }}<app-icon name="check" [size]="20" />
                    </button>
                  }
                </div>

                <nav class="pager" aria-label="Navegar entre as aulas">
                  @if (pos.previous; as prev) {
                    <a appButton variant="secondary" [routerLink]="['/trabalhador/trilhas', t.id, 'aulas', prev.id]"><app-icon name="arrow-left" [size]="20" />Anterior</a>
                  } @else { <span></span> }
                  @if (pos.next; as next) {
                    <a appButton variant="secondary" [routerLink]="['/trabalhador/trilhas', t.id, 'aulas', next.id]">Próxima<app-icon name="arrow-right" [size]="20" /></a>
                  }
                </nav>
              } @else {
                <app-skeleton [count]="1" [height]="240" />
              }
            </div>

            <!-- Desktop: barra lateral direita. Celular/tablet: o mesmo conteúdo no painel retrátil. -->
            <aside class="side" aria-label="Conteúdo da trilha">
              <ng-container *ngTemplateOutlet="outline" />
            </aside>
            <dialog #drawer id="conteudo-trilha" class="drawer" aria-label="Conteúdo da trilha" (close)="drawerOpen.set(false)" (click)="onBackdrop($event)">
              <div class="drawer-head">
                <span class="t-h3">Conteúdo da trilha</span>
                <button type="button" class="close" (click)="closeDrawer()"><app-icon name="x" label="Fechar" /></button>
              </div>
              <ng-container *ngTemplateOutlet="outline" />
            </dialog>

            <ng-template #outline>
              <div class="side-body">
                <div class="stack-sm">
                  <p class="t-label">{{ t.title }}</p>
                  <p class="t-body-sm muted">{{ t.progress.percent }}% concluído, {{ duration(t.workload_minutes) }} no total</p>
                  <app-progress-bar [value]="t.progress.percent" [label]="'Progresso em ' + t.title" />
                  @if (t.certificate_code) {
                    <a class="cert t-label" [routerLink]="['/trabalhador/certificados', t.certificate_code]"><app-icon name="award" [size]="18" />Ver certificado</a>
                  }
                </div>
                <app-track-outline [modules]="t.modules" [completed]="t.completed_lesson_ids" [currentId]="position()?.lesson?.id ?? null" [trackId]="t.id" />
              </div>
            </ng-template>
          </div>

          <dialog #congrats class="congrats" aria-labelledby="parabens-titulo" (close)="issued.set(null)">
            @if (issued(); as c) {
              <app-icon name="award" [size]="48" />
              <h2 id="parabens-titulo">Parabéns, trilha concluída!</h2>
              <p class="muted">Você concluiu <b>{{ c.track_title }}</b>. Seu certificado de {{ duration(c.workload_minutes) }} já está pronto.</p>
              <div class="congrats-actions">
                <button appButton variant="secondary" type="button" (click)="congratsDialog().nativeElement.close()">Fechar</button>
                <a appButton [routerLink]="['/trabalhador/certificados', c.code]">Ver certificado</a>
              </div>
            }
          </dialog>
        }
      }
    }
  `,
  styleUrl: './lesson-page.css'
})
export class LessonPage {
  // Parâmetros da rota (withComponentInputBinding).
  readonly id = input.required<string>();
  readonly lessonId = input<string>();

  private readonly learning = inject(LearningService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly workerId = inject(CurrentUserService).requireId('worker');

  private readonly drawer = viewChild<ElementRef<HTMLDialogElement>>('drawer');
  readonly congratsDialog = viewChild.required<ElementRef<HTMLDialogElement>>('congrats');

  // Quem ainda não começou a trilha (403) vai para a página dela, onde está o "Começar".
  readonly track = new RemoteData(() =>
    this.learning.getEnrolledTrack(this.workerId, Number(this.id())).pipe(
      catchError((error: unknown) => {
        if (!(error instanceof ApiError) || error.status !== 403) return throwError(() => error);
        void this.router.navigate(['/trabalhador/trilhas', this.id()], { replaceUrl: true });
        return EMPTY;
      })
    )
  );
  readonly drawerOpen = signal(false);
  readonly saving = signal(false);
  readonly issued = signal<Certificate | null>(null);

  readonly lessons = computed(() => (this.track.data()?.modules ?? []).flatMap((m) => m.lessons));

  readonly position = computed<Position | null>(() => {
    const t = this.track.data();
    const wanted = Number(this.lessonId());
    if (!t) return null;
    const all = this.lessons();
    const index = all.findIndex((l) => l.id === wanted);
    const lesson = all[index];
    if (!lesson) return null;
    const moduleIndex = t.modules.findIndex((m) => m.lessons.some((l) => l.id === lesson.id));
    return {
      lesson,
      moduleTitle: t.modules[moduleIndex]?.title ?? '',
      moduleNumber: moduleIndex + 1,
      previous: all[index - 1] ?? null,
      next: all[index + 1] ?? null
    };
  });

  readonly isDone = computed(() => {
    const lesson = this.position()?.lesson;
    return lesson !== undefined && (this.track.data()?.completed_lesson_ids ?? []).includes(lesson.id);
  });

  // Só links já validados (YouTube/Vimeo, https) chegam ao iframe.
  readonly embed = computed<SafeResourceUrl | null>(() => {
    const video = videoEmbed(this.position()?.lesson.video_url ?? null);
    return video ? this.sanitizer.bypassSecurityTrustResourceUrl(video.src) : null;
  });
  readonly contentHtml = computed(() => renderMarkdown(this.position()?.lesson.content ?? ''));

  readonly duration = formatDuration;

  constructor() {
    effect(() => {
      this.id();
      untracked(() => this.track.load());
    });

    // Sem aula na URL, ou com uma aula que o tutor tirou da trilha: vai para a próxima pendente.
    effect(() => {
      const t = this.track.data();
      if (t && this.position() === null) untracked(() => this.goToNext(t));
    });

    // Trocar de aula pelo painel fecha o painel.
    this.router.events.pipe(filter((e) => e instanceof NavigationStart), takeUntilDestroyed()).subscribe(() => this.closeDrawer());
  }

  goToNext(t: EnrolledTrack): void {
    const done = new Set(t.completed_lesson_ids);
    const all = this.lessons();
    const target = all.find((l) => !done.has(l.id)) ?? all[0];
    if (target) void this.router.navigate(['/trabalhador/trilhas', t.id, 'aulas', target.id], { replaceUrl: true });
  }

  complete(t: EnrolledTrack, pos: Position): void {
    this.saving.set(true);
    this.learning.completeLesson(this.workerId, t.id, pos.lesson.id).subscribe({
      next: ({ track, issued_certificate }) => {
        this.saving.set(false);
        this.track.replace(track);
        if (issued_certificate) {
          this.issued.set(issued_certificate);
          this.congratsDialog().nativeElement.showModal();
        } else if (pos.next) {
          void this.router.navigate(['/trabalhador/trilhas', t.id, 'aulas', pos.next.id]);
        }
      },
      error: (error: unknown) => this.onActionError(error)
    });
  }

  uncomplete(t: EnrolledTrack, lesson: Lesson): void {
    this.saving.set(true);
    this.learning.uncompleteLesson(this.workerId, t.id, lesson.id).subscribe({
      next: ({ track }) => {
        this.saving.set(false);
        this.track.replace(track);
      },
      error: (error: unknown) => this.onActionError(error)
    });
  }

  openDrawer(): void {
    const dialog = this.drawer()?.nativeElement;
    if (dialog && !dialog.open) {
      dialog.showModal();
      this.drawerOpen.set(true);
    }
  }

  closeDrawer(): void {
    const dialog = this.drawer()?.nativeElement;
    if (dialog?.open) dialog.close();
  }

  // Toque fora do painel (no fundo escurecido) fecha.
  onBackdrop(event: MouseEvent): void {
    if (event.target === this.drawer()?.nativeElement) this.closeDrawer();
  }

  // A mensagem já saiu no toast; a aula pode ter sido removida pelo tutor: recarrega a trilha.
  private onActionError(error: unknown): void {
    this.saving.set(false);
    if (error instanceof ApiError) this.track.refresh();
  }
}
