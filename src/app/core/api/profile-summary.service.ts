import { DestroyRef, Injectable, computed, inject, signal, untracked } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRole } from '../models/auth.model';
import { ProfileService } from './profile.service';

// O que o menu mostra de quem está no painel: nome e foto (o avatar da barra de cima).
export interface ProfileSummary {
  name: string;
  photo_url: string | null;
}

interface Target {
  role: UserRole;
  profileId: number;
  summary: ProfileSummary | null; // null: ainda carregando (ou sem conexão)
}

// Nome e foto do perfil do painel aberto. O layout da área conecta ao abrir; a página de perfil
// chama `update` quando o nome ou a foto mudam, e o avatar do menu acompanha na hora.
@Injectable({ providedIn: 'root' })
export class ProfileSummaryService {
  private readonly profiles = inject(ProfileService);
  private readonly target = signal<Target | null>(null);

  readonly summary = computed(() => this.target()?.summary ?? null);

  connect(role: UserRole, profileId: number, destroyRef: DestroyRef): void {
    this.target.set({ role, profileId, summary: null });
    const request: Observable<ProfileSummary> = role === 'farmer' ? this.profiles.getFarmer(profileId) : this.profiles.getWorker(profileId);
    request.subscribe({
      next: (profile) => this.update(role, profileId, profile),
      error: () => undefined // sem conexão: o menu mostra o ícone de perfil no lugar da foto
    });
    destroyRef.onDestroy(() => {
      if (this.matches(role, profileId)) this.target.set(null);
    });
  }

  // Perfil salvo ou foto trocada. Resposta de um painel que já foi trocado é ignorada.
  // Lê o estado sem rastrear: a página de perfil chama de dentro de um effect, e ler e escrever
  // o mesmo signal ali faria o effect rodar de novo sem parar.
  update(role: UserRole, profileId: number, profile: ProfileSummary): void {
    untracked(() => {
      const current = this.target();
      if (current && this.matches(role, profileId)) {
        this.target.set({ ...current, summary: { name: profile.name, photo_url: profile.photo_url } });
      }
    });
  }

  private matches(role: UserRole, profileId: number): boolean {
    const current = this.target();
    return current?.role === role && current.profileId === profileId;
  }
}
