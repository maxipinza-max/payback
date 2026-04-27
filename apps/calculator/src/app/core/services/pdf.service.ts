import { Injectable } from '@angular/core';
import { Estimate, computeEstimateTotals, computeTaskTotals, formatCurrency } from '@kaufmann-lab-calculator/shared-types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({ providedIn: 'root' })
export class PdfService {

  generate(estimate: Estimate): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const totals = computeEstimateTotals(estimate);
    const fmt = (v: number) => formatCurrency(v, estimate.currency);
    const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const pageW = doc.internal.pageSize.getWidth();

    // ── Header bar ──────────────────────────────────────────────
    doc.setFillColor(13, 15, 20);
    doc.rect(0, 0, pageW, 42, 'F');

    doc.setTextColor(79, 140, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECT ESTIMATE', 14, 12);

    doc.setTextColor(232, 237, 245);
    doc.setFontSize(20);
    doc.text(estimate.name, 14, 24);

    doc.setFontSize(9);
    doc.setTextColor(158, 173, 200);
    doc.setFont('helvetica', 'normal');
    const metaLine = [
      estimate.client ? `Client: ${estimate.client}` : null,
      `Generated: ${now}`,
      `Currency: ${estimate.currency}`,
      `Base Rate: ${fmt(estimate.globalHourlyRate)}/hr`,
    ].filter(Boolean).join('   ·   ');
    doc.text(metaLine, 14, 34);

    if (estimate.description) {
      doc.setFontSize(9);
      doc.setTextColor(158, 173, 200);
      doc.text(estimate.description, 14, 40);
    }

    // ── Task table ───────────────────────────────────────────────
    const tableBody: any[] = [];

    for (const phase of estimate.phases) {
      // Phase header row
      tableBody.push([
        { content: phase.name, colSpan: 6, styles: { fillColor: [30, 37, 53], textColor: [79, 140, 255], fontStyle: 'bold', fontSize: 10 } },
      ]);

      for (const task of phase.tasks) {
        const t = computeTaskTotals(task, phase, estimate);
        tableBody.push([
          { content: task.name, styles: { textColor: [232, 237, 245] } },
          { content: String(task.hoursRequired), styles: { halign: 'right', textColor: [158, 173, 200] } },
          { content: String(task.numberOfPersons), styles: { halign: 'right', textColor: [158, 173, 200] } },
          { content: fmt(t.effectiveHourlyRate), styles: { halign: 'right', textColor: [158, 173, 200] } },
          { content: `${t.totalHours.toFixed(1)}h`, styles: { halign: 'right', textColor: [158, 173, 200] } },
          { content: fmt(t.totalCost), styles: { halign: 'right', textColor: [79, 140, 255], fontStyle: 'bold' } },
        ]);
      }

      // Phase total row
      const pt = totals.byPhase.find(p => p.phaseId === phase.id);
      if (pt) {
        tableBody.push([
          { content: 'Phase Total', colSpan: 4, styles: { fillColor: [22, 27, 37], textColor: [158, 173, 200], fontStyle: 'bold', fontSize: 8 } },
          { content: `${pt.totalHours.toFixed(1)}h`, styles: { fillColor: [22, 27, 37], halign: 'right', textColor: [158, 173, 200], fontStyle: 'bold' } },
          { content: fmt(pt.totalCost), styles: { fillColor: [22, 27, 37], halign: 'right', textColor: [79, 140, 255], fontStyle: 'bold' } },
        ]);
      }
    }

    autoTable(doc, {
      startY: 48,
      head: [[
        { content: 'Task', styles: { halign: 'left' } },
        { content: 'Hours', styles: { halign: 'right' } },
        { content: 'Persons', styles: { halign: 'right' } },
        { content: 'Rate/hr', styles: { halign: 'right' } },
        { content: 'Total Hrs', styles: { halign: 'right' } },
        { content: 'Total Cost', styles: { halign: 'right' } },
      ]],
      body: tableBody,
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 28 },
        4: { cellWidth: 24 },
        5: { cellWidth: 34 },
      },
      headStyles: {
        fillColor: [30, 37, 53],
        textColor: [158, 173, 200],
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fillColor: [16, 19, 26],
        textColor: [158, 173, 200],
        fontSize: 9,
        lineColor: [42, 51, 71],
        lineWidth: 0.2,
      },
      alternateRowStyles: { fillColor: [16, 19, 26] },
      margin: { left: 14, right: 14 },
      theme: 'grid',
    });

    // ── Totals block ─────────────────────────────────────────────
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    const blockH = estimate.includeIva ? 38 : 22;

    doc.setFillColor(22, 27, 37);
    doc.roundedRect(14, finalY, pageW - 28, blockH, 3, 3, 'F');

    // Total hours
    doc.setFontSize(9);
    doc.setTextColor(158, 173, 200);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Horas', 20, finalY + 8);
    doc.setTextColor(232, 237, 245);
    doc.setFont('helvetica', 'bold');
    doc.text(`${totals.grandTotalHours.toFixed(1)} h`, pageW - 20, finalY + 8, { align: 'right' });

    if (estimate.includeIva) {
      // Separator line
      doc.setDrawColor(42, 51, 71);
      doc.line(20, finalY + 12, pageW - 20, finalY + 12);

      // Neto
      doc.setFontSize(9);
      doc.setTextColor(158, 173, 200);
      doc.setFont('helvetica', 'normal');
      doc.text('Monto Neto', 20, finalY + 19);
      doc.setTextColor(232, 237, 245);
      doc.setFont('helvetica', 'bold');
      doc.text(fmt(totals.grandTotalCost), pageW - 20, finalY + 19, { align: 'right' });

      // IVA
      doc.setFontSize(9);
      doc.setTextColor(158, 173, 200);
      doc.setFont('helvetica', 'normal');
      doc.text('IVA (19%)', 20, finalY + 27);
      doc.setTextColor(240, 192, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`+ ${fmt(totals.iva)}`, pageW - 20, finalY + 27, { align: 'right' });

      // Bruto
      doc.setFontSize(12);
      doc.setTextColor(158, 173, 200);
      doc.setFont('helvetica', 'normal');
      doc.text('Monto Bruto', 20, finalY + 36);
      doc.setTextColor(79, 140, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(fmt(totals.grandTotalBruto), pageW - 20, finalY + 36, { align: 'right' });
    } else {
      // No IVA — just show neto as total
      doc.setFontSize(12);
      doc.setTextColor(158, 173, 200);
      doc.setFont('helvetica', 'normal');
      doc.text('Monto Neto', 20, finalY + 18);
      doc.setTextColor(79, 140, 255);
      doc.setFont('helvetica', 'bold');
      doc.text(fmt(totals.grandTotalCost), pageW - 20, finalY + 18, { align: 'right' });
    }

    // ── Save ──────────────────────────────────────────────────────
    const filename = `${estimate.name.replace(/\s+/g, '-').toLowerCase()}-estimate.pdf`;
    doc.save(filename);
  }
}
