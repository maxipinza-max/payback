import { Task } from './task.model';

export interface Phase {
  id: string;
  name: string;
  hourlyRateOverride?: number;
  tasks: Task[];
}

export interface PhaseTotals {
  totalHours: number;
  totalCost: number;
}
