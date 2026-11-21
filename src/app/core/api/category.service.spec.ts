import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { CategoryService } from './category.service';

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

  it('reads the categories grouped in two levels', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const groups = [{ name: 'Água', services: ['Limpeza de represa, açude e cisterna'] }];

    TestBed.inject(CategoryService)
      .getGroups()
      .subscribe((list) => expect(list).toEqual(groups));

    http.expectOne(`${environment.apiUrl}/categories/groups`).flush(groups);
    http.verify();
  });
});
