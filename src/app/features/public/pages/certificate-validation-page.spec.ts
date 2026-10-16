import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CertificateService } from '@core/api/certificate.service';
import { Certificate } from '@core/models/track.model';
import { CertificateValidationPage } from './certificate-validation-page';

const CERTIFICATE: Certificate = {
  code: 'RZ-7K3Q-9FMA-2X',
  track_id: 1,
  track_title: 'Colheita de café',
  worker_name: 'Maria Trabalhadora',
  workload_minutes: 90,
  completed_at: '2026-10-03T18:00:00.000Z',
  data_hash: '2477ab9df8d56acff58145d14b245184c8ab787ee12baf2a4ab81613394ec822'
};

describe('CertificateValidationPage', () => {
  // A página aberta pelo QR code (/certificados/:code), com a resposta da API.
  async function open(certificate: Certificate): Promise<string> {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: CertificateService, useValue: { getCertificate: () => of(certificate) } }]
    });
    const fixture = TestBed.createComponent(CertificateValidationPage);
    fixture.componentRef.setInput('code', certificate.code);
    fixture.detectChanges();
    // O resumo é recalculado com o Web Crypto, que responde depois.
    await vi.waitFor(() => expect(fixture.componentInstance.result.state().status).toBe('success'));
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('mostra o resumo SHA-256 e confere que os dados batem com ele', async () => {
    const text = await open(CERTIFICATE);

    expect(text).toContain('Certificado válido');
    expect(text).toContain('Resumo SHA-256 dos dados');
    expect(text).toContain('2477ab9df8d56acff58145d1');
    expect(text).toContain('Confere com os dados acima: nada mudou desde a emissão.');
  });

  it('avisa quando os dados não batem com o resumo gravado na emissão', async () => {
    const text = await open({ ...CERTIFICATE, workload_minutes: 900 });

    expect(text).toContain('Dados alterados depois da emissão');
    expect(text).not.toContain('Certificado válido');
    expect(text).not.toContain('Confere com os dados acima');
  });
});
