// src/app/core/models/generic-response.model.ts

export interface PagedResponse<T> {
  data: T[];         // This T will be UserResponseDto, TemplateResponseDto, etc.
  pageNumber: number;
  pageSize: number;
  totalRecords: number;
}
