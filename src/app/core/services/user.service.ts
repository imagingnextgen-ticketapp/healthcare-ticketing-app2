import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PagedResponse } from '../models/generic-response.model';
import { UserFilter, UserResponseDto, UserSiteDetailDto } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/User`;

  constructor(private http: HttpClient) {}

  /**
   * GET /api/User/list
   * Correctly maps pagination indices and filters to match C# backend parameters
   */
  getUsers(filter: UserFilter): Observable<PagedResponse<UserResponseDto>> {
    let params = new HttpParams();

    // 🔍 1. Pagination Parameters (⚡ FIXED: Added to prevent data truncation issues)
    if (filter.pageNumber) {
      params = params.set('pageNumber', filter.pageNumber.toString());
    }
    if (filter.pageSize) {
      params = params.set('pageSize', filter.pageSize.toString());
    }

    // 🔍 2. User Text Search Filter
    if (filter.search) {
      params = params.set('search', filter.search.trim());
    }
    
    // 🔍 3. Active Status Check
    if (filter.isActive !== undefined && filter.isActive !== null) {
      params = params.set('isActive', filter.isActive.toString());
    }


    // 🔍 4. Role Assignment Filter
    if (filter.roleName) {
      params = params.set('roleName', filter.roleName);
    }
if (filter.allowedRoleNames && filter.allowedRoleNames.length > 0) {
      filter.allowedRoleNames.forEach(role => {
        // Appends each role to the array query parameter string profile
        params = params.append('allowedRoleNames', role);
      });
    }
    // 🔍 5. Hospital Site Dropdown Parameter (⚡ FIXED: Aligned names with backend DTO mapping rules)
    if (filter.masterSiteId) {
      params = params.set('masterSiteId', filter.masterSiteId.toString());
    }
    
   
    return this.http.get<PagedResponse<UserResponseDto>>(`${this.apiUrl}/list`, { params });
  }

  /**
   * GET /api/User/{id}
   */
  getUserById(id: number): Observable<UserResponseDto> {
    return this.http.get<UserResponseDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /api/User
   */
  createUser(dto: any): Observable<any> {
    return this.http.post(this.apiUrl, dto);
  }

  /**
   * PUT /api/User
   */
  updateUser(dto: any): Observable<any> {
    return this.http.put(this.apiUrl, dto);
  }

  /**
   * DELETE /api/User/{id}
   */
  deleteUser(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }

  /**
   * GET /api/User/roles
   */
  getRoles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/roles`);
  }

  /**
   * GET /api/User/by-role?roleName=...
   */
  getUsersByRole(roleName: string): Observable<UserResponseDto[]> {
    return this.http.get<UserResponseDto[]>(`${this.apiUrl}/by-role`, {
      params: new HttpParams().set('roleName', roleName)
    });
  }

  /**
   * GET /api/User/engineers
   */
  getEngineers(search?: string): Observable<UserResponseDto[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<UserResponseDto[]>(`${this.apiUrl}/engineers`, { params });
  }

  /**
   * POST /api/User/admin-reset-password
   */
  adminResetPassword(userId: number, newPassword: string): Observable<any> {
    const dto = {
      userId: userId,
      newPassword: newPassword
    };
    return this.http.post(`${this.apiUrl}/admin-reset-password`, dto);
  }

  /**
   * GET /api/User/{userId}/sites
   */
  getUserSites(userId: number): Observable<UserSiteDetailDto[]> {
    return this.http.get<UserSiteDetailDto[]>(`${this.apiUrl}/${userId}/sites`);
  }

  /**
   * PUT /api/User/activate/{id}
   */
  activateUser(id: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/activate/${id}`, {}, { responseType: 'text' });
  }

  /**
   * PUT /api/User/deactivate/{id}
   */
  deactivateUser(id: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/deactivate/${id}`, {}, { responseType: 'text' });
  }
}
