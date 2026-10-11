import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { TracksService } from './tracks.service';

describe('TracksService', () => {
  const base = `${environment.apiUrl}/admin/tracks`;
  let service: TracksService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(TracksService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista as trilhas e os tutores', () => {
    service.list().subscribe();
    http.expectOne(base).flush([]);
    service.tutors().subscribe();
    http.expectOne(`${base}/tutors`).flush([]);
  });

  it('cria, lê e edita os dados gerais', () => {
    const input = { title: 'Café', description: 'Curso', categories: ['Colheita'], tutor_ids: [3] }; // tutor_ids: criação pelo administrador
    service.create(input).subscribe();
    const post = http.expectOne(base);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(input);
    post.flush({ message: 'ok', track: {} });

    service.get(4).subscribe();
    http.expectOne(`${base}/4`).flush({});

    service.update(4, { tutor_ids: [1, 2] }).subscribe();
    const patch = http.expectOne(`${base}/4`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ tutor_ids: [1, 2] });
    patch.flush({ message: 'ok', track: {} });
  });

  it('salva o conteúdo com PUT e muda o status', () => {
    const content = { modules: [{ id: 1, title: 'M', lessons: [{ title: 'A', content: 'x', duration_minutes: 5 }] }] };
    service.saveContent(4, content).subscribe();
    const put = http.expectOne(`${base}/4/content`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual(content);
    put.flush({ message: 'ok', track: {} });

    service.setStatus(4, 'discontinued').subscribe();
    const status = http.expectOne(`${base}/4/status`);
    expect(status.request.body).toEqual({ status: 'discontinued' });
    status.flush({ message: 'ok', track: {} });
  });
});
