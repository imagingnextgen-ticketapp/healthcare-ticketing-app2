import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardDto, MisFilterDto, MisReportDto } from '../models/mis-report.model';
import { PagedResponse } from '../models/generic-response.model';

@Injectable({
  providedIn: 'root'
})
export class MisServiceReport {
  private apiUrl = `${environment.apiUrl}/api/MisReport`;

  constructor(private http: HttpClient) {}

  /**
   * ✅ GET: Dashboard Summary Cards
   */
  getDashboard(): Observable<DashboardDto> {
    return this.http.get<DashboardDto>(`${this.apiUrl}/dashboard`);
  }

  /**
   * ✅ GET: Consolidated Tabular Data (UI Grid)
   */
  getConsolidatedReport(filter: MisFilterDto): Observable<PagedResponse<MisReportDto>> {
    return this.http.get<PagedResponse<MisReportDto>>(`${this.apiUrl}/consolidated`, { 
      params: this.toParams(filter) 
    });
  }

  /**
   * ✅ GET: Consolidated Excel Export (Tabular Download)
   */
  exportConsolidated(filter: MisFilterDto): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/consolidated`, { 
      params: this.toParams(filter), 
      responseType: 'blob' 
    });
  }

  /**
   * 🛡️ INTERNAL HELPER: Converts Filter DTO to HttpParams
   */
  private toParams(f: MisFilterDto): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', f.pageNumber.toString())
      .set('pageSize', f.pageSize.toString());

    // Format date helper for .NET compatibility (YYYY-MM-DD)
    const formatDate = (date: any) => {
      if (!date) return null;
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    // 1. Date Range Filters
    if (f.fromDate) params = params.set('fromDate', formatDate(f.fromDate)!);
    if (f.toDate) params = params.set('toDate', formatDate(f.toDate)!);
    
    // 2. Hospital Filter
    if (f.masterSiteId) params = params.set('masterSiteId', f.masterSiteId.toString());
    
    // 3. Product Filter 🟢 (Newly Added for Cascading Logic)
    if (f.productId) params = params.set('productId', f.productId.toString());
    
    // 4. Issue Type (Template) Filter
    if (f.templateId) params = params.set('templateId', f.templateId.toString());
    if (f.issueType) params = params.set('issueType', f.issueType);
    
    // 5. TAT Logic (gt, lt, eq)
    if (f.tatHours !== undefined && f.tatHours !== null) {
        params = params.set('tatHours', f.tatHours.toString());
    }
    if (f.tatOperator) {
        params = params.set('tatOperator', f.tatOperator);
    }

    return params;
  }
}
