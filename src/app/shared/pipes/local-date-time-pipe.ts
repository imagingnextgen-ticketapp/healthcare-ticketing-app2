import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'localDateTime',
  pure: true // Optimizes performance for heavy data tables
})
export class LocalDateTimePipe implements PipeTransform {
  
  // Internal helper to reuse Angular's core date formatter
  private datePipe = new DatePipe('en-US');

  // BEFORE: transform(value: any, format: string = 'dd-MMM-yy HH:mm')
// AFTER:
transform(value: any, format: string = 'dd-MMM-yy hh:mm a'): string | null {

    if (!value) return '';

    let dateInput = value;

    // .NET datetime2 fix: Ensure raw strings are parsed as UTC
    if (typeof value === 'string' && !value.endsWith('Z') && !value.includes('+')) {
      dateInput = `${value}Z`;
    }

    try {
      // Automatically uses the local browser timezone (IST)
      return this.datePipe.transform(dateInput, format);
    } catch (error) {
      console.error('LocalDateTimePipe processing error:', error);
      return value; // Fallback to raw value safely if parsing crashes
    }
  }
}
