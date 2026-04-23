import { Injectable } from '@angular/core';
import { Estimate } from '@kaufmann-lab-calculator/shared-types';

const STORAGE_KEY = 'kl_estimates';

@Injectable({ providedIn: 'root' })
export class StorageService {
  list(): Estimate[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  get(id: string): Estimate | null {
    return this.list().find((e) => e.id === id) ?? null;
  }

  save(estimate: Estimate): void {
    const all = this.list().filter((e) => e.id !== estimate.id);
    all.unshift({ ...estimate, updatedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  delete(id: string): void {
    const all = this.list().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  exportJson(estimate: Estimate): void {
    const blob = new Blob([JSON.stringify(estimate, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${estimate.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
