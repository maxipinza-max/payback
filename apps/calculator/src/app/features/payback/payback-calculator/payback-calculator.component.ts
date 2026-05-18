import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PaybackInputs {
  investment: number;
  monthlyRevenue: number;
  variableCostRate: number;
  fixedMonthlyCosts: number;
  growthRate: number;
  projectionMonths: number;
}

export interface MonthlyProjection {
  month: number;
  revenue: number;
  variableCosts: number;
  fixedCosts: number;
  margin: number;
  accumulatedMargin: number;
  roi: number;
}

export interface PaybackResult {
  contributionMarginRate: number;
  firstMonthMargin: number;
  paybackMonth: number | null;
  paybackLabel: string;
  finalAccumulatedMargin: number;
  finalRoi: number;
  projection: MonthlyProjection[];
}

type PdfDocumentWithTable = jsPDF & {
  lastAutoTable: { finalY: number };
};

const defaultInputs: PaybackInputs = {
  investment: 30_000_000,
  monthlyRevenue: 6_000_000,
  variableCostRate: 35,
  fixedMonthlyCosts: 1_200_000,
  growthRate: 3,
  projectionMonths: 24,
};

export function calculatePayback(inputs: PaybackInputs): PaybackResult {
  const projection: MonthlyProjection[] = [];
  const investment = Math.max(inputs.investment, 0);
  const variableCostRate = clamp(inputs.variableCostRate, 0, 100) / 100;
  const growthRate = inputs.growthRate / 100;
  const projectionMonths = Math.max(Math.round(inputs.projectionMonths), 1);
  let accumulatedMargin = 0;
  let paybackMonth: number | null = investment === 0 ? 0 : null;

  for (let month = 1; month <= projectionMonths; month += 1) {
    const revenue = Math.max(inputs.monthlyRevenue, 0) * Math.pow(1 + growthRate, month - 1);
    const variableCosts = revenue * variableCostRate;
    const fixedCosts = Math.max(inputs.fixedMonthlyCosts, 0);
    const margin = revenue - variableCosts - fixedCosts;
    accumulatedMargin += margin;

    if (paybackMonth === null && accumulatedMargin >= investment) {
      paybackMonth = month;
    }

    projection.push({
      month,
      revenue,
      variableCosts,
      fixedCosts,
      margin,
      accumulatedMargin,
      roi: investment === 0 ? 0 : accumulatedMargin / investment,
    });
  }

  return {
    contributionMarginRate: 1 - variableCostRate,
    firstMonthMargin: projection[0]?.margin ?? 0,
    paybackMonth,
    paybackLabel:
      paybackMonth === null
        ? `No se alcanza en ${projectionMonths} meses`
        : paybackMonth === 0
          ? 'Inmediato'
          : `Mes ${paybackMonth}`,
    finalAccumulatedMargin: projection.at(-1)?.accumulatedMargin ?? 0,
    finalRoi: investment === 0 ? 0 : (projection.at(-1)?.accumulatedMargin ?? 0) / investment,
    projection,
  };
}

@Component({
  selector: 'app-payback-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payback-calculator.component.html',
  styleUrl: './payback-calculator.component.scss',
})
export class PaybackCalculatorComponent {
  inputs = signal<PaybackInputs>({ ...defaultInputs });
  result = computed(() => calculatePayback(this.inputs()));
  chartWidth = 760;
  chartHeight = 320;

  update<K extends keyof PaybackInputs>(key: K, value: number): void {
    this.inputs.update((current) => ({ ...current, [key]: value }));
  }

  reset(): void {
    this.inputs.set({ ...defaultInputs });
  }

