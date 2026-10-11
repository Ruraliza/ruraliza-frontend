import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { SILENT_ERRORS } from '@core/http/error.interceptor';
import { LearningService } from './learning.service';

describe('LearningService', () => {
  const base = `${environment.apiUrl}/workers`;
  let service: LearningService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(LearningService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista as trilhas com os filtros preenchidos e pula os vazios', () => {
    service.listTracks({ category: 'Colheita', q: '', worker_id: 9 }).subscribe();

    const req = http.expectOne((r) => r.url === `${base}/tracks`);
    expect(req.request.params.get('category')).toBe('Colheita');
    expect(req.request.params.has('q')).toBe(false);
    expect(req.request.params.get('worker_id')).toBe('9');
    req.flush([]);
  });

  it('lê o detalhe com o trabalhador e começa a trilha', () => {
    service.getTrack(3, 9).subscribe();
    const detail = http.expectOne((r) => r.url === `${base}/tracks/3`);
    expect(detail.request.params.get('worker_id')).toBe('9');
    detail.flush({});

    service.enroll(3, 9).subscribe();
    const enroll = http.expectOne(`${base}/tracks/3/enroll`);
    expect(enroll.request.method).toBe('POST');
    expect(enroll.request.body).toEqual({ worker_id: 9 });
    enroll.flush({ message: 'ok', track: {} });
  });

  it('estuda a trilha sem toast quando ainda não começou', () => {
    service.getEnrolledTrack(9, 3).subscribe({ error: () => undefined });
    const req = http.expectOne(`${base}/9/tracks/3`);
    expect(req.request.context.get(SILENT_ERRORS)).toBe(true);
    req.flush({ error: 'Você ainda não começou esta trilha.' }, { status: 403, statusText: 'Forbidden' });
  });

  it('conclui e desmarca aulas', () => {
    service.completeLesson(9, 3, 7).subscribe();
    const put = http.expectOne(`${base}/9/tracks/3/lessons/7/completion`);
    expect(put.request.method).toBe('PUT');
    put.flush({ message: 'ok', track: {}, issued_certificate: null });

    service.uncompleteLesson(9, 3, 7).subscribe();
    expect(http.expectOne(`${base}/9/tracks/3/lessons/7/completion`).request.method).toBe('DELETE');
  });

  it('lê os certificados do trabalhador', () => {
    service.getCertificates(9).subscribe();
    http.expectOne(`${base}/9/certificates`).flush([]);
  });
});
