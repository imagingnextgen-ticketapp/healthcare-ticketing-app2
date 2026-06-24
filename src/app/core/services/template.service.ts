import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Models
import { PagedResponse } from '../models/generic-response.model';
import { 
  TemplateResponseDto, 
  CreateTemplateDto, 
  UpdateTemplateDto, 
  TemplateFilter, 
  TemplateViewDto
} from '../models/template.model';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {

  private apiUrl = `${environment.apiUrl}/api/Template`;

  constructor(private http: HttpClient) {}

  /**
   * ✅ GET: Unified List (Pagination + Search + Product Filter)
   * Aligned with: [HttpGet("list")]
   */
  getTemplates(filter: TemplateFilter): Observable<PagedResponse<TemplateResponseDto>> {
    let params = new HttpParams();
    
    if (filter.productId) params = params.set('productId', filter.productId.toString());
    if (filter.search) params = params.set('search', filter.search);
    if (filter.pageNumber) params = params.set('pageNumber', filter.pageNumber.toString());
    if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());

    return this.http.get<PagedResponse<TemplateResponseDto>>(`${this.apiUrl}/list`, { params });
  }

  /**
   * ✅ GET: By ID (For Edit Mode)
   * Aligned with: [HttpGet("{id}")]
   */
  getById(id: number): Observable<TemplateResponseDto> {
    return this.http.get<TemplateResponseDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * ✅ POST: Create New Template
   * Aligned with: [HttpPost("create")]
   */
  create(dto: CreateTemplateDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, dto);
  }

  /**
   * ✅ PUT: Update Existing Template
   * Aligned with: [HttpPut] (Base Route)
   */
  update(dto: UpdateTemplateDto): Observable<any> {
    // Note: Since [HttpPut] is on the base route, we don't append ID to URL
    return this.http.put(this.apiUrl, dto);
  }

  /**
   * ✅ DELETE: Soft Delete Template
   * Aligned with: [HttpDelete("{id}")]
   */
  
  /**
 * ✅ GET: View DTOs by Product ID (For Auto-populating Tickets)
 * Aligned with: [HttpGet("view-by-product/{productId}")]
 */
getTemplateViewByProduct(productId: number): Observable<TemplateViewDto[]> {
  return this.http.get<TemplateViewDto[]>(`${this.apiUrl}/view-by-product/${productId}`);
}
activateTemplate(id: number): Observable<any> {
  return this.http.put(`${this.apiUrl}/activate/${id}`, {});
}

deactivateTemplate(id: number): Observable<any> {
  return this.http.put(`${this.apiUrl}/deactivate/${id}`, {});
}


}
