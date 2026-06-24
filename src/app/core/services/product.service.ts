import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PagedResponse } from '../models/generic-response.model';
import { CreateProductDto, ProductFilterDto, UpdateProductDto } from '../models/product.model';


@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = `${environment.apiUrl}/api/Product`;

  constructor(private http: HttpClient) {}

  // 🔷 GET LIST: Uses PagedResponse directly
 
  getProducts(filter: any): Observable<PagedResponse<any>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber?.toString() || '1')
      .set('pageSize', filter.pageSize?.toString() || '10');

    // 🔷 FIX: Check for 'search' OR 'name' to match your component logic
    const searchTerm = filter.search || filter.name
    if (searchTerm) {
      params = params.set('name', searchTerm);
    }
    
    if (filter.isActive !== undefined && filter.isActive !== null) {
      params = params.set('isActive', filter.isActive.toString());
    }

    return this.http.get<PagedResponse<any>>(`${this.apiUrl}/list`, { params });
  }

  // 🔷 CREATE
  create(dto: CreateProductDto): Observable<any> {
    return this.http.post(this.apiUrl, dto);
  }

  // 🔷 UPDATE
  update(dto: UpdateProductDto): Observable<any> {
    return this.http.put(this.apiUrl, dto);
  }

 
    // 🔷 ACTIVATE
  activateProduct(id: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/activate/${id}`, {}, { responseType: 'text' });
  }

  // 🔷 DEACTIVATE
  deactivateProduct(id: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/deactivate/${id}`, {}, { responseType: 'text' });
  }

}
