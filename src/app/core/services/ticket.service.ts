import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

import { Ticket, TicketResponseDto, UpdateTicketDto } from '../models/ticket.model';
import { TicketHistoryDto, TicketHistoryFilterDto } from '../models/tickethistory.model';
import { PagedResponse } from '../models/generic-response.model';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = `${environment.apiUrl}/api/Ticket`;

  constructor(private http: HttpClient) {}

  // ✅ CREATE: [HttpPost]
  // 🟢 Fixed: Flattens payload data structures and enforces strict JSON content type headers
    // ✅ CREATE: [HttpPost]
  createTicket(dto: any): Observable<{ ticketId: number }> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    // 🛡️ REMOVED THE NESTING LAYER: Transmit the clean raw payload directly at the root
    return this.http.post<{ ticketId: number }>(this.apiUrl, dto, httpOptions);
  }


  // ✅ ASSIGN: [HttpPut("assign")]
  assignTicket(ticketId: number, userId: number): Observable<string> {
    const dto = { ticketId, assignedToUserId: userId };
    return this.http.put<string>(`${this.apiUrl}/assign`, dto);
  }

  // ✅ STATUS UPDATE: [HttpPut("status")]
  updateStatus(dto: { ticketId: number, status: number, comment: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/status`, {
      ticketId: dto.ticketId,
      status: dto.status,
      comment: dto.comment 
    });
  }

  // ✅ REOPEN: [HttpPut("reopen")] 
  reopenTicket(ticketId: number, comment: string): Observable<any> {
    const dto = {
      ticketId: ticketId,
      comment: comment 
    };
    return this.http.put<any>(`${this.apiUrl}/reopen`, dto);
  }

  // ✅ WORKLIST: [HttpGet("worklist")]
  getWorklist(filter: any): Observable<PagedResponse<TicketResponseDto>> {
    let params = new HttpParams()
      .set('pageNumber', filter.pageNumber?.toString() || '1')
      .set('pageSize', filter.pageSize?.toString() || '25');

    if (filter.ticketId) params = params.set('ticketId', filter.ticketId.toString());
    if (filter.status != null) params = params.set('status', filter.status.toString());
    if (filter.assignedToUserId) params = params.set('assignedToUserId', filter.assignedToUserId.toString());
    
    // 1. Format Created Date
    if (filter.createdDate) {
      const cDate = new Date(filter.createdDate);
      const cStr = cDate.getFullYear() + '-' + ('0' + (cDate.getMonth() + 1)).slice(-2) + '-' + ('0' + cDate.getDate()).slice(-2);
      params = params.set('createdDate', cStr);
    }

    // 2. Add and Format Resolve Date
    if (filter.resolveDate) {
      const rDate = new Date(filter.resolveDate);
      const rStr = rDate.getFullYear() + '-' + ('0' + (rDate.getMonth() + 1)).slice(-2) + '-' + ('0' + rDate.getDate()).slice(-2);
      params = params.set('resolveDate', rStr); 
    }

    return this.http.get<PagedResponse<TicketResponseDto>>(`${this.apiUrl}/worklist`, { params });
  }

  // ✅ GET BY ID: Useful for Reopen/Details view
  getTicketById(id: number): Observable<TicketResponseDto> {
    return this.http.get<TicketResponseDto>(`${this.apiUrl}/${id}`);
  }

  // ✅ HISTORY: [HttpGet("history")]
  getTicketHistory(f: any): Observable<any> {
  // Helper to format the local date picker value into YYYY-MM-DD
  const formatLocalDate = (date: any) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  let params = new HttpParams()
    .set('pageNumber', f.pageNumber.toString())
    .set('pageSize', f.pageSize.toString());

  if (f.ticketId) params = params.set('ticketId', f.ticketId.toString());
  if (f.actionByUserId) params = params.set('actionByUserId', f.actionByUserId.toString());

  // 1. Force From Date to catch the very beginning of the day (Local Time)
  if (f.fromDate) {
    const localFromStr = formatLocalDate(f.fromDate);
    params = params.set('fromDate', `${localFromStr}T00:00:00`);
  }

  // 2. Force To Date to catch the very end of the day (Local Time)
  if (f.toDate) {
    const localToStr = formatLocalDate(f.toDate);
    params = params.set('toDate', `${localToStr}T23:59:59`);
  }

  return this.http.get<any>(`${this.apiUrl}/history`, { params });
}


  // ✅ ESCALATE: [HttpPost("escalate")]
  escalateTickets(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/escalate`, {});
  }
   updateTicket(dto: UpdateTicketDto): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    return this.http.put<any>(`${this.apiUrl}/update`, dto, httpOptions);
  }
}
