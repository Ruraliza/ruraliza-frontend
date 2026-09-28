import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { FarmerService } from './farmer.service';

describe('FarmerService', () => {
  const base = `${environment.apiUrl}/farmers`;
  let service: FarmerService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(FarmerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists the farmer services filtered by status', () => {
    service.getFarmerServices(7, 'In Progress').subscribe((list) => expect(list).toEqual([]));

    const req = http.expectOne((r) => r.url === `${base}/7/services`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('status')).toBe('In Progress');
    req.flush([]);
  });

  it('lists all farmer services when no status is given', () => {
    service.getFarmerServices(7).subscribe();

    const req = http.expectOne(`${base}/7/services`);
    expect(req.request.params.has('status')).toBe(false);
    req.flush([]);
  });

  it('creates a farmer', () => {
    const input = { name: 'Ana', email: 'ana@exemplo.com', phone: '24999990000', cpf: '52998224725' };
    service.createFarmer(input).subscribe((res) => expect(res.farmer.id).toBe(1));

    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ message: 'ok', farmer: { ...input, id: 1, farms: [], insertion_date: '2026-01-01' } });
  });

  it('updates and deletes a farmer', () => {
    service.updateFarmer(4, { name: 'Ana Maria' }).subscribe();
    const patch = http.expectOne(`${base}/4`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ name: 'Ana Maria' });
    patch.flush({ message: 'ok', farmer: {} });

    service.deleteFarmer(4).subscribe();
    const del = http.expectOne(`${base}/4`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'ok' });
  });

  it('sends application_id and action when analyzing an offer', () => {
    service.analyzeOffer(3, 11, 'Accept').subscribe();

    const req = http.expectOne(`${base}/services/3/analyze`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ application_id: 11, action: 'Accept' });
    req.flush({ message: 'ok', application: {} });
  });

  it('edits and cancels a service', () => {
    service.updateService(3, { price: 1200 }).subscribe();
    const patch = http.expectOne(`${base}/services/3`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ price: 1200 });
    patch.flush({ message: 'ok', service: {} });

    service.cancelService(3).subscribe((res) => expect(res.service.status).toBe('Cancelled'));
    const cancel = http.expectOne(`${base}/services/3/cancel`);
    expect(cancel.request.method).toBe('PATCH');
    cancel.flush({ message: 'ok', service: { status: 'Cancelled' } });
  });

  it('releases the payment of a service', () => {
    service.processPayment(3).subscribe((res) => expect(res.payment.value).toBe(900));

    const req = http.expectOne(`${base}/services/3/payment`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'ok', service: {}, payment: { value: 900 } });
  });

  it('reads the applications of a service', () => {
    service.getServiceApplications(3).subscribe((list) => expect(list.length).toBe(1));

    http.expectOne(`${base}/services/3/applications`).flush([{ id: 1 }]);
  });

  it('reads and creates farms', () => {
    service.getFarms(2).subscribe();
    http.expectOne(`${base}/2/farms`).flush([]);

    const farm = { address: 'Estrada, Km 2', city: 'Três Rios', state: 'RJ' };
    service.createFarm(2, farm).subscribe();
    const req = http.expectOne(`${base}/2/farms`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(farm);
    req.flush({ message: 'ok', farm: {} });
  });

  it('adds and removes farm photos', () => {
    const photo = new Blob(['x'], { type: 'image/jpeg' });
    service.addFarmPhoto(2, 8, photo).subscribe();
    const add = http.expectOne(`${base}/2/farms/8/photos`);
    expect(add.request.method).toBe('POST');
    expect(add.request.headers.get('Content-Type')).toBe('image/jpeg');
    add.flush({ message: 'ok', farm: {} });

    service.deleteFarmPhoto(2, 8, 'abc.webp').subscribe();
    expect(http.expectOne(`${base}/2/farms/8/photos/abc.webp`).request.method).toBe('DELETE');
  });

  it('deletes a service', () => {
    service.deleteService(3).subscribe();
    const req = http.expectOne(`${base}/services/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'ok' });
  });

  it('edits and deletes a farm', () => {
    service.updateFarm(2, 8, { city: 'Vassouras' }).subscribe();
    const patch = http.expectOne(`${base}/2/farms/8`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ city: 'Vassouras' });
    patch.flush({ message: 'ok', farm: {} });

    service.deleteFarm(2, 8).subscribe();
    const del = http.expectOne(`${base}/2/farms/8`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'ok' });
  });
});
