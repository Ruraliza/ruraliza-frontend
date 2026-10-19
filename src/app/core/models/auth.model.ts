// Acesso: login, redefinição de senha (esqueci a senha) e troca de senha com a conta aberta.
// Uma conta (e-mail + senha) por pessoa, com até dois perfis: produtor e trabalhador.
export type UserRole = 'farmer' | 'worker';

// Quem entrou: o frontend guarda isto como usuário atual.
// `role`/`id` são o perfil ativo (o painel aberto); `profiles` diz quais perfis a conta tem.
export interface SessionUser {
  account_id: number;
  role: UserRole;
  id: number;
  profiles: AccountProfiles;
}

export interface AccountProfiles {
  farmer: number | null;
  worker: number | null;
}

// POST /auth/login
export interface LoginInput {
  email: string;
  password: string;
}

// `token` vai em `Authorization: Bearer <token>` nas rotas que exigem a conta aberta.
export interface LoginResponse {
  message: string;
  user: SessionUser;
  token: string;
}

// POST /auth/password-reset (passo 1: informa o e-mail)
export interface PasswordResetRequestInput {
  email: string;
}

// A mesma resposta com e sem conta para o e-mail. O código nunca volta aqui: chega só ao dono do
// e-mail (o envio ainda não existe; até lá, a redefinição pública fica desligada).
export interface PasswordResetRequestResponse {
  message: string;
}

// POST /auth/password-reset/confirm (passo 2: cria a nova senha)
export interface PasswordResetInput {
  token: string;
  password: string;
}

// PATCH /farmers/:id/password e /workers/:id/password (com a conta aberta, sem código por e-mail)
export interface PasswordChangeInput {
  current_password: string;
  new_password: string;
}

// Resposta das rotas que mudam a sessão (cadastro, novo perfil, troca de painel).
export interface SessionResponse {
  message: string;
  user: SessionUser;
}

// POST /accounts/:id/profiles (cria o outro perfil na mesma conta: e-mail e senha são os da conta)
export interface ProfileCreateInput {
  role: UserRole;
  name: string;
  phone: string;
  cpf: string;
  // Só para o perfil de trabalhador (ignorados no de produtor).
  bio?: string | null;
  certificates?: string | null;
  courses?: string | null;
  experience?: string | null;
}

// PATCH /accounts/:id/active-role (troca o painel aberto)
export interface ActiveRoleInput {
  role: UserRole;
}

// Preferências da conta: valem nos dois painéis e em qualquer aparelho em que a pessoa entrar.
// `theme`: 'system' segue o celular/computador. `text_size`: 'large' aumenta todos os textos em 25%.
// `high_contrast`: cores mais fortes e bordas mais escuras (uso sob o sol forte do campo).
// `whatsapp_alerts`: avisos importantes também no WhatsApp do perfil (ex.: candidatura aceita). Desligado por padrão.
export type ThemePreference = 'light' | 'dark' | 'system';
export type TextSize = 'normal' | 'large';

export interface AccountPreferences {
  theme: ThemePreference;
  text_size: TextSize;
  high_contrast: boolean;
  whatsapp_alerts: boolean;
}

// PATCH /accounts/:id/preferences: só o que mudou (ao menos um campo).
export type AccountPreferencesInput = Partial<AccountPreferences>;

export interface PreferencesResponse {
  message: string;
  preferences: AccountPreferences;
}
