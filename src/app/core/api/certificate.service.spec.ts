import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { SILENT_ERRORS } from '../http/error.interceptor';
import { CertificateService } from './certificate.service';

describe('CertificateService', () => {
  it('valida o código sem toast de erro (código errado é um resultado da tela)', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);

    TestBed.inject(CertificateService).getCertificate(' RZ-AB12-CD34-EF ').subscribe((c) => expect(c.worker_name).toBe('Lia'));

    const req = http.expectOne(`${environment.apiUrl}/certificates/RZ-AB12-CD34-EF`);
    expect(req.request.context.get(SILENT_ERRORS)).toBe(true);
    req.flush({ code: 'RZ-AB12-CD34-EF', worker_name: 'Lia' });
    http.verify();
  });
});
