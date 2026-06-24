export interface TicketAttachment {
  attachmentId: number;
  ticketId: number;
  fileName: string;
  blobFileName: string;
  blobUrl: string;
  contentType: string;
  fileSize: number;
  uploadedByUserId: number;
  uploadedDate: string | Date; // Can be read as a string ISO timestamp or Date object
  isDeleted: boolean;
  ticket: any; // Maps to your navigation property (change 'any' to your Ticket interface if you have one)
}
export interface TicketAttachmentResponseDto {
  attachmentId: number;
  ticketId: number;
  blobFileName: string | null; // Aligned with nullable string? BlobFileName
  blobUrl: string | null;      // Aligned with nullable string? BlobUrl
  contentType: string | null;  // Aligned with nullable string? ContentType
  fileSize: number;            // Aligned with long FileSize
  uploadedDate: string;        // DateTime resolves as an ISO string serialization profile
  isDeleted: boolean;          // Default initialized flag mapping
}
export interface ReplaceAttachmentDto {
  attachmentId: number;
  file: File;
}