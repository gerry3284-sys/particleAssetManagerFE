import { Injectable } from '@angular/core';

export interface DismissReceiptPdfData {
  assetType: string;
  brand: string;
  model: string;
  serialNumber: string;
  dismissedDate: Date;
  dismissReason: string;
  dismissNotes?: string;
  dismissedBy?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DismissReceiptPdfService {
  async generate(data: DismissReceiptPdfData): Promise<void> {
    const { doc } = await this.buildDocument(data);
    doc.save(this.buildFileName(data));
  }

  async generateBase64(data: DismissReceiptPdfData): Promise<string> {
    const { doc } = await this.buildDocument(data);
    const dataUri = doc.output('datauristring');
    return dataUri.split(',')[1] || '';
  }

  private async buildDocument(data: DismissReceiptPdfData): Promise<{ doc: import('jspdf').jsPDF }> {
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 32;
    let y = 42;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(33, 40, 61);
    doc.text('Verbale di Dismissione Asset', marginX, y);

    doc.setFontSize(20);
    doc.text('Particle', pageWidth - marginX, y, { align: 'right' });

    y += 42;

    const dismissedDateText = this.formatDate(data.dismissedDate);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(75, 85, 99);
    doc.text(
      `In data ${dismissedDateText} e stata registrata la dismissione dell'asset aziendale indicato di seguito.`,
      marginX,
      y
    );
    y += 22;
    doc.text('Di seguito i dettagli.', marginX, y);

    y += 52;

    y = this.drawSection(doc, {
      title: 'Dettagli Asset',
      startY: y,
      marginX,
      pageWidth,
      rows: [
        { label: 'Tipologia', value: data.assetType || '-' },
        { label: 'Marca', value: data.brand || '-' },
        { label: 'Modello', value: data.model || '-' },
        { label: 'Numero Seriale', value: data.serialNumber || '-' }
      ]
    });

    y += 34;

    y = this.drawSection(doc, {
      title: 'Dettagli Dismissione',
      startY: y,
      marginX,
      pageWidth,
      rows: [
        { label: 'Data Dismissione', value: dismissedDateText },
        { label: 'Motivazione', value: data.dismissReason || '-' },
        { label: 'Operatore', value: data.dismissedBy?.trim() || 'Amministratore' },
        { label: 'Note', value: data.dismissNotes?.trim() || 'Nessuna nota' }
      ]
    });

    y += 86;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(12);
    const signX = pageWidth - marginX - 220;
    doc.text('In fede,', signX, y);
    y += 34;
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(1);
    doc.line(signX, y, pageWidth - marginX, y);

    const footerY = doc.internal.pageSize.getHeight() - 40;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 40, 61);
    doc.setFontSize(13);
    doc.text('Particle Srl', marginX, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(11);
    doc.text('Strada Torino 43 - 10043 Orbassano (TO)', marginX + 102, footerY);

    return { doc };
  }

  private drawSection(
    doc: import('jspdf').jsPDF,
    config: {
      title: string;
      startY: number;
      marginX: number;
      pageWidth: number;
      rows: Array<{ label: string; value: string }>;
    }
  ): number {
    let y = config.startY;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 40, 61);
    doc.setFontSize(15);
    doc.text(config.title, config.marginX, y);

    y += 16;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(1);
    doc.line(config.marginX, y, config.pageWidth - config.marginX, y);

    y += 34;

    config.rows.forEach((row, index) => {
      if (index > 0) {
        doc.setDrawColor(243, 244, 246);
        doc.line(config.marginX, y - 18, config.pageWidth - config.marginX, y - 18);
      }

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(11);
      doc.text(row.label, config.marginX, y);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text(row.value, config.pageWidth - config.marginX, y, { align: 'right' });

      y += 34;
    });

    return y;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  private buildFileName(data: DismissReceiptPdfData): string {
    const date = this.formatDate(data.dismissedDate).replaceAll('/', '-');
    const serial = (data.serialNumber || 'asset').replace(/\s+/g, '-');
    return `verbale-dismissione-${serial}-${date}.pdf`;
  }
}
