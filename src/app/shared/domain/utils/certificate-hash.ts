import { Certificate } from '@core/models/track.model';

type HashedData = Pick<Certificate, 'code' | 'worker_name' | 'track_title' | 'workload_minutes' | 'completed_at'>;

// O resumo SHA-256 do certificado (`data_hash`), recalculado no navegador com a mesma receita da API:
// JSON de [code, worker_name, track_title, workload_minutes, completed_at], sem espaços, em UTF-8.
// null quando o navegador não calcula SHA-256 (o Web Crypto só existe em HTTPS e no localhost).
export async function certificateHash(data: HashedData): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return null;
  try {
    const text = JSON.stringify([data.code, data.worker_name, data.track_title, data.workload_minutes, data.completed_at]);
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  } catch {
    return null;
  }
}

// true: os dados batem com o resumo gravado na emissão; false: algum dado mudou depois;
// null: não deu para conferir (navegador sem Web Crypto, ou API antiga, sem o resumo).
export async function hashMatches(certificate: Certificate): Promise<boolean | null> {
  if (!certificate.data_hash) return null;
  const hash = await certificateHash(certificate);
  return hash === null ? null : hash === certificate.data_hash;
}

// 64 caracteres em 8 grupos de 4 bytes, para comparar a olho com o resumo impresso.
export function hashGroups(hash: string): string[] {
  return hash.match(/.{1,8}/g) ?? [];
}
