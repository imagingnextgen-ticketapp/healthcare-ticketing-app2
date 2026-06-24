import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProductSiteViewDto } from '../models/siteproduct.model';

@Injectable({
  providedIn: 'root'
})
export class SiteProductService {
  // Update this to match your [Route] attribute on the C# Controller
  private apiUrl = `${environment.apiUrl}/api/SiteProduct`;
  constructor(private http: HttpClient) {}

  // POST: activate
  activateProduct(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/activate`, dto);
  }

  // POST: deactivate
  deactivateProduct(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/deactivate`, dto);
  }

  // GET: {id}/products
  getProductsViewDetails(siteId: number): Observable<ProductSiteViewDto[]> {
    return this.http.get<ProductSiteViewDto[]>(`${this.apiUrl}/${siteId}/products`);
  }


  // POST: assign
  assignProducts(dto: any): Observable<string> {
    // responseType: 'text' because your C# returns a plain string "Products assigned successfully"
    return this.http.post(`${this.apiUrl}/assign`, dto, { responseType: 'text' });
  }
}
