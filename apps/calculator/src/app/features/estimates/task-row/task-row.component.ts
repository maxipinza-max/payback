import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { Task, TaskTotals, Phase, Estimate, computeTaskTotals } from '@kaufmann-lab-calculator/shared-types';

@Component({
  selector: 'app-task-row',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-row.component.html',
  styleUrl: './task-row.component.scss',
})
export class TaskRowComponent implements OnInit {
  @Input() task!: Task;
  @Input() phase!: Phase;
  @Input() estimate!: Estimate;
  @Output() taskChange = new EventEmitter<Partial<Omit<Task, 'id'>>>();
  @Output() removeTask = new EventEmitter<void>();

  form!: FormGroup;

  get totals(): TaskTotals {
    const merged = { ...this.task, ...this.form?.value };
    return computeTaskTotals(merged, this.phase, this.estimate);
  }

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl(this.task.name),
      hoursRequired: new FormControl(this.task.hoursRequired),
      numberOfPersons: new FormControl(this.task.numberOfPersons),
      hourlyRateOverride: new FormControl(this.task.hourlyRateOverride ?? null),
    });

    this.form.valueChanges.subscribe((v) => this.taskChange.emit(v));
  }
}