  downloadPdf(): void {
    const inputs = this.inputs();
    const result = this.result();
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(13, 15, 20);
    doc.rect(0, 0, pageWidth, 34, 'F');
    doc.setTextColor(79, 140, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('SIMULACION DE PAYBACK', 14, 12);
    doc.setTextColor(232, 237, 245);
    doc.setFontSize(18);
    doc.text('Calculadora de Payback', 14, 24);

    autoTable(doc, {
      startY: 42,
      head: [['Supuesto', 'Valor']],
      body: [
        ['Inversion en desarrollo', this.formatCurrency(inputs.investment)],
        ['Ingresos del mes 1', this.formatCurrency(inputs.monthlyRevenue)],
        ['Costo variable', `${inputs.variableCostRate}%`],
        ['Costos fijos mensuales', this.formatCurrency(inputs.fixedMonthlyCosts)],
        ['Crecimiento mensual esperado', `${inputs.growthRate}%`],
        ['Horizonte de proyeccion', `${inputs.projectionMonths} meses`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 37, 53], textColor: [232, 237, 245] },
      bodyStyles: { fillColor: [16, 19, 26], textColor: [158, 173, 200] },
      alternateRowStyles: { fillColor: [22, 27, 37] },
    });
    const pdfWithTable = doc as PdfDocumentWithTable;

    autoTable(doc, {
      startY: pdfWithTable.lastAutoTable.finalY + 8,
      head: [['Indicador', 'Resultado']],
      body: [
        ['Margen de contribucion', this.formatPercent(result.contributionMarginRate)],
        ['Margen mes 1', this.formatCurrency(result.firstMonthMargin)],
        ['Payback', result.paybackLabel],
        ['ROI al final', this.formatPercent(result.finalRoi)],
        ['Margen acumulado final', this.formatCurrency(result.finalAccumulatedMargin)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 37, 53], textColor: [232, 237, 245] },
      bodyStyles: { fillColor: [16, 19, 26], textColor: [158, 173, 200] },
      alternateRowStyles: { fillColor: [22, 27, 37] },
    });

    autoTable(doc, {
      startY: pdfWithTable.lastAutoTable.finalY + 8,
      head: [['Mes', 'Ingresos', 'Costos variables', 'Costos fijos', 'Margen', 'Acumulado', 'ROI']],
      body: result.projection.map((row) => [
        `M${row.month}`,
        this.formatCurrency(row.revenue),
        this.formatCurrency(row.variableCosts),
        this.formatCurrency(row.fixedCosts),
        this.formatCurrency(row.margin),
        this.formatCurrency(row.accumulatedMargin),
        this.formatPercent(row.roi),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [30, 37, 53], textColor: [232, 237, 245], fontSize: 7 },
      bodyStyles: { fillColor: [16, 19, 26], textColor: [158, 173, 200], fontSize: 7 },
      alternateRowStyles: { fillColor: [22, 27, 37] },
    });

    doc.save('simulacion-payback.pdf');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatPercent(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'percent',
      maximumFractionDigits: 1,
    }).format(value);
  }

  get chartPoints(): string {
    return this.result()
      .projection.map((point) => `${this.x(point.month)},${this.y(point.accumulatedMargin)}`)
      .join(' ');
  }

  get investmentLineY(): number {
    return this.y(this.inputs().investment);
  }

  get zeroLineY(): number {
    return this.y(0);
  }

  get paybackPoint(): MonthlyProjection | null {
    const month = this.result().paybackMonth;
    if (!month || month < 1) {
      return null;
    }

    return this.result().projection.find((item) => item.month === month) ?? null;
  }

  get yTicks(): number[] {
    const values = this.result().projection.map((item) => item.accumulatedMargin);
    values.push(0, this.inputs().investment);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = (max - min || 1) / 4;

    return Array.from({ length: 5 }, (_, index) => min + step * index);
  }

  x(month: number): number {
    const months = Math.max(this.inputs().projectionMonths - 1, 1);
    return 54 + ((month - 1) / months) * (this.chartWidth - 84);
  }

  y(value: number): number {
    const values = this.result().projection.map((item) => item.accumulatedMargin);
    values.push(0, this.inputs().investment);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return this.chartHeight - 36 - ((value - min) / range) * (this.chartHeight - 72);
  }

  trackByMonth(_: number, item: MonthlyProjection): number {
    return item.month;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
