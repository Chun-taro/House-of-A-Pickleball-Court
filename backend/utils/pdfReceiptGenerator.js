import PDFDocument from 'pdfkit';

/**
 * Generate a PDF Receipt Stream using PDFKit
 * @param {Object} data - Contains booking, payment, user, court, and facility info
 * @param {WritableStream} outputStream - Express res stream or writable stream
 */
export const generatePdfReceipt = (data, outputStream) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  doc.pipe(outputStream);

  const { booking, payment, user, court, facility } = data;

  const emeraldColor = '#059669';
  const darkSlateColor = '#0f172a';
  const lightBgColor = '#f8fafc';

  // Header Banner Background
  doc.rect(0, 0, 595.28, 110).fill(darkSlateColor);

  // Header Title
  doc
    .fillColor('#ffffff')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text("HOUSE OF A'S PICKLEBALL COURT", 40, 30);

  doc
    .fillColor('#a7f3d0')
    .fontSize(10)
    .font('Helvetica')
    .text('Purok-1, Linabo, Malaybalay City, Bukidnon • Premier Sports Venue', 40, 58);

  doc
    .fillColor('#ffffff')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('OFFICIAL PAYMENT RECEIPT', 40, 78, { align: 'right' });

  doc.moveDown(4);

  // Approval Status Determination
  const isApproved = ['approved', 'checked_in', 'completed'].includes(booking.status);
  const statusBannerBg = isApproved ? '#ecfdf5' : '#fffbeb';
  const statusBannerBorder = isApproved ? '#a7f3d0' : '#fde68a';
  const statusBannerText = isApproved ? '#065f46' : '#92400e';
  const statusBannerLabel = isApproved ? 'VERIFIED & APPROVED - GOOD TO GO' : 'PENDING ADMIN APPROVAL - NOT YET VERIFIED';

  // Receipt Meta Grid
  const startY = 125;
  doc.rect(40, startY, 515, 50).fill(lightBgColor).stroke('#cbd5e1');

  doc
    .fillColor(darkSlateColor)
    .fontSize(9)
    .font('Helvetica-Bold')
    .text(`Booking Reference Code:`, 55, startY + 8)
    .fillColor(emeraldColor)
    .fontSize(13)
    .text(booking.booking_code || 'HOA-RECEIPT', 55, startY + 22);

  doc
    .fillColor(darkSlateColor)
    .fontSize(9)
    .font('Helvetica-Bold')
    .text(`Transaction Reference:`, 320, startY + 8)
    .fillColor('#1e293b')
    .fontSize(10)
    .font('Helvetica')
    .text(payment?.reference_number || `PAY-${booking.booking_code}`, 320, startY + 22);

  // Verification Status Banner
  const statusBoxY = startY + 56;
  doc.rect(40, statusBoxY, 515, 24).fill(statusBannerBg).stroke(statusBannerBorder);
  doc
    .fillColor(statusBannerText)
    .fontSize(9)
    .font('Helvetica-Bold')
    .text(`OFFICIAL RESERVATION STATUS:  ${statusBannerLabel}`, 50, statusBoxY + 7, { align: 'center' });

  // Customer Information Section
  const custY = statusBoxY + 38;
  doc
    .fillColor(darkSlateColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('CUSTOMER INFORMATION', 40, custY);

  doc
    .moveTo(40, custY + 16)
    .lineTo(555, custY + 16)
    .strokeColor(emeraldColor)
    .lineWidth(2)
    .stroke();

  doc
    .fillColor('#334155')
    .fontSize(10)
    .font('Helvetica')
    .text(`Full Name: ${user?.name || 'Customer'}`, 40, custY + 26)
    .text(`Email Address: ${user?.email || 'N/A'}`, 40, custY + 42)
    .text(`Contact Phone: ${user?.phone || 'N/A'}`, 40, custY + 58);

  // Booking & Venue Details Section
  const bookY = custY + 90;
  doc
    .fillColor(darkSlateColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('RESERVATION & COURT DETAILS', 40, bookY);

  doc
    .moveTo(40, bookY + 16)
    .lineTo(555, bookY + 16)
    .strokeColor(emeraldColor)
    .lineWidth(2)
    .stroke();

  doc
    .fillColor('#334155')
    .fontSize(10)
    .font('Helvetica')
    .text(`Facility: ${facility?.name || "House of A's Pickleball Court"}`, 40, bookY + 26)
    .text(`Court: ${court?.name || "Main Court"}`, 40, bookY + 42)
    .text(`Booking Date: ${booking.booking_date}`, 40, bookY + 58)
    .text(`Time Schedule: ${booking.start_time} - ${booking.end_time} (${booking.duration_hours || 1} hr/s)`, 300, bookY + 58);

  // Payment Breakdown Table
  const tableY = bookY + 90;
  doc
    .fillColor(darkSlateColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('PAYMENT BREAKDOWN', 40, tableY);

  doc
    .moveTo(40, tableY + 16)
    .lineTo(555, tableY + 16)
    .strokeColor(emeraldColor)
    .lineWidth(2)
    .stroke();

  // Table Header
  const thY = tableY + 24;
  doc.rect(40, thY, 515, 24).fill('#e2e8f0');
  doc
    .fillColor('#0f172a')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Description', 50, thY + 7)
    .text('Payment Method', 250, thY + 7)
    .text('Status', 380, thY + 7)
    .text('Amount (PHP)', 470, thY + 7, { align: 'right' });

  // Derive payment status and amounts
  const totalAmount = booking.total_amount || 0;
  const paidAmount = booking.paid_amount !== undefined ? booking.paid_amount : payment?.payment_status === 'paid' ? totalAmount : 0;
  const remainingBalance = Math.max(0, totalAmount - paidAmount);

  let paymentStatusLabel;
  if (remainingBalance === 0 && (booking.status === 'approved' || payment?.payment_status === 'paid')) {
    paymentStatusLabel = 'FULLY PAID';
  } else if (paidAmount > 0) {
    paymentStatusLabel = 'PARTIALLY PAID';
  } else {
    paymentStatusLabel = 'PENDING VERIFICATION';
  }

  // Table Row
  const trY = thY + 30;
  doc
    .fillColor('#1e293b')
    .fontSize(10)
    .font('Helvetica')
    .text(`Pickleball Court Booking (${booking.duration_hours || 1} hrs)`, 50, trY)
    .text((payment?.payment_method || 'GCash').toUpperCase(), 250, trY)
    .text(paymentStatusLabel, 380, trY)
    .font('Helvetica-Bold')
    .text(`PHP ${totalAmount.toFixed(2)}`, 470, trY, { align: 'right' });

  doc
    .moveTo(40, trY + 20)
    .lineTo(555, trY + 20)
    .strokeColor('#cbd5e1')
    .lineWidth(1)
    .stroke();

  // Total Summary Box
  const totalY = trY + 35;
  doc.rect(260, totalY, 295, 60).fill('#ecfdf5').stroke('#a7f3d0');

  doc
    .fillColor('#065f46')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('TOTAL BOOKING FEE:', 270, totalY + 10)
    .text(`PHP ${totalAmount.toFixed(2)}`, 440, totalY + 10, { align: 'right' })
    .text('VERIFIED PAID AMOUNT:', 270, totalY + 25)
    .text(`PHP ${paidAmount.toFixed(2)}`, 440, totalY + 25, { align: 'right' })
    .fillColor(remainingBalance > 0 ? '#92400e' : '#065f46')
    .text('REMAINING BALANCE:', 270, totalY + 40)
    .fontSize(11)
    .text(`PHP ${remainingBalance.toFixed(2)}`, 440, totalY + 39, { align: 'right' });

  // Storage Retention Notice Footer
  const footerY = totalY + 85;
  doc.rect(40, footerY, 515, 55).fill('#fffbeb').stroke('#fde68a');

  doc
    .fillColor('#065f46')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('OFFICIAL RECORD NOTICE:', 50, footerY + 10);

  doc
    .fillColor('#047857')
    .fontSize(8)
    .font('Helvetica')
    .text(
      'This document serves as your official verified receipt for court reservation at House of A Pickleball Court. Please keep this PDF for your personal records.',
      50,
      footerY + 24,
      { width: 495, align: 'left' }
    );

  // Footer Sign-off
  doc
    .fillColor('#94a3b8')
    .fontSize(8)
    .font('Helvetica-Oblique')
    .text(`Generated on ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })} • House of A's Automated Booking System`, 40, 750, {
      align: 'center',
    });

  doc.end();
};
