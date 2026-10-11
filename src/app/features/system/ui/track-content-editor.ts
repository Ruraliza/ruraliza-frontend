import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TrackContentInput, TrackModule } from '@core/models/track.model';
import { formatDuration } from '@shared/utils/format';
import { Button } from '@shared/ui/button';
import { FormField } from '@shared/ui/form-field';
import { Icon } from '@shared/ui/icon';

type LessonForm = FormGroup<{
  id: FormControl<number | null>;
  title: FormControl<string>;
  video_url: FormControl<string>;
  content: FormControl<string>;
  duration_minutes: FormControl<number>;
}>;
type ModuleForm = FormGroup<{ id: FormControl<number | null>; title: FormControl<string>; lessons: FormArray<LessonForm> }>;

const VIDEO_HOSTS = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com|vimeo\.com|player\.vimeo\.com)\//i;

// Link do YouTube ou do Vimeo (a API confere o formato exato e guarda o link canônico).
function videoUrl(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value.trim();
  return !value || VIDEO_HOSTS.test(value) ? null : { video: true };
}

// A aula precisa de vídeo ou de texto.
function videoOrText(group: AbstractControl): ValidationErrors | null {
  const { video_url, content } = (group as LessonForm).getRawValue();
  return video_url.trim() || content.trim() ? null : { empty: true };
}

const MESSAGES = {
  duration: { required: 'Informe a duração.', min: 'De 1 a 600 minutos.', max: 'De 1 a 600 minutos.', pattern: 'Use minutos inteiros.' },
  video: { video: 'Use um link do YouTube ou do Vimeo.' }
};

// Editor de módulos e aulas: adicionar, remover e reordenar, e salvar tudo de uma vez (PUT content).
// Cada aula guarda o `id` que veio da API: assim o progresso dos alunos continua valendo.
@Component({
  selector: 'app-track-content-editor',
  imports: [ReactiveFormsModule, Button, FormField, Icon],
  templateUrl: './track-content-editor.html',
  styleUrl: './track-content-editor.css'
})
export class TrackContentEditor {
  readonly modules = input.required<TrackModule[]>();
  readonly readonly = input(false);
  readonly saving = input(false);
  // Publicada ou descontinuada: não pode ficar sem aula nem com módulo vazio.
  readonly live = input(false);

  readonly save = output<TrackContentInput>();

  private readonly fb = inject(NonNullableFormBuilder);
  readonly form = new FormArray<ModuleForm>([]);
  readonly messages = MESSAGES;

  // O FormArray não é signal: este contador muda a cada alteração do formulário.
  private readonly version = signal(0);
  readonly workload = computed(() => {
    this.version();
    const minutes = this.form.controls.flatMap((m) => m.controls.lessons.controls).reduce((sum, l) => sum + (Number(l.controls.duration_minutes.value) || 0), 0);
    return formatDuration(minutes);
  });
  readonly emptyModules = computed(() => {
    this.version();
    return this.form.controls.some((m) => m.controls.lessons.length === 0) || this.form.length === 0;
  });
  readonly dirty = signal(false);
  readonly submittedOnce = signal(false);

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.version.update((v) => v + 1);
      this.dirty.set(this.form.dirty);
    });
    // O conteúdo salvo (ou recarregado) substitui o formulário.
    effect(() => {
      const modules = this.modules();
      this.form.clear({ emitEvent: false });
      for (const m of modules) this.form.push(this.moduleForm(m), { emitEvent: false });
      this.form.markAsPristine();
      this.dirty.set(false);
      this.submittedOnce.set(false);
      this.version.update((v) => v + 1);
    });
    effect(() => {
      if (this.readonly()) this.form.disable({ emitEvent: false });
      else this.form.enable({ emitEvent: false });
    });
  }

  addModule(): void {
    this.form.push(this.moduleForm({ id: null, title: '', lessons: [] }));
    this.form.markAsDirty();
  }

  addLesson(module: ModuleForm): void {
    module.controls.lessons.push(this.lessonForm());
    this.form.markAsDirty();
  }

  // Serve para a lista de módulos e para as aulas de um módulo.
  move(list: FormArray<ModuleForm> | FormArray<LessonForm>, index: number, delta: -1 | 1): void {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const array: FormArray = list; // sem o tipo dos itens: troca de posição vale para os dois tipos
    const control = array.at(index);
    array.removeAt(index, { emitEvent: false });
    array.insert(target, control);
    this.form.markAsDirty();
  }

  remove(list: FormArray<ModuleForm> | FormArray<LessonForm>, index: number): void {
    list.removeAt(index);
    this.form.markAsDirty();
  }

  submit(): void {
    this.submittedOnce.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid || (this.live() && this.emptyModules())) return;
    this.save.emit({
      modules: this.form.getRawValue().map((m) => ({
        ...(m.id === null ? {} : { id: m.id }),
        title: m.title.trim(),
        lessons: m.lessons.map((l) => ({
          ...(l.id === null ? {} : { id: l.id }),
          title: l.title.trim(),
          video_url: l.video_url.trim() || null,
          content: l.content.trim(),
          duration_minutes: Number(l.duration_minutes)
        }))
      }))
    });
  }

  private moduleForm(m: { id: number | null; title: string; lessons: TrackModule['lessons'] }): ModuleForm {
    return this.fb.group({
      id: new FormControl<number | null>(m.id),
      title: this.fb.control(m.title, [Validators.required, Validators.maxLength(120)]),
      lessons: new FormArray<LessonForm>(m.lessons.map((l) => this.lessonForm(l)))
    });
  }

  private lessonForm(l?: TrackModule['lessons'][number]): LessonForm {
    return this.fb.group(
      {
        id: new FormControl<number | null>(l?.id ?? null),
        title: this.fb.control(l?.title ?? '', [Validators.required, Validators.maxLength(120)]),
        video_url: this.fb.control(l?.video_url ?? '', [videoUrl]),
        content: this.fb.control(l?.content ?? '', [Validators.maxLength(20000)]),
        duration_minutes: this.fb.control(l?.duration_minutes ?? 10, [Validators.required, Validators.min(1), Validators.max(600), Validators.pattern(/^\d+$/)])
      },
      { validators: [videoOrText] }
    );
  }
}
