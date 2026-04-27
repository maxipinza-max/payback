import { Injectable, signal, computed } from '@angular/core';
import {
  Estimate,
  Phase,
  Task,
  EstimateTotals,
  computeEstimateTotals,
  generateId,
} from '@kaufmann-lab-calculator/shared-types';
import { StorageService } from './storage.service';

function blankEstimate(): Estimate {
  return {
    id: generateId(),
    name: 'New Project',
    description: '',
    client: '',
    globalHourlyRate: 50,
    currency: 'USD',
    includeIva: false,
    phases: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

@Injectable({ providedIn: 'root' })
export class EstimateStore {
  private _estimate = signal<Estimate>(blankEstimate());
  private _saved = signal<Estimate[]>([]);

  readonly estimate = this._estimate.asReadonly();
  readonly saved = this._saved.asReadonly();
  readonly totals = computed<EstimateTotals>(() => computeEstimateTotals(this._estimate()));

  constructor(private storage: StorageService) {
    this._saved.set(storage.list());
  }

  load(id: string): void {
    const e = this.storage.get(id);
    if (e) this._estimate.set(e);
  }

  new(): void {
    this._estimate.set(blankEstimate());
  }

  toggleIva(): void {
    this._estimate.update((e) => ({ ...e, includeIva: !e.includeIva }));
  }

  updateHeader(patch: Partial<Pick<Estimate, 'name' | 'description' | 'client' | 'globalHourlyRate' | 'currency' | 'includeIva'>>): void {
    this._estimate.update((e) => ({ ...e, ...patch }));
  }

  save(): void {
    this.storage.save(this._estimate());
    this._saved.set(this.storage.list());
  }

  delete(id: string): void {
    this.storage.delete(id);
    this._saved.set(this.storage.list());
  }

  // Phases
  addPhase(): void {
    const phase: Phase = { id: generateId(), name: 'New Phase', tasks: [] };
    this._estimate.update((e) => ({ ...e, phases: [...e.phases, phase] }));
  }

  updatePhase(phaseId: string, patch: Partial<Omit<Phase, 'id' | 'tasks'>>): void {
    this._estimate.update((e) => ({
      ...e,
      phases: e.phases.map((p) => (p.id === phaseId ? { ...p, ...patch } : p)),
    }));
  }

  removePhase(phaseId: string): void {
    this._estimate.update((e) => ({ ...e, phases: e.phases.filter((p) => p.id !== phaseId) }));
  }

  // Tasks
  addTask(phaseId: string): void {
    const task: Task = { id: generateId(), name: 'New Task', hoursRequired: 8, numberOfPersons: 1 };
    this._estimate.update((e) => ({
      ...e,
      phases: e.phases.map((p) =>
        p.id === phaseId ? { ...p, tasks: [...p.tasks, task] } : p
      ),
    }));
  }

  updateTask(phaseId: string, taskId: string, patch: Partial<Omit<Task, 'id'>>): void {
    this._estimate.update((e) => ({
      ...e,
      phases: e.phases.map((p) =>
        p.id === phaseId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) }
          : p
      ),
    }));
  }

  removeTask(phaseId: string, taskId: string): void {
    this._estimate.update((e) => ({
      ...e,
      phases: e.phases.map((p) =>
        p.id === phaseId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p
      ),
    }));
  }
}
