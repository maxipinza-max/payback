import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Estimate } from '@kaufmann-lab-calculator/shared-types';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PdfService {
  constructor(private http: HttpClient) {}

  generate(estimate: Estimate): Observable<Blob> {
    return this.http.post(`${environment.apiUrl}/pdf/generate`, estimate, {
      responseType: 'blob',
    });
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
