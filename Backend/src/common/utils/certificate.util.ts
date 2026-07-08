import PDFDocument from 'pdfkit';
import type { Response } from 'express';

interface CertificateData {
  userName: string;
  eventTitle: string;
  eventDate: Date | string;
  certificateId: string;
}

export const streamCertificate = (res: Response, { userName, eventTitle, eventDate, certificateId }: CertificateData): void => {
  const doc = new PDFDocument({ layout: 'landscape', size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificateId}.pdf"`);
  doc.pipe(res);

  doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(3).stroke('#4f46e5');
  doc.moveDown(4);
  doc.fontSize(34).fillColor('#111111').text('Certificate of Participation', { align: 'center' });
  doc.moveDown(1.5);
  doc.fontSize(16).fillColor('#444444').text('This certificate is proudly presented to', { align: 'center' });
  doc.moveDown(0.8);
  doc.fontSize(28).fillColor('#4f46e5').text(userName, { align: 'center' });
  doc.moveDown(0.8);
  doc
    .fontSize(16)
    .fillColor('#444444')
    .text(`for attending "${eventTitle}" on ${new Date(eventDate).toDateString()}`, { align: 'center' });
  doc.moveDown(3);
  doc.fontSize(10).fillColor('#888888').text(`Certificate ID: ${certificateId}`, { align: 'center' });
  doc.end();
};
