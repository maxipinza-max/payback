import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EstimateStore } from '../../../core/services/estimate.store';
import { Estimate, EstimateTotals, computeEstimateTotals, formatCurrency } from '@kaufmann-lab-calculator/shared-types';

@Component({
  selector: 'app-estimate-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estimate-list.component.html',
  styleUrl: './estimate-list.component.scss',
})
export class EstimateListComponent {
  store = inject(EstimateStore);
  router = inject(Router);

  newEstimate(): void {
    this.store.new();
    this.router.navigate(['/estimates/new']);
  }

  openEstimate(id: string): void {
    this.store.load(id);
    this.router.navigate(['/estimates', id]);
  }

  deleteEstimate(event: Event, id: string): void {
    event.stopPropagation();
    this.store.delete(id);
  }

  getTotals(est: Estimate): EstimateTotals {
    return computeEstimateTotals(est);
  }

  fmt(amount: number, currency: 'USD' | 'CLP'): string {
    return formatCurrency(amount, currency);
  }

  totalTasks(est: Estimate): number {
    return est.phases.reduce((s, p) => s + p.tasks.length, 0);
  }
}
