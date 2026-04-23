import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from './pdf.service';
import { Estimate } from '@kaufmann-lab-calculator/shared-types';

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('generate')
  async generatePdf(@Body() estimate: Estimate, @Res() res: Response): Promise<void> {
    const docDef = this.pdfService.buildDocumentDefinition(estimate);
    const buffer = await this.pdfService.generateBuffer(docDef);
    const filename = `${(estimate.name || 'estimate').replace(/\s+/g, '-').toLowerCase()}-estimate.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
