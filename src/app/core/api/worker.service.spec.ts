import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { CategoryService } from './category.service';
import { WorkerService } from './worker.service';

describe('WorkerService', () => {
  const base = `${environment.apiUrl}/workers`;
  let service: WorkerService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(WorkerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('searches open services by category', () => {
    service.searchServices('Colheita').subscribe();

    const req = http.expectOne((r) => r.url === `${base}/services`);
    expect(req.request.params.get('category')).toBe('Colheita');
    req.flush([]);
  });

  it('searches all open services without a category', () => {
    service.searchServices().subscribe();

    const req = http.expectOne(`${base}/services`);
    expect(req.request.params.has('category')).toBe(false);
    req.flush([]);
  });

  it('applies for a service with the worker id', () => {
    service.applyForService(5, 9).subscribe((res) => expect(res.application.status).toBe('Pending'));

    const req = http.expectOne(`${base}/services/5/apply`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ worker_id: 9 });
    req.flush({ message: 'ok', application: { id: 1, service_id: 5, worker_id: 9, status: 'Pending' } });
  });

  it('reads the worker applications and services', () => {
    service.getWorkerApplications(9).subscribe();
    http.expectOne(`${base}/9/applications`).flush([]);

    service.getWorkerServices(9).subscribe();
    http.expectOne(`${base}/9/services`).flush([]);
  });

  it('updates and deletes a worker', () => {
    service.updateWorker(9, { experience: '6 anos' }).subscribe();
    const patch = http.expectOne(`${base}/9`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ experience: '6 anos' });
    patch.flush({ message: 'ok', worker: {} });

    service.deleteWorker(9).subscribe();
    const del = http.expectOne(`${base}/9`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'ok' });
  });

  it('reads one open service', () => {
    service.getOpenService(5).subscribe((job) => expect(job.farm.city).toBe('Três Rios'));
    http.expectOne(`${base}/services/5`).flush({ id: 5, farm: { city: 'Três Rios', state: 'RJ' } });
  });
});

describe('CategoryService', () => {
  it('reads the fixed category list', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);

    TestBed.inject(CategoryService)
      .getCategories()
      .subscribe((list) => expect(list).toEqual(['Colheita', 'Plantio']));

    http.expectOne(`${environment.apiUrl}/categories`).flush(['Colheita', 'Plantio']);
    http.verify();
  });
});
