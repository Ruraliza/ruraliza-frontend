import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Certificate } from '@core/models/track.model';
import { QrCode } from '@shared/ui/qr-code';
import { CertificateView } from './certificate-view';

const CERTIFICATE: Certificate = {
  code: 'RZ-7K3Q-9FMA-2X',
  track_id: 1,
  track_title: 'Colheita de café',
  worker_name: 'Maria Trabalhadora',
  workload_minutes: 90,
  completed_at: '2026-10-03T18:00:00.000Z',
  data_hash: '2477ab9df8d56acff58145d14b245184c8ab787ee12baf2a4ab81613394ec822'
};

describe('CertificateView', () => {
  function render(certificate: Certificate) {
    const fixture = TestBed.createComponent(CertificateView);
    fixture.componentRef.setInput('certificate', certificate);
    fixture.detectChanges();
    return fixture;
  }

  it('imprime o QR code da página de validação e o resumo SHA-256 dos dados', () => {
    const fixture = render(CERTIFICATE);
    const sheet = fixture.nativeElement as HTMLElement;
    const qr = fixture.debugElement.query(By.directive(QrCode));

    expect((qr.componentInstance as QrCode).value()).toBe(`${location.origin}/certificados/RZ-7K3Q-9FMA-2X`);
    expect(qr.nativeElement.getAttribute('aria-label')).toBe('QR code para validar o certificado');
    expect(sheet.querySelector('app-qr-code path')?.getAttribute('d')).toMatch(/^M4 4h7v1h-7z/);
    expect(sheet.textContent).toContain('Resumo SHA-256 dos dados');
    // Os grupos são só visuais: o texto é o resumo inteiro, sem espaços.
    expect(sheet.querySelector('.hash')?.textContent).toBe(CERTIFICATE.data_hash);
  });

  it('sem o resumo (API anterior a ele), mantém o código e o QR code', () => {
    const sheet = render({ ...CERTIFICATE, data_hash: '' }).nativeElement as HTMLElement;

    expect(sheet.textContent).not.toContain('Resumo SHA-256');
    expect(sheet.textContent).toContain('RZ-7K3Q-9FMA-2X');
    expect(sheet.querySelector('app-qr-code')).not.toBeNull();
  });
});
