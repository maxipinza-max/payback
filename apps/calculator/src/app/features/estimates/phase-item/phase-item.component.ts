import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Phase, Estimate, computePhaseTotals, formatCurrency } from '@kaufmann-lab-calculator/shared-types';
import { EstimateStore } from '../../../core/services/estimate.store';
import { TaskRowComponent } from '../task-row/task-row.component';

@Component({
  selector: 'app-phase-item',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TaskRowComponent],
  templateUrl: './phase-item.component.html',
  styleUrl: './phase-item.component.scss',
})
export class PhaseItemComponent {
  @Input() phase!: Phase;
  @Input() estimate!: Estimate;

  store = inject(EstimateStore);
  collapsed = false;

  nameControl = new FormControl('');

  ngOnInit(): void {
    this.nameControl.setValue(this.phase.name, { emitEvent: false });
    this.nameControl.valueChanges.subscribe((v) => {
      if (v !== null) this.store.updatePhase(this.phase.id, { name: v });
    });
  }

  get totals() {
    return computePhaseTotals(this.phase, this.estimate);
  }

  get formattedTotal(): string {
    return formatCurrency(this.totals.totalCost, this.estimate.currency);
  }

  addTask(): void {
    this.store.addTask(this.phase.id);
  }

  removePhase(): void {
    this.store.removePhase(this.phase.id);
  }

  updateTask(taskId: string, patch: any): void {
    this.store.updateTask(this.phase.id, taskId, patch);
  }

  removeTask(taskId: string): void {
    this.store.removeTask(this.phase.id, taskId);
  }
}
