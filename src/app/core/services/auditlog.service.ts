import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
// 🟢 Update imports to include your new Response DTO model layout
import { AuditLogResponseDto, AuditLogFilter } from '../models/auditlog.model';
import { PagedResponse } from '../models/generic-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuditlogService {
  private readonly apiUrl = `${environment.apiUrl}/api/AuditLog`;

  constructor(private http: HttpClient) {}

  /**
   * Applies all filters (Module, Action, User, Dates) via POST body
   */
  // 🟢 CHANGED: Return type is now Observable<PagedResponse<AuditLogResponseDto>>
  searchAuditLogs(filter: any): Observable<PagedResponse<AuditLogResponseDto>> {
    // Safe helper to clean out invalid dates
    const sanitizeDate = (dateString: any) => {
      if (!dateString || dateString === '') return null;
      const parsed = new Date(dateString);
      return !isNaN(parsed.getTime()) ? parsed.toISOString() : null;
    };

    // Cleans the filter payload properties before making the HTTP call
    const cleanedFilter = { ...filter };

    // Loop through all filter keys to eliminate accidental "undefined" text strings
    Object.keys(cleanedFilter).forEach(key => {
      if (cleanedFilter[key] === 'undefined' || cleanedFilter[key] === undefined) {
        cleanedFilter[key] = null;
      }
    });

    const payload = {
      ...cleanedFilter,
      fromDate: sanitizeDate(cleanedFilter.fromDate),
      toDate: sanitizeDate(cleanedFilter.toDate)
    };

    // 🟢 CHANGED: Cast the post generic parameter type to expect AuditLogResponseDto
    return this.http.post<PagedResponse<AuditLogResponseDto>>(`${this.apiUrl}/search`, payload);
  }
}
