import { Injectable } from '@nestjs/common';
import {
  Estimate,
  computeEstimateTotals,
  computeTaskTotals,
  formatCurrency,
} from '@kaufmann-lab-calculator/shared-types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PdfPrinter = require('pdfmake/js/printer');

const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

@Injectable()
export class PdfService {
  buildDocumentDefinition(estimate: Estimate): object {
    const totals = computeEstimateTotals(estimate);
    const fmt = (v: number) => formatCurrency(v, estimate.currency);
    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const taskRows: any[] = [];
    for (const phase of estimate.phases) {
      taskRows.push([
        { text: phase.name, colSpan: 6, style: 'phaseHeader', fillColor: '#1e2535' },
        {}, {}, {}, {}, {},
      ]);
      for (const task of phase.tasks) {
        const t = computeTaskTotals(task, phase, estimate);
        taskRows.push([
          { text: task.name, style: 'taskCell' },
          { text: String(task.hoursRequired), style: 'numCell' },
          { text: String(task.numberOfPersons), style: 'numCell' },
          { text: fmt(t.effectiveHourlyRate), style: 'numCell' },
          { text: `${t.totalHours.toFixed(1)}h`, style: 'numCell' },
          { text: fmt(t.totalCost), style: 'numCell', color: '#4f8cff' },
        ]);
      }
      const pt = totals.byPhase.find((p) => p.phaseId === phase.id);
      if (pt) {
        taskRows.push([
          { text: 'Phase Total', colSpan: 4, style: 'phaseTotalLabel', fillColor: '#161b25' },
          {}, {}, {},
          { text: `${pt.totalHours.toFixed(1)}h`, style: 'phaseTotalNum', fillColor: '#161b25' },
          { text: fmt(pt.totalCost), style: 'phaseTotalNum', color: '#4f8cff', fillColor: '#161b25' },
        ]);
      }
    }

    return {
      defaultStyle: { font: 'Helvetica', fontSize: 10, color: '#e8edf5' },
      background: [{ canvas: [{ type: 'rect', x: 0, y: 0, w: 595.28, h: 841.89, color: '#0d0f14' }] }],
      content: [
        { text: 'PROJECT ESTIMATE', style: 'docTitle' },
        { text: estimate.name, style: 'projectName' },
        estimate.client ? { text: `Client: ${estimate.client}`, style: 'meta' } : null,
        estimate.description ? { text: estimate.description, style: 'description' } : null,
        { text: `Generated: ${now}  ·  Currency: ${estimate.currency}  ·  Base Rate: ${fmt(estimate.globalHourlyRate)}/hr`, style: 'meta' },
        { canvas: [{ type: 'line', x1: 0, y1: 4, x2: 515.28, y2: 4, lineWidth: 1, lineColor: '#2a3347' }], margin: [0, 8, 0, 16] },

        {
          table: {
            headerRows: 1,
            widths: ['*', 55, 55, 70, 60, 80],
            body: [
              [
                { text: 'Task', style: 'tableHeader' },
                { text: 'Hours', style: 'tableHeader' },
                { text: 'Persons', style: 'tableHeader' },
                { text: 'Rate/hr', style: 'tableHeader' },
                { text: 'Total Hrs', style: 'tableHeader' },
                { text: 'Total Cost', style: 'tableHeader' },
              ],
              ...taskRows,
            ],
          },
          layout: {
            fillColor: (rowIndex: number) => rowIndex === 0 ? '#1e2535' : null,
            hLineColor: () => '#2a3347',
            vLineColor: () => '#2a3347',
          },
        },

        { text: '', margin: [0, 16, 0, 0] },
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [{ text: 'Grand Total Hours', style: 'grandLabel' }, { text: `${totals.grandTotalHours.toFixed(1)} h`, style: 'grandValue' }],
              [{ text: 'Grand Total Cost', style: 'grandLabelAccent' }, { text: fmt(totals.grandTotalCost), style: 'grandValueAccent' }],
            ],
          },
          layout: {
            fillColor: () => '#161b25',
            hLineColor: () => '#2a3347',
            vLineColor: () => '#2a3347',
          },
        },
      ].filter(Boolean),

      styles: {
        docTitle: { fontSize: 8, color: '#4f8cff', bold: true, letterSpacing: 2, margin: [0, 0, 0, 4] },
        projectName: { fontSize: 22, bold: true, color: '#e8edf5', margin: [0, 0, 0, 6] },
        meta: { fontSize: 9, color: '#5e708a', margin: [0, 2, 0, 2] },
        description: { fontSize: 10, color: '#9eadc8', margin: [0, 4, 0, 4] },
        tableHeader: { bold: true, fontSize: 9, color: '#9eadc8', fillColor: '#1e2535' },
        phaseHeader: { bold: true, fontSize: 10, color: '#4f8cff', margin: [2, 4, 2, 4] },
        taskCell: { fontSize: 9, color: '#e8edf5', margin: [2, 3, 2, 3] },
        numCell: { fontSize: 9, color: '#9eadc8', alignment: 'right', margin: [2, 3, 2, 3] },
        phaseTotalLabel: { bold: true, fontSize: 9, color: '#9eadc8', margin: [2, 3, 2, 3] },
        phaseTotalNum: { bold: true, fontSize: 9, alignment: 'right', margin: [2, 3, 2, 3] },
        grandLabel: { fontSize: 11, color: '#9eadc8', margin: [8, 6, 8, 6] },
        grandValue: { fontSize: 11, color: '#e8edf5', bold: true, alignment: 'right', margin: [8, 6, 8, 6] },
        grandLabelAccent: { fontSize: 13, color: '#e8edf5', bold: true, margin: [8, 6, 8, 6] },
        grandValueAccent: { fontSize: 15, color: '#4f8cff', bold: true, alignment: 'right', margin: [8, 6, 8, 6] },
      },
    };
  }

  generateBuffer(docDefinition: object): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const printer = new PdfPrinter(fonts);
      const doc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }
}
