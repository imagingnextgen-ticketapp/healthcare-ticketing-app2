import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
 

@Injectable({
  providedIn: 'root'
})
export class MasterSiteService {
  private apiUrl = `${environment.apiUrl}/api/MasterSite`;

  constructor(private http: HttpClient) { }

  // 🔷 GET ALL (Pagination + Search)
 getSites(filter: any): Observable<any> {
  let params = new HttpParams();
  if (filter) {
    Object.keys(filter).forEach(key => {
      // ✅ Must reassign 'params'
      if (filter[key]) {
        params = params.set(key, filter[key].toString());
      }
    });
  }
  return this.http.get<any>(this.apiUrl, { params });
}


  // 🔷 GET BY ID
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // 🔷 CREATE
  create(dto: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  // 🔷 UPDATE
  update(dto: any): Observable<any> {
    return this.http.put<any>(this.apiUrl, dto);
  }



  // 🔥 ACTIVATE SITE
  activate(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/activate/${id}`, {});
  }

  // 🔥 DEACTIVATE SITE
  deactivate(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/deactivate/${id}`, {});
  }

  // 🔷 VIEW DETAILS
  getSiteViewDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/view/${id}`);
  }


  
}
