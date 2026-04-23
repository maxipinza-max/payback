import { Task, TaskTotals } from '../models/task.model';
import { Phase, PhaseTotals } from '../models/phase.model';
import { Estimate, EstimateTotals } from '../models/estimate.model';

export function resolveRate(task: Task, phase: Phase, estimate: Estimate): number {
  return task.hourlyRateOverride ?? phase.hourlyRateOverride ?? estimate.globalHourlyRate;
}

export function computeTaskTotals(task: Task, phase: Phase, estimate: Estimate): TaskTotals {
  const effectiveHourlyRate = resolveRate(task, phase, estimate);
  const totalHours = task.hoursRequired * task.numberOfPersons;
  return {
    totalHours,
    totalCost: totalHours * effectiveHourlyRate,
    effectiveHourlyRate,
  };
}

export function computePhaseTotals(phase: Phase, estimate: Estimate): PhaseTotals {
  return phase.tasks.reduce(
    (acc: PhaseTotals, task: Task) => {
      const t = computeTaskTotals(task, phase, estimate);
      return {
        totalHours: acc.totalHours + t.totalHours,
        totalCost: acc.totalCost + t.totalCost,
      };
    },
    { totalHours: 0, totalCost: 0 }
  );
}

export function computeEstimateTotals(estimate: Estimate): EstimateTotals {
  const byPhase = estimate.phases.map((phase: Phase) => {
    const totals = computePhaseTotals(phase, estimate);
    return { phaseId: phase.id, phaseName: phase.name, ...totals };
  });

  return {
    grandTotalHours: byPhase.reduce((s: number, p: PhaseTotals) => s + p.totalHours, 0),
    grandTotalCost: byPhase.reduce((s: number, p: PhaseTotals) => s + p.totalCost, 0),
    byPhase,
  };
}

export function formatCurrency(amount: number, currency: 'USD' | 'CLP'): string {
  const decimals = currency === 'CLP' ? 0 : 2;
  return new Intl.NumberFormat(currency === 'CLP' ? 'es-CL' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
