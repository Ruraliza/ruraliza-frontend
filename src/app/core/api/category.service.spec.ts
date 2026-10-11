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
});
