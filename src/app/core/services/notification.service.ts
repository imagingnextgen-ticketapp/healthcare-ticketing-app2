import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  // 1. Updated to match C# [Route("api/Notifications")]
  private apiUrl = `${environment.apiUrl}/api/Notifications`;

  constructor(private http: HttpClient) {}

  // 2. Fetches the list for the current user
  getMyNotifications(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // 3. Aligned with [HttpPut("mark-read/{id}")]
  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/mark-read/${id}`, {});
  }

  // 4. Aligned with [HttpPut("mark-all-read")]
  markAllRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/mark-all-read`, {});
  }
}
