import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ReplaceAttachmentDto } from '../models/ticket-attachment.model';

@Injectable({
  providedIn: 'root'
})
export class TicketAttachmentService {

  private apiUrl = `${environment.apiUrl}/api/TicketAttachment`;

  constructor(private http: HttpClient) {}

  // ==========================================
  // 🟢 BATCH MULTIPLE FILE UPLOAD METHOD
  // ==========================================
  uploadMultiple(ticketId: number, files: File[]): Observable<any> {
    const formData = new FormData();
    
    // Aligned with backend parameter name: [FromForm] int ticketId
    formData.append('ticketId', ticketId.toString());

    // Aligned with backend parameter name: [FromForm] List<IFormFile> files
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    return this.http.post<any>(`${this.apiUrl}/upload-multiple`, formData);
  }

  // ==========================================
  // 🟢 NEW: GET ALL ATTACHMENTS BY TICKET ID
  // Maps to backend: [HttpGet("ticket/{ticketId}")]
  // ==========================================
  getAttachmentsByTicket(ticketId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ticket/${ticketId}`);
  }

  // ==========================================
  // 🟢 VIEW FILE METADATA METHOD
  // ==========================================
  getMetadata(attachmentId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GetMetadata/${attachmentId}`);
  }

  // ==========================================
  // 🟢 DOWNLOAD FILE BINARY STREAM METHOD
  // Maps to backend: [HttpGet("download/{id}")]
  // ==========================================
  downloadAttachment(id: number): Observable<Blob> {
    // 🟢 ALIGNED: Parameter renamed to 'id' to match C# Download(int id) method template precisely
    // 🟢 ALIGNED: Method renamed to 'downloadAttachment' to match your worklist component calls perfectly
    return this.http.get(`${this.apiUrl}/download/${id}`, {
      responseType: 'blob'
    });

  }
  replaceAttachment(dto: ReplaceAttachmentDto): Observable<any> {
    const formData = new FormData();
    // Case-matched with backend C# ReplaceAttachmentDto PascalCase naming specifications
    formData.append('AttachmentId', dto.attachmentId.toString());
    formData.append('File', dto.file, dto.file.name);

    return this.http.post<any>(`${this.apiUrl}/replace`, formData);
  }
}
