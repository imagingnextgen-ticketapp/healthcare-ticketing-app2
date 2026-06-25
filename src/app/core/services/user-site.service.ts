import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserSiteViewDto } from '../models/user.model';
import { PagedResponse } from '../models/generic-response.model';


@Injectable({
  providedIn: 'root'
})
export class UserSiteService {
  private apiUrl = `${environment.apiUrl}/api/UserSite`;

  constructor(private http: HttpClient) {}

  /**
   * Updated to use UserSiteViewDto
   * Matches your C# method: Task<List<UserSiteViewDto>> GetUsersBySiteAsync
   */
  getUsersBySite(siteId: number, pageNumber: number, pageSize: number): Observable<PagedResponse<UserSiteViewDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<PagedResponse<UserSiteViewDto>>(`${this.apiUrl}/site/${siteId}`, { params });
  }

  // Assign, Activate, and Deactivate methods remain the same 
  // as they already use generic 'any' or string responses
  assignUsers(dto: any): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/assign`, dto);
}

  activate(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/activate`, dto);
  }

  deactivate(dto: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/deactivate`, dto);
  }
}
