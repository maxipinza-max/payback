import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstimateStore } from '../../../core/services/estimate.store';
import { PdfService } from '../../../core/services/pdf.service';
import { formatCurrency } from '@kaufmann-lab-calculator/shared-types';

@Component({
  selector: 'app-estimate-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estimate-summary.component.html',
  styleUrl: './estimate-summary.component.scss',
})
export class EstimateSummaryComponent {
  store = inject(EstimateStore);
  pdfService = inject(PdfService);
  isGeneratingPdf = false;
  pdfError = '';

  get estimate() { return this.store.estimate(); }
  get totals() { return this.store.totals(); }

  fmt(amount: number): string {
    return formatCurrency(amount, this.estimate.currency);
  }

  downloadPdf(): void {
    this.isGeneratingPdf = true;
    this.pdfError = '';
    try {
      this.pdfService.generate(this.estimate);
    } catch {
      this.pdfError = 'PDF generation failed. Please try again.';
    } finally {
      this.isGeneratingPdf = false;
    }
  }
}
