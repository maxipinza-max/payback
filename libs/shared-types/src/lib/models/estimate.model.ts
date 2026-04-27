import { Phase } from './phase.model';
import { PhaseTotals } from './phase.model';

export type SupportedCurrency = 'USD' | 'CLP';

export interface Estimate {
  id: string;
  name: string;
  description?: string;
  client?: string;
  globalHourlyRate: number;
  currency: SupportedCurrency;
  includeIva: boolean;
  phases: Phase[];
  createdAt: string;
  updatedAt: string;
}

export interface EstimateTotals {
  grandTotalHours: number;
  /** Monto neto (sin IVA) */
  grandTotalCost: number;
  /** IVA = neto × 0.19  (0 si includeIva es false) */
  iva: number;
  /** Monto bruto = neto × 1.19  (igual a neto si includeIva es false) */
  grandTotalBruto: number;
  byPhase: Array<{ phaseId: string; phaseName: string } & PhaseTotals>;
}

export const CURRENCIES: Record<SupportedCurrency, { label: string; symbol: string; locale: string; decimals: number }> = {
  USD: { label: 'US Dollar', symbol: '$', locale: 'en-US', decimals: 2 },
  CLP: { label: 'Chilean Peso', symbol: '$', locale: 'es-CL', decimals: 0 },
};
