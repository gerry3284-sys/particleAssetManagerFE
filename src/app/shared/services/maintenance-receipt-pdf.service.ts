import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';

type JsPdfDocument = import('jspdf').jsPDF;

export interface AssetField {
  label: string;
  oldValue: string;
  newValue: string;
}

export interface EditReceiptPdfData {
  assetType: string;
  brand: string;
  serialNumber: string;
  editedDate: Date;
  editedBy?: string;
  changes: AssetField[];
}

@Injectable({
  providedIn: 'root'
})
export class EditReceiptPdfService {

  async generate(data: EditReceiptPdfData): Promise<void> {
    const { doc } = await this.buildDocument(data);
    doc.save(this.buildFileName(data));
  }

  async generateBase64(data: EditReceiptPdfData): Promise<string> {
    const { doc } = await this.buildDocument(data);
    const dataUri = doc.output('datauristring');
    return dataUri.split(',')[1] || '';
  }

  private async buildDocument(data: EditReceiptPdfData): Promise<{ doc: JsPdfDocument }> {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 32;
    let y = 42;

    // Titolo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(33, 40, 61);
    doc.text('Verbale di Modifica Asset', marginX, y);

    doc.setFontSize(20);
    doc.text('Particle', pageWidth - marginX, y, { align: 'right' });

    y += 42;

    const editedDateText = this.formatDate(data.editedDate);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(75, 85, 99);
    doc.text(
      `In data ${editedDateText} sono state registrate modifiche all'asset aziendale indicato di seguito.`,
      marginX, y
    );
    y += 22;
    doc.text('Di seguito i dettagli delle modifiche effettuate.', marginX, y);

    y += 52;

    // Sezione asset
    y = this.drawSection(doc, {
      title: 'Dettagli Asset',
      startY: y,
      marginX,
      pageWidth,
      rows: [
        { label: 'Tipologia', value: data.assetType || '-' },
        { label: 'Marca', value: data.brand || '-' },
        { label: 'Numero Seriale', value: data.serialNumber || '-' },
        { label: 'Operatore', value: data.editedBy?.trim() || 'Amministratore' },
        { label: 'Data Modifica', value: editedDateText }
      ]
    });

    y += 34;

    // Sezione modifiche
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 40, 61);
    doc.setFontSize(15);
    doc.text('Modifiche Effettuate', marginX, y);

    y += 16;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(1);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 34;

    // Header colonne
    const col1 = marginX;
    const col2 = marginX + 160;
    const col3 = marginX + 340;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(156, 163, 175);
    doc.text('Campo', col1, y);
    doc.text('Valore Precedente', col2, y);
    doc.text('Nuovo Valore', col3, y);

    y += 10;
    doc.setDrawColor(229, 231, 235);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 24;

    // Righe modifiche
    data.changes.forEach((change, index) => {
      if (index > 0) {
        doc.setDrawColor(243, 244, 246);
        doc.line(marginX, y - 12, pageWidth - marginX, y - 12);
      }

      // Label campo
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(11);
      doc.text(change.label, col1, y);

      // Vecchio valore
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(156, 163, 175);
      doc.text(change.oldValue || '-', col2, y);

      // Freccia →
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(229, 106, 61);
      doc.text('→', col3 - 20, y);

      // Nuovo valore
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(55, 65, 81);
      doc.text(change.newValue || '-', col3, y);

      y += 34;
    });

    // Firma
    y += 52;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(12);
    const signX = pageWidth - marginX - 220;
    doc.text('In fede,', signX, y);
    y += 34;
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(1);
    doc.line(signX, y, pageWidth - marginX, y);

    // Footer
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
    doc: JsPdfDocument,
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
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(date);
  }

  private buildFileName(data: EditReceiptPdfData): string {
    const date = this.formatDate(data.editedDate).replaceAll('/', '-');
    const serial = (data.serialNumber || 'asset').replace(/\s+/g, '-');
    return `verbale-modifica-${serial}-${date}.pdf`;
  }
}