import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  const farmers = `${environment.apiUrl}/farmers`;
  const workers = `${environment.apiUrl}/workers`;
  let service: ProfileService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProfileService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates a farmer account and gets its session', () => {
    const input = { name: 'Ana', email: 'ana@exemplo.com', phone: '24999990000', cpf: '52998224725', password: 'senha-forte-1', accept_terms: true };
    const user = { account_id: 1, role: 'farmer' as const, id: 1, profiles: { farmer: 1, worker: null } };
    service.createFarmer(input).subscribe((res) => expect([res.farmer.id, res.user]).toEqual([1, user]));

    const req = http.expectOne(farmers);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    const { password: _password, accept_terms: _accepted, ...profile } = input;
    req.flush({ message: 'ok', farmer: { ...profile, id: 1, farms: [], insertion_date: '2026-01-01' }, user });
  });

  it('uploads the resume as the raw PDF body and deletes it', () => {
    const pdf = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    service.uploadResume(9, pdf).subscribe();

    const req = http.expectOne(`${workers}/9/resume`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(pdf);
    expect(req.request.headers.get('Content-Type')).toBe('application/pdf');
    req.flush({ message: 'ok', worker: {} });

    service.deleteResume(9).subscribe();
    expect(http.expectOne(`${workers}/9/resume`).request.method).toBe('DELETE');
  });

  it('reads a farmer and a worker profile', () => {
    service.getFarmer(1).subscribe();
    service.getWorker(2).subscribe();

    http.expectOne(`${farmers}/1`).flush({});
    http.expectOne(`${workers}/2`).flush({});
  });
});
