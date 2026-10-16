import { Certificate } from '@core/models/track.model';
import { certificateHash, hashGroups, hashMatches } from './certificate-hash';

// O mesmo exemplo do teste da API (sha256-certificate-hasher.spec.ts): os dois lados calculam igual.
const CERTIFICATE: Certificate = {
  code: 'RZ-7K3Q-9FMA-2X',
  track_id: 1,
  track_title: 'Colheita de café',
  worker_name: 'Maria Trabalhadora',
  workload_minutes: 90,
  completed_at: '2026-10-03T18:00:00.000Z',
  data_hash: '2477ab9df8d56acff58145d14b245184c8ab787ee12baf2a4ab81613394ec822'
};

describe('resumo SHA-256 do certificado', () => {
  it('recalcula com a mesma receita da API', async () => {
    expect(await certificateHash(CERTIFICATE)).toBe(CERTIFICATE.data_hash);
  });

  it('confere: os dados de agora contra o resumo da emissão', async () => {
    expect(await hashMatches(CERTIFICATE)).toBe(true);
    expect(await hashMatches({ ...CERTIFICATE, workload_minutes: 900 })).toBe(false);
    expect(await hashMatches({ ...CERTIFICATE, data_hash: '' })).toBeNull(); // API anterior ao resumo
  });

  it('separa em 8 grupos para comparar a olho', () => {
    expect(hashGroups(CERTIFICATE.data_hash)).toEqual(['2477ab9d', 'f8d56acf', 'f58145d1', '4b245184', 'c8ab787e', 'e12baf2a', '4ab81613', '394ec822']);
  });
});
