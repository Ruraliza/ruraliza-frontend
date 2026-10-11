import { RenderMode, ServerRoute } from '@angular/ssr';

// Prerender só na landing (pública e estática).
// Áreas do produtor/trabalhador/sistema, cadastro e acesso (entrar, senha) dependem do usuário
// atual (sessionStorage), do state da navegação e de rotas dinâmicas (:id), então renderizam no browser.
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'creditos', renderMode: RenderMode.Prerender },
  { path: 'produtor/**', renderMode: RenderMode.Client },
  { path: 'trabalhador/**', renderMode: RenderMode.Client },
  { path: 'cadastro/**', renderMode: RenderMode.Client },
  { path: 'conta/**', renderMode: RenderMode.Client },
  { path: 'sistema/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client }
];
