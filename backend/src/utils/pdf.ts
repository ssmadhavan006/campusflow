import PDFDocument from 'pdfkit';

export interface ODLetterData {
  studentName: string;
  rollNumber: string;
  department: string;
  eventName: string;
  eventDate: string;
  eventDuration: string;
  facultyName: string;
  approvalTimestamp: string;
  verificationId: string;
}

export const generateODPDFBuffer = (data: ODLetterData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    doc.fillColor('#1a237e').rect(0, 0, doc.page.width, 30).fill();

    doc.moveDown(2);

    doc
      .fillColor('#0d47a1')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('CAMPUSFLOW OFFICIAL PORTAL', { align: 'center' });

    doc
      .fillColor('#424242')
      .fontSize(10)
      .font('Helvetica')
      .text('Automated Event Verification & On-Duty Letter', { align: 'center' });

    doc.moveDown(2);

    doc.strokeColor('#e0e0e0').lineWidth(1).moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();

    doc.moveDown(2);

    doc
      .fillColor('#212121')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('ON-DUTY REQUEST REQUISITION');

    doc.moveDown(1.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text('This is to certify that the student whose details are given below has registered and successfully attended the college event. As per college regulation rules, the student is eligible for On-Duty (OD) attendance credit for the duration of the event.', { align: 'justify' });

    doc.moveDown(2);

    const tableLeft = 70;

    const drawRow = (label: string, value: string) => {
      const currentY = doc.y;
      doc
        .font('Helvetica-Bold')
        .fillColor('#1a237e')
        .text(label, tableLeft, currentY, { width: 150 });
      doc
        .font('Helvetica')
        .fillColor('#212121')
        .text(value, tableLeft + 160, currentY, { width: 280 });
      doc.moveDown(1.2);
    };

    drawRow('Student Name', data.studentName);
    drawRow('Roll Number', data.rollNumber);
    drawRow('Department', data.department);
    drawRow('Event Attended', data.eventName);
    drawRow('Event Date', data.eventDate);
    drawRow('Event Duration', `${data.eventDuration} minutes`);

    doc.moveDown(2);

    doc
      .font('Helvetica-Bold')
      .fillColor('#212121')
      .text('VERIFICATION AND APPROVAL', 50, doc.y);

    doc.moveDown(1);

    const signY = doc.y;

    doc
      .font('Helvetica')
      .fontSize(10)
      .text(`Approved By Faculty: ${data.facultyName}`, 50, signY);
    doc.text(`Timestamp: ${data.approvalTimestamp}`, 50, signY + 15);

    doc
      .font('Helvetica-Bold')
      .text('Unique Verification ID:', 320, signY);
    doc
      .font('Helvetica')
      .fillColor('#d32f2f')
      .text(data.verificationId, 320, signY + 15);

    const footerY = doc.page.height - 60;
    doc
      .strokeColor('#e0e0e0')
      .lineWidth(1)
      .moveTo(50, footerY - 10)
      .lineTo(doc.page.width - 50, footerY - 10)
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#757575')
      .text('This is an electronically generated and validated certificate. No physical signature is required.', 50, footerY, { align: 'center' });

    doc.end();
  });
};
