import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ForgotPasswordDto, ResetPasswordDto } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/Auth`;

  private currentUserSubject = new BehaviorSubject<any>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  // 🔐 LOGIN: Captures MasterSiteId for the Ticket Form
  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => { 
        if (res?.token) {
          this.setSession(res); 
        }
      }),
      catchError((err) => this.handleError(err))
    );
  }

  // 🟢 FIXED: Explicitly scoped arrow function stops 'this' execution leaks
  forgotPassword(dto: ForgotPasswordDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, dto).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  // 🟢 FIXED: Explicitly scoped arrow function stops 'this' execution leaks
  resetPassword(dto: ResetPasswordDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, dto).pipe(
      catchError((err) => this.handleError(err))
    );
  }

  getUser(): any {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    return !!token && token !== 'undefined';
  }

private setSession(res: any): void {
  localStorage.setItem('token', res.token);

  const user = {
    token: res.token,
    userId: res.userId,
    userName: res.userName,

    firstName: res.firstName,
    lastName: res.lastName,

    role: res.role,
    sites: res.sites || [],
    masterSiteId: res.masterSiteId,
    masterSiteName: res.masterSiteName
  };

  localStorage.setItem('currentUser', JSON.stringify(user));
  this.currentUserSubject.next(user);
}

  private getStoredUser(): any {
    const user = localStorage.getItem('currentUser');
    if (!user || user === 'undefined') return null;
    try {
      return JSON.parse(user);
    } catch (e) {
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // 🟢 FIXED: Bulletproof error message extraction from raw network errors
  private handleError(error: HttpErrorResponse) {
    let msg = 'Server Connection Error';

    if (error.error) {
      if (typeof error.error === 'string') {
        msg = error.error;
      } else if (error.error.message) {
        msg = error.error.message;
      }
    } else if (error.status !== 0) {
      msg = `Server Error (${error.status}): ${error.statusText}`;
    } else {
      msg = 'Cannot establish network handshake with the API. Check your internet connection or CORS settings.';
    }

    return throwError(() => new Error(msg));
  }
}
