export interface Task {
  id: string;
  name: string;
  hoursRequired: number;
  numberOfPersons: number;
  hourlyRateOverride?: number;
}

export interface TaskTotals {
  totalHours: number;
  totalCost: number;
  effectiveHourlyRate: number;
}
