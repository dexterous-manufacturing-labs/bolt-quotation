import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SavedQuotation, SavedInvoice, Customer, Order } from '../types';
import { COMPANY_INFO, calculateGST } from './gstCalculator';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export class PDFGenerator {
  static async generateQuotationPDF(quotation: SavedQuotation, customer: Customer, technologiesData?: any): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const footerHeight = 30; // Reserve space for footer
    let yPosition = margin;

    // Modern Color Palette
    const colors = {
      primary: [37, 99, 235],      // Modern blue
      secondary: [99, 102, 241],   // Purple accent
      success: [34, 197, 94],      // Green
      warning: [245, 158, 11],     // Amber
      danger: [239, 68, 68],       // Red
      dark: [31, 41, 55],          // Dark gray
      light: [249, 250, 251],      // Very light gray
      white: [255, 255, 255],
      border: [229, 231, 235]      // Light border
    };

    // Helper function to add footer to every page
    const addFooter = (pageNumber: number, totalPages: number) => {
      const footerY = pageHeight - 25;
      
      // Footer separator line
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      // Thank you message
      doc.setTextColor(...colors.primary);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Thank you for choosing Dexterous Manufacturing Labs Pvt Ltd', pageWidth / 2, footerY + 8, { align: 'center' });

      // Computer-generated text at the bottom
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text('This is a computer-generated quotation, signature not required', pageWidth / 2, footerY + 16, { align: 'center' });

      // Page number
      doc.setTextColor(...colors.dark);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, footerY + 16, { align: 'right' });
    };

    // Helper function to add text with word wrap
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - footerHeight) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // COMPACT HEADER DESIGN - Smaller and cleaner
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 35, 'F'); // Reduced height from 45 to 35
    
    // Company Information - more compact, removed tagline
    doc.setTextColor(...colors.white);
    doc.setFontSize(16); // Reduced from 18
    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY_INFO.name, pageWidth / 2, 12, { align: 'center' });
    
    // Only essential contact info - single line with correct information
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`GSTN: ${COMPANY_INFO.gstn} | Phone: +91-8629044664 | Email: sushant@iamrapid.com`, pageWidth / 2, 20, { align: 'center' });
    doc.text('www.iamrapid.com', pageWidth / 2, 27, { align: 'center' });

    yPosition = 45; // Reduced from 55

    // QUOTATION TITLE
    doc.setTextColor(...colors.dark);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', margin, yPosition);
    
    // Decorative line under title
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(1.5);
    doc.line(margin, yPosition + 3, margin + 60, yPosition + 3);
    
    yPosition += 15;

    // QUOTATION INFO - Single card without status
    const cardWidth = pageWidth - 2 * margin;
    const cardHeight = 20; // Reduced height
    
    // Single Card - Quotation Details only
    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, yPosition, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPosition, cardWidth, cardHeight, 2, 2, 'S');

    doc.setTextColor(...colors.primary);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Quotation Details', margin + 5, yPosition + 7);

    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Number: ${quotation.quotationNumber}`, margin + 5, yPosition + 13);
    doc.text(`Date: ${new Date(quotation.createdAt).toLocaleDateString('en-IN')}`, margin + 80, yPosition + 13);
    doc.text(`Valid Until: ${new Date(quotation.validUntil).toLocaleDateString('en-IN')}`, margin + 160, yPosition + 13);

    yPosition += cardHeight + 10;

    // CUSTOMER INFORMATION SECTION
    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 6, 1, 1, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', margin + 5, yPosition + 4);

    yPosition += 10;

    // Customer details in a compact card
    const customerCardHeight = 30;
    doc.setFillColor(...colors.white);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, customerCardHeight, 2, 2, 'F');
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, customerCardHeight, 2, 2, 'S');

    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(customer.company_name, margin + 8, yPosition + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    // Compact two column layout
    const leftCol = margin + 8;
    const rightCol = margin + (pageWidth - 2 * margin) / 2 + 8;
    
    doc.text(`Contact: ${customer.contact_person}`, leftCol, yPosition + 15);
    doc.text(`Email: ${customer.email}`, leftCol, yPosition + 20);
    doc.text(`Phone: ${customer.phone}`, leftCol, yPosition + 25);
    
    if (customer.gstn) {
      doc.text(`GSTN: ${customer.gstn}`, rightCol, yPosition + 15);
    }
    
    // Billing Address
    const billingAddress = `${customer.billing_address.street}, ${customer.billing_address.city}, ${customer.billing_address.state} - ${customer.billing_address.pin}`;
    doc.setFont('helvetica', 'bold');
    doc.text('Billing Address:', rightCol, yPosition + 20);
    doc.setFont('helvetica', 'normal');
    addWrappedText(billingAddress, rightCol, yPosition + 25, (pageWidth - 2 * margin) / 2 - 15, 7);

    yPosition += customerCardHeight + 10;

    // SHIPPING ADDRESS SECTION
    const shippingAddressType = quotation.shippingAddressType || 'shipping';
    const isSameAddress = shippingAddressType === 'billing' || 
      JSON.stringify(customer.billing_address) === JSON.stringify(customer.shipping_address);

    doc.setFillColor(...colors.secondary);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 6, 1, 1, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SHIP TO', margin + 5, yPosition + 4);

    yPosition += 10;

    if (isSameAddress) {
      // Same address - show compact message
      const sameAddressHeight = 15;
      doc.setFillColor(...colors.white);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, sameAddressHeight, 2, 2, 'F');
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, sameAddressHeight, 2, 2, 'S');

      doc.setTextColor(...colors.dark);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Same as billing address', margin + 8, yPosition + 10);
      
      yPosition += sameAddressHeight + 10;
    } else {
      // Different address - show full shipping address
      const shippingCardHeight = 25;
      doc.setFillColor(...colors.white);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, shippingCardHeight, 2, 2, 'F');
      doc.setDrawColor(...colors.border);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, shippingCardHeight, 2, 2, 'S');

      doc.setTextColor(...colors.dark);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(customer.company_name, margin + 8, yPosition + 8);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Contact: ${customer.contact_person}`, margin + 8, yPosition + 15);
      
      const shippingAddress = `${customer.shipping_address.street}, ${customer.shipping_address.city}, ${customer.shipping_address.state} - ${customer.shipping_address.pin}`;
      addWrappedText(shippingAddress, margin + 8, yPosition + 20, pageWidth - 2 * margin - 16, 7);
      
      yPosition += shippingCardHeight + 10;
    }

    // Check if we need a new page before the table
    checkPageBreak(80);

    // ITEMS TABLE HEADER
    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PARTS & COMPONENTS', margin + 5, yPosition + 5);

    yPosition += 12;

    // TABLE - Calculate GST for each part and prepare table data
    const tableHeaders = [
      'S.No',
      'Description',
      'Tech/Material',
      'Qty',
      'Unit Price',
      'Amount',
      'GST',
      'Total'
    ];

    const tableData = quotation.parts.map((part, index) => {
      const gstCalc = calculateGST(part.totalPrice, customer);
      const gstBreakdown = quotation.gstType === 'INTRASTATE' 
        ? `CGST: Rs ${gstCalc.cgst.toFixed(2)}\nSGST: Rs ${gstCalc.sgst.toFixed(2)}`
        : `IGST: Rs ${gstCalc.igst.toFixed(2)}`;
      
      // Get material name from technologies data
      let materialDisplay = part.material || 'N/A';
      let technologyDisplay = part.technology || 'N/A';
      
      if (technologiesData && part.technology && part.material) {
        const tech = technologiesData.technologies[part.technology];
        if (tech) {
          technologyDisplay = tech.name;
          const material = tech.materials[part.material];
          if (material) {
            materialDisplay = material.name;
          }
        }
      }
      
      // Include comments in description if available
      let description = part.fileName;
      if (part.comments && part.comments.trim()) {
        description += `\nNotes: ${part.comments.trim()}`;
      }
      
      return [
        (index + 1).toString(),
        description,
        `${technologyDisplay}\n${materialDisplay}`,
        part.quantity.toString(),
        `Rs ${part.unitPrice.toFixed(2)}`,
        `Rs ${part.totalPrice.toFixed(2)}`,
        gstBreakdown,
        `Rs ${part.finalPrice.toFixed(2)}`
      ];
    });

    // Create table with PROPER PAGE BREAK HANDLING
    doc.autoTable({
      startY: yPosition,
      head: [tableHeaders],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: colors.secondary,
        textColor: colors.white,
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: 2,
        lineColor: colors.border,
        lineWidth: 0.1
      },
      bodyStyles: {
        fontSize: 6,
        cellPadding: 1.2, // Reduced padding for more compact rows
        valign: 'middle',
        lineColor: colors.border,
        lineWidth: 0.1,
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 38 },
        2: { halign: 'center', cellWidth: 26 },
        3: { halign: 'center', cellWidth: 10 },
        4: { halign: 'right', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 18 },
        6: { halign: 'center', cellWidth: 22 },
        7: { halign: 'right', cellWidth: 20 }
      },
      margin: { left: margin, right: margin, bottom: footerHeight }, // CRITICAL: Reserve footer space
      tableWidth: 'wrap',
      pageBreak: 'auto', // Enable automatic page breaks
      showHead: 'everyPage', // Show header on every page
      didDrawCell: (data) => {
        if (data.column.index === 6 && data.section === 'body') {
          doc.setFontSize(5);
        }
      },
      didDrawPage: (data) => {
        // Add footer to each page that contains table
        addFooter(data.pageNumber, doc.getNumberOfPages());
      }
    });

    // Get the final Y position after the table
    yPosition = (doc as any).lastAutoTable.finalY;

    // Service Charges Section (if any) - MOVED AFTER PARTS TABLE
    if (quotation.serviceCharges && quotation.serviceCharges.length > 0) {
      // Add some space after parts table
      yPosition += 8;
      
      // Check if we need a new page for service charges
      if (yPosition + 60 > pageHeight - footerHeight) {
        doc.addPage();
        yPosition = margin;
      }

      // SERVICE CHARGES HEADER
      doc.setFillColor(...colors.secondary);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ADDITIONAL SERVICES', margin + 5, yPosition + 5);

      yPosition += 12;

      // Service charges table
      const serviceHeaders = ['S.No', 'Service Description', 'Amount'];
      const serviceData = quotation.serviceCharges.map((charge, index) => [
        (index + 1).toString(),
        charge.description,
        `Rs ${charge.amount.toFixed(2)}`
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [serviceHeaders],
        body: serviceData,
        theme: 'plain',
        headStyles: {
          fillColor: colors.secondary,
          textColor: colors.white,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          cellPadding: 2
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2,
          valign: 'middle',
          lineColor: colors.border,
          lineWidth: 0.1
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          1: { halign: 'left', cellWidth: 120 },
          2: { halign: 'right', cellWidth: 30 }
        },
        margin: { left: margin, right: margin, bottom: footerHeight },
        tableWidth: 'wrap',
        pageBreak: 'auto',
        showHead: 'everyPage',
        didDrawPage: (data) => {
          // Add footer to each page that contains service charges table
          addFooter(data.pageNumber, doc.getNumberOfPages());
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 8;
    }

    // FORCE NEW PAGE for summary if not enough space
    if (yPosition + 80 > pageHeight - footerHeight) {
      doc.addPage();
      yPosition = margin;
    }

    // Add some space before summary
    yPosition += 8;

    // REDESIGNED PRICING SUMMARY - Right aligned with margin
    const summaryX = pageWidth - margin - 85; // Added more margin from right
    const summaryWidth = 80; // Slightly wider

    // Calculate amounts
    const baseAmount = quotation.totalBasePrice;
    const discountAmount = (baseAmount * (quotation.discount || 0)) / 100;
    const discountedAmount = baseAmount - discountAmount;
    const finalGST = calculateGST(discountedAmount, customer);

    // Content area - clean layout without background
    doc.setTextColor(...colors.dark);
    let summaryY = yPosition;

    // Parts subtotal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const partsTotal = quotation.parts.reduce((sum, part) => sum + part.totalPrice, 0);
    doc.text('Parts Total:', summaryX, summaryY);
    doc.text(`Rs ${partsTotal.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
    summaryY += 7;

    // Service charges total (if any)
    if (quotation.serviceCharges && quotation.serviceCharges.length > 0) {
      doc.text('Services Total:', summaryX, summaryY);
      doc.text(`Rs ${quotation.totalServiceCharges.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
      summaryY += 7;
      
      // Combined subtotal
      doc.setFont('helvetica', 'bold');
      doc.text('Subtotal:', summaryX, summaryY);
      doc.text(`Rs ${baseAmount.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      summaryY += 7;
    }

    // Discount (if applicable)
    if (quotation.discount > 0) {
      doc.setTextColor(...colors.success);
      doc.text(`Discount (${quotation.discount}%):`, summaryX, summaryY);
      doc.text(`-Rs ${discountAmount.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
      doc.setTextColor(...colors.dark);
      summaryY += 7;
      
      // Subtotal after discount
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Subtotal after discount:', summaryX, summaryY);
      doc.text(`Rs ${discountedAmount.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
      summaryY += 7;
    }

    // Separator line
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.line(summaryX, summaryY, summaryX + summaryWidth, summaryY);
    summaryY += 5;

    // GST Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TAX BREAKDOWN:', summaryX, summaryY);
    summaryY += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    
    if (quotation.gstType === 'INTRASTATE') {
      doc.text('CGST (9%):', summaryX + 5, summaryY);
      doc.text(`Rs ${finalGST.cgst.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
      summaryY += 5;
      doc.text('SGST (9%):', summaryX + 5, summaryY);
      doc.text(`Rs ${finalGST.sgst.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
      summaryY += 5;
    } else {
      doc.text('IGST (18%):', summaryX + 5, summaryY);
      doc.text(`Rs ${finalGST.igst.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
      summaryY += 5;
    }

    // Total GST
    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Total GST:', summaryX, summaryY);
    doc.text(`Rs ${quotation.totalGST.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
    summaryY += 10;

    // Final total - NO RED HIGHLIGHTING, just border
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(1);
    doc.rect(summaryX - 3, summaryY - 3, summaryWidth + 6, 12);
    
    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('GRAND TOTAL:', summaryX, summaryY + 3);
    doc.text(`Rs ${quotation.finalPrice.toFixed(2)}`, summaryX + summaryWidth, summaryY + 3, { align: 'right' });

    // PAYMENT TERMS
    yPosition = summaryY + 20;

    // Check if we need new page for payment terms
    if (yPosition + 40 > pageHeight - footerHeight) {
      doc.addPage();
      yPosition = margin;
    }

    // Payment terms header
    doc.setFillColor(...colors.secondary);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 6, 1, 1, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT TERMS & CONDITIONS', margin + 5, yPosition + 4);

    yPosition += 10;

    // Terms in a compact card
    const termsHeight = 30; // Reduced height
    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, termsHeight, 2, 2, 'F');
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, termsHeight, 2, 2, 'S');

    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Use quotation-specific payment terms if available, otherwise use customer default
    const effectivePaymentTerms = quotation.paymentTerms || customer.payment_terms;

    const paymentTerms = [
      `• Payment Terms: ${effectivePaymentTerms}`,
      '• This quotation is valid for 30 days from the date of issue',
      `• Delivery time: ${quotation.leadTime || '3-5 days'} from order confirmation`
    ];

    let termsY = yPosition + 6;
    paymentTerms.forEach(term => {
      termsY = addWrappedText(term, margin + 6, termsY, pageWidth - 2 * margin - 12, 8);
      termsY += 1;
    });

    // Notes section
    if (quotation.notes && quotation.notes.trim()) {
      yPosition += termsHeight + 8;
      
      // Check if we need new page for notes
      if (yPosition + 25 > pageHeight - footerHeight) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFillColor(...colors.warning);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 6, 1, 1, 'F');
      doc.setTextColor(...colors.white);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTES', margin + 5, yPosition + 4);

      yPosition += 10;
      doc.setFillColor(...colors.light);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 15, 2, 2, 'F');
      doc.setTextColor(...colors.dark);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      addWrappedText(quotation.notes, margin + 6, yPosition + 6, pageWidth - 2 * margin - 12, 8);
    }

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i, totalPages);
    }

    // Save the PDF
    const fileName = `Quotation_${quotation.quotationNumber}_${customer.company_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(fileName);
  }

  static async generateInvoicePDF(invoice: SavedInvoice, customer: Customer, technologiesData?: any): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const footerHeight = 30; // Reserve space for footer
    let yPosition = margin;

    // Colors
    const primaryColor = [79, 70, 229]; // Indigo
    const lightGray = [243, 244, 246];

    // Helper function to add footer to every page
    const addFooter = (pageNumber: number, totalPages: number) => {
      const footerY = pageHeight - 25;
      
      // Footer separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      // Thank you message
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text('Thank you for your business!', pageWidth / 2, footerY + 6, { align: 'center' });

      // Computer-generated text at the bottom
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text('This is a computer-generated invoice, signature not required', pageWidth / 2, footerY + 13, { align: 'center' });

      // Page number
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, footerY + 13, { align: 'right' });
    };

    // Helper function to add text with word wrap
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - footerHeight) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // COMPACT Header Layout - Smaller and cleaner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 30, 'F'); // Reduced height from 40

    // Company Name - Centered
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); // Reduced from 18
    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY_INFO.name, pageWidth / 2, 12, { align: 'center' });
    
    // Only essential contact info - single line, removed tagline, with correct information
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`GSTN: ${COMPANY_INFO.gstn} | Phone: +91-8629044664 | Email: sushant@iamrapid.com | www.iamrapid.com`, pageWidth / 2, 22, { align: 'center' });

    yPosition = 40; // Reduced from 50

    // Document Title
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // Invoice Details Box - Single card without status
    const detailsHeight = 18; // Reduced height
    doc.setFillColor(...lightGray);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, detailsHeight, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, detailsHeight);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Details', margin + 4, yPosition + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Invoice No: ${invoice.invoiceNumber}`, margin + 4, yPosition + 11);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, margin + 4, yPosition + 15);
    
    // Right side details - removed status
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, pageWidth - margin - 70, yPosition + 11);

    yPosition += detailsHeight + 8;

    // Customer Information
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', margin + 4, yPosition + 4);

    yPosition += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(customer.company_name, margin + 4, yPosition);
    
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Contact: ${customer.contact_person}`, margin + 4, yPosition);
    yPosition += 4;
    doc.text(`Email: ${customer.email}`, margin + 4, yPosition);
    yPosition += 4;
    doc.text(`Phone: ${customer.phone}`, margin + 4, yPosition);
    yPosition += 4;
    if (customer.gstn) {
      doc.text(`GSTN: ${customer.gstn}`, margin + 4, yPosition);
      yPosition += 4;
    }

    // Billing Address
    doc.text('Billing Address:', margin + 4, yPosition);
    yPosition += 4;
    const billingAddress = `${customer.billing_address.street}, ${customer.billing_address.city}, ${customer.billing_address.state} - ${customer.billing_address.pin}`;
    yPosition = addWrappedText(billingAddress, margin + 4, yPosition, pageWidth - 2 * margin - 8, 8);
    yPosition += 4;

    // SHIPPING ADDRESS SECTION for Invoice
    const shippingAddressType = invoice.shippingAddressType || 'shipping';
    const isSameAddress = shippingAddressType === 'billing' || 
      JSON.stringify(customer.billing_address) === JSON.stringify(customer.shipping_address);

    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SHIP TO', margin + 4, yPosition + 4);

    yPosition += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    if (isSameAddress) {
      doc.setFont('helvetica', 'bold');
      doc.text('Same as billing address', margin + 4, yPosition);
      yPosition += 6;
    } else {
      doc.text('Shipping Address:', margin + 4, yPosition);
      yPosition += 4;
      const shippingAddress = `${customer.shipping_address.street}, ${customer.shipping_address.city}, ${customer.shipping_address.state} - ${customer.shipping_address.pin}`;
      yPosition = addWrappedText(shippingAddress, margin + 4, yPosition, pageWidth - 2 * margin - 8, 8);
    }
    yPosition += 8;

    // Check if we need a new page before the table
    checkPageBreak(80);

    // Parts Table Header
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PARTS & COMPONENTS', margin + 4, yPosition + 4);

    yPosition += 10;

    // TABLE
    const tableHeaders = [
      'S.No',
      'Description',
      'Tech/Material',
      'Qty',
      'Unit Price',
      'Amount',
      'GST',
      'Total'
    ];

    // Calculate GST for each part and prepare table data
    const tableData = invoice.parts.map((part, index) => {
      const gstCalc = calculateGST(part.totalPrice, customer);
      const gstBreakdown = invoice.gstType === 'INTRASTATE' 
        ? `CGST: Rs ${gstCalc.cgst.toFixed(2)}\nSGST: Rs ${gstCalc.sgst.toFixed(2)}`
        : `IGST: Rs ${gstCalc.igst.toFixed(2)}`;
      
      // Get material name from technologies data
      let materialDisplay = part.material || 'N/A';
      let technologyDisplay = part.technology || 'N/A';
      
      if (technologiesData && part.technology && part.material) {
        const tech = technologiesData.technologies[part.technology];
        if (tech) {
          technologyDisplay = tech.name;
          const material = tech.materials[part.material];
          if (material) {
            materialDisplay = material.name;
          }
        }
      }
      
      // Include comments in description if available
      let description = part.fileName;
      if (part.comments && part.comments.trim()) {
        description += `\nNotes: ${part.comments.trim()}`;
      }
      
      return [
        (index + 1).toString(),
        description,
        `${technologyDisplay}\n${materialDisplay}`,
        part.quantity.toString(),
        `Rs ${part.unitPrice.toFixed(2)}`,
        `Rs ${part.totalPrice.toFixed(2)}`,
        gstBreakdown,
        `Rs ${part.finalPrice.toFixed(2)}`
      ];
    });

    // Create table with PROPER PAGE BREAK HANDLING
    doc.autoTable({
      startY: yPosition,
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: 2
      },
      bodyStyles: {
        fontSize: 6,
        cellPadding: 1.2, // Reduced padding for more compact rows
        valign: 'middle',
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 40 },
        2: { halign: 'center', cellWidth: 28 },
        3: { halign: 'center', cellWidth: 10 },
        4: { halign: 'right', cellWidth: 20 },
        5: { halign: 'right', cellWidth: 18 },
        6: { halign: 'center', cellWidth: 22 },
        7: { halign: 'right', cellWidth: 20 }
      },
      margin: { left: margin, right: margin, bottom: footerHeight }, // CRITICAL: Reserve footer space
      tableWidth: 'wrap',
      pageBreak: 'auto', // Enable automatic page breaks
      showHead: 'everyPage', // Show header on every page
      didDrawCell: (data) => {
        if (data.column.index === 6 && data.section === 'body') {
          doc.setFontSize(5);
        }
      },
      didDrawPage: (data) => {
        // Add footer to each page that contains table
        addFooter(data.pageNumber, doc.getNumberOfPages());
      }
    });

    // Get the final Y position after the table
    yPosition = (doc as any).lastAutoTable.finalY;

    // Service Charges Section (if any) for Invoice - MOVED AFTER PARTS TABLE
    if (invoice.serviceCharges && invoice.serviceCharges.length > 0) {
      // Add some space after parts table
      yPosition += 8;
      
      // Check if we need a new page for service charges
      if (yPosition + 60 > pageHeight - footerHeight) {
        doc.addPage();
        yPosition = margin;
      }

      // SERVICE CHARGES HEADER
      doc.setFillColor(...primaryColor);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ADDITIONAL SERVICES', margin + 4, yPosition + 4);

      yPosition += 10;

      // Service charges table
      const serviceHeaders = ['S.No', 'Service Description', 'Amount'];
      const serviceData = invoice.serviceCharges.map((charge, index) => [
        (index + 1).toString(),
        charge.description,
        `Rs ${charge.amount.toFixed(2)}`
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [serviceHeaders],
        body: serviceData,
        theme: 'grid',
        headStyles: {
          fillColor: primaryColor,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          cellPadding: 2
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2,
          valign: 'middle',
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          1: { halign: 'left', cellWidth: 120 },
          2: { halign: 'right', cellWidth: 30 }
        },
        margin: { left: margin, right: margin, bottom: footerHeight },
        tableWidth: 'wrap',
        pageBreak: 'auto',
        showHead: 'everyPage',
        didDrawPage: (data) => {
          // Add footer to each page that contains service charges table
          addFooter(data.pageNumber, doc.getNumberOfPages());
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 8;
    }

    // FORCE NEW PAGE for summary if not enough space
    if (yPosition + 80 > pageHeight - footerHeight) {
      doc.addPage();
      yPosition = margin;
    }

    // Add some space before summary
    yPosition += 8;

    // REDESIGNED AMOUNT DUE SUMMARY - Right aligned with margin
    const summaryX = pageWidth - margin - 85; // Added more margin from right
    const summaryWidth = 80; // Slightly wider

    // Calculate amounts
    const baseAmount = invoice.totalBasePrice;
    const discountAmount = (baseAmount * (invoice.discount || 0)) / 100;
    const discountedAmount = baseAmount - discountAmount;
    const finalGST = calculateGST(discountedAmount, customer);

    // Content area - clean layout without background
    doc.setTextColor(0, 0, 0);
    let summaryY = yPosition;

    // Parts subtotal
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const partsTotal = invoice.parts.reduce((sum, part) => sum + part.totalPrice, 0);
    doc.text('Parts Total:', summaryX, summaryY);
    doc.text(`Rs ${partsTotal.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
    summaryY += 7;

    // Service charges total (if any)
    if (invoice.serviceCharges && invoice.serviceCharges.length > 0) {
      doc.text('Services Total:', summaryX, summaryY);
      doc.text(`Rs ${invoice.totalServiceCharges.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
      summaryY += 7;
      
      // Combined subtotal
      doc.setFont('helvetica', 'bold');
      doc.text('Subtotal:', summaryX, summaryY);
      doc.text(`Rs ${baseAmount.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      summaryY += 7;
    }

    // Discount (if applicable)
    if (invoice.discount > 0) {
      doc.setTextColor(34, 197, 94); // Green color for discount
      doc.text(`Discount (${invoice.discount}%):`, summaryX, summaryY);
      doc.text(`-Rs ${discountAmount.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
      doc.setTextColor(0, 0, 0); // Reset to black
      summaryY += 7;
      
      // Subtotal after discount
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Subtotal after discount:', summaryX, summaryY);
      doc.text(`Rs ${discountedAmount.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
      summaryY += 7;
    }

    // Separator line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(summaryX, summaryY, summaryX + summaryWidth, summaryY);
    summaryY += 5;

    // GST Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TAX BREAKDOWN:', summaryX, summaryY);
    summaryY += 6;
    
    // GST Details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);
    
    if (invoice.gstType === 'INTRASTATE') {
      doc.text('CGST (9%):', summaryX + 5, summaryY);
      doc.text(`Rs ${finalGST.cgst.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
      summaryY += 5;
      doc.text('SGST (9%):', summaryX + 5, summaryY);
      doc.text(`Rs ${finalGST.sgst.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
      summaryY += 5;
    } else {
      doc.text('IGST (18%):', summaryX + 5, summaryY);
      doc.text(`Rs ${finalGST.igst.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
      summaryY += 5;
    }

    // Total GST
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Total GST:', summaryX, summaryY);
    doc.text(`Rs ${invoice.totalGST.toFixed(2)}`, summaryX + summaryWidth, summaryY, { align: 'right' });
    summaryY += 10;

    // Final total - NO RED HIGHLIGHTING, just border
    doc.setDrawColor(79, 70, 229); // Primary color border
    doc.setLineWidth(1);
    doc.rect(summaryX - 3, summaryY - 3, summaryWidth + 6, 12);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('AMOUNT DUE:', summaryX, summaryY + 3);
    doc.text(`Rs ${invoice.finalPrice.toFixed(2)}`, summaryX + summaryWidth, summaryY + 3, { align: 'right' });

    // Payment Terms
    yPosition = summaryY + 20;

    // Check if we need new page for payment terms
    if (yPosition + 40 > pageHeight - footerHeight) {
      doc.addPage();
      yPosition = margin;
    }

    // Payment Terms
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT TERMS & CONDITIONS', margin + 4, yPosition + 4);

    yPosition += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const paymentTerms = [
      `• Payment Terms: ${customer.payment_terms}`,
      `• Payment is due by ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`,
      '• Late payment may incur additional charges',
      '• Please reference invoice number in all payments'
    ];

    paymentTerms.forEach(term => {
      yPosition = addWrappedText(term, margin + 4, yPosition, pageWidth - 2 * margin - 8, 8);
      yPosition += 1;
    });

    // Notes section
    if (invoice.notes && invoice.notes.trim()) {
      yPosition += 6;
      
      // Check if we need new page for notes
      if (yPosition + 20 > pageHeight - footerHeight) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFillColor(...lightGray);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 6, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTES', margin + 4, yPosition + 4);

      yPosition += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      yPosition = addWrappedText(invoice.notes, margin + 4, yPosition, pageWidth - 2 * margin - 8, 8);
    }

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i, totalPages);
    }

    // Save the PDF
    const fileName = `Invoice_${invoice.invoiceNumber}_${customer.company_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(fileName);
  }

  static async generatePartsListPDF(parts: any[], customer: any, totalVolume: number): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    let yPosition = margin;

    // Colors
    const colors = {
      primary: [37, 99, 235],      // Modern blue
      dark: [31, 41, 55],          // Dark gray
      light: [249, 250, 251],      // Very light gray
      border: [229, 231, 235]      // Light border
    };

    // HEADER
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Company Information
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY_INFO.name, pageWidth / 2, 12, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`GSTN: ${COMPANY_INFO.gstn} | Phone: +91-8629044664 | Email: sushant@iamrapid.com`, pageWidth / 2, 20, { align: 'center' });
    doc.text('www.iamrapid.com', pageWidth / 2, 27, { align: 'center' });

    yPosition = 45;

    // TITLE
    doc.setTextColor(...colors.dark);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PARTS LIST', pageWidth / 2, yPosition, { align: 'center' });
    
    // Decorative line under title
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(1.5);
    doc.line(pageWidth / 2 - 30, yPosition + 3, pageWidth / 2 + 30, yPosition + 3);
    
    yPosition += 15;

    // DATE
    doc.setTextColor(...colors.dark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // CUSTOMER INFORMATION
    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CUSTOMER INFORMATION', margin + 5, yPosition + 4);

    yPosition += 10;

    // Customer details in a card
    const customerCardHeight = 25;
    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, customerCardHeight, 2, 2, 'F');
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, customerCardHeight, 2, 2, 'S');

    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(customer.company_name, margin + 8, yPosition + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Contact: ${customer.contact_person}`, margin + 8, yPosition + 15);
    doc.text(`Email: ${customer.email}`, margin + 8, yPosition + 20);
    
    // Right column
    const rightCol = margin + (pageWidth - 2 * margin) / 2 + 8;
    doc.text(`Phone: ${customer.phone}`, rightCol, yPosition + 15);
    if (customer.gstn) {
      doc.text(`GSTN: ${customer.gstn}`, rightCol, yPosition + 20);
    }

    yPosition += customerCardHeight + 15;

    // PARTS TABLE HEADER
    doc.setFillColor(...colors.primary);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PARTS BREAKDOWN', margin + 5, yPosition + 5);

    yPosition += 12;

    // TABLE
    const tableHeaders = [
      'S.No',
      'Part Name',
      'Volume (cm³)',
      'Quantity',
      'Total Volume (cm³)'
    ];

    const tableData = parts.map((part, index) => [
      (index + 1).toString(),
      part.fileName,
      part.volume.toFixed(2),
      part.quantity.toString(),
      (part.volume * part.quantity).toFixed(2)
    ]);

    // Add total row
    tableData.push([
      '',
      'TOTAL',
      '',
      parts.reduce((sum, part) => sum + part.quantity, 0).toString(),
      totalVolume.toFixed(2)
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: 3
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 2,
        valign: 'middle',
        lineColor: colors.border,
        lineWidth: 0.1
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 80 },
        2: { halign: 'right', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 30 }
      },
      margin: { left: margin, right: margin },
      tableWidth: 'wrap',
      didDrawCell: (data) => {
        // Style the total row
        if (data.row.index === tableData.length - 1 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold';
          if (data.column.index === 1) {
            doc.setFillColor(...colors.light);
          }
        }
      }
    });

    // Get final Y position
    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // SUMMARY
    const summaryX = pageWidth - margin - 80;
    const summaryWidth = 75;

    doc.setFillColor(...colors.light);
    doc.roundedRect(summaryX - 5, yPosition - 5, summaryWidth + 10, 25, 2, 2, 'F');
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(summaryX - 5, yPosition - 5, summaryWidth + 10, 25, 2, 2, 'S');

    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SUMMARY', summaryX, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total Parts: ${parts.length}`, summaryX, yPosition + 6);
    doc.text(`Total Quantity: ${parts.reduce((sum, part) => sum + part.quantity, 0)}`, summaryX, yPosition + 12);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Volume: ${totalVolume.toFixed(2)} cm³`, summaryX, yPosition + 18);

    // FOOTER
    const footerY = pageHeight - 20;
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    
    doc.setTextColor(...colors.primary);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This is a computer-generated parts list', pageWidth / 2, footerY + 8, { align: 'center' });

    // Save the PDF
    const fileName = `Parts_List_${customer.company_name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  static async generateJobWorkPDF(order: Order, technologiesData?: any): Promise<void> {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const footerHeight = 30;
    let yPosition = margin;

    // Colors
    const colors = {
      primary: [37, 99, 235],      // Modern blue
      dark: [31, 41, 55],          // Dark gray
      light: [249, 250, 251],      // Very light gray
      border: [229, 231, 235],     // Light border
      warning: [245, 158, 11]      // Orange for production
    };

    // Helper function to add footer
    const addFooter = (pageNumber: number, totalPages: number) => {
      const footerY = pageHeight - 25;
      
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      doc.setTextColor(...colors.primary);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('PRODUCTION DEPARTMENT - CONFIDENTIAL', pageWidth / 2, footerY + 8, { align: 'center' });

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text('This document contains no pricing or customer information', pageWidth / 2, footerY + 16, { align: 'center' });

      doc.setTextColor(...colors.dark);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, footerY + 16, { align: 'right' });
    };

    // Helper function to check page break
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - footerHeight) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // HEADER - Production focused
    doc.setFillColor(...colors.warning);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTION JOB WORK', pageWidth / 2, 12, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${COMPANY_INFO.name} - Manufacturing Department`, pageWidth / 2, 22, { align: 'center' });
    doc.text('CONFIDENTIAL - FOR PRODUCTION USE ONLY', pageWidth / 2, 29, { align: 'center' });

    yPosition = 45;

    // JOB WORK TITLE
    doc.setTextColor(...colors.dark);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('JOB WORK ORDER', pageWidth / 2, yPosition, { align: 'center' });
    
    // Decorative line
    doc.setDrawColor(...colors.warning);
    doc.setLineWidth(2);
    doc.line(pageWidth / 2 - 40, yPosition + 3, pageWidth / 2 + 40, yPosition + 3);
    
    yPosition += 20;

    // ORDER DETAILS CARD
    const cardHeight = 25;
    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, cardHeight, 2, 2, 'F');
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, cardHeight, 2, 2, 'S');

    doc.setTextColor(...colors.warning);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER INFORMATION', margin + 5, yPosition + 7);

    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Left column
    doc.text(`Order Number: ${order.orderNumber}`, margin + 8, yPosition + 15);
    doc.text(`Customer ID: ${order.customerId}`, margin + 8, yPosition + 20);
    
    // Right column
    const rightCol = margin + (pageWidth - 2 * margin) / 2 + 8;
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, rightCol, yPosition + 15);
    doc.text(`Status: ${order.status}`, rightCol, yPosition + 20);

    yPosition += cardHeight + 15;

    // IMPORTANT NOTICE
    doc.setFillColor(255, 243, 205); // Light yellow
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 15, 2, 2, 'F');
    doc.setDrawColor(245, 158, 11); // Orange border
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 15, 2, 2, 'S');

    doc.setTextColor(146, 64, 14); // Dark orange
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠️ PRODUCTION NOTICE:', margin + 8, yPosition + 6);
    doc.setFont('helvetica', 'normal');
    doc.text('This document contains NO pricing information. Customer details are limited to ID only.', margin + 8, yPosition + 11);

    yPosition += 20;

    // Check page break before parts table
    checkPageBreak(80);

    // PARTS TABLE HEADER
    doc.setFillColor(...colors.warning);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PARTS TO MANUFACTURE', margin + 5, yPosition + 5);

    yPosition += 12;

    // PARTS TABLE
    const tableHeaders = [
      'S.No',
      'Part Name',
      'Technology',
      'Material',
      'Volume (cm³)',
      'Qty',
      'Total Vol.',
      'Notes'
    ];

    const tableData = order.parts.map((part, index) => {
      // Get full technology and material names
      let technologyDisplay = part.technology || 'Not specified';
      let materialDisplay = part.material || 'Not specified';
      
      if (technologiesData && part.technology && part.material) {
        const tech = technologiesData.technologies[part.technology];
        if (tech) {
          technologyDisplay = tech.name;
          const material = tech.materials[part.material];
          if (material) {
            materialDisplay = material.name;
          }
        }
      }
      
      return [
        (index + 1).toString(),
        part.fileName,
        technologyDisplay,
        materialDisplay,
        part.volume.toFixed(2),
        part.quantity.toString(),
        (part.volume * part.quantity).toFixed(2),
        part.comments || 'None'
      ];
    });

    // Create parts table
    doc.autoTable({
      startY: yPosition,
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: colors.warning,
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        cellPadding: 2
      },
      bodyStyles: {
        fontSize: 6,
        cellPadding: 1.5,
        valign: 'middle',
        lineColor: colors.border,
        lineWidth: 0.1,
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        }
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'left', cellWidth: 35 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'center', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 18 },
        5: { halign: 'center', cellWidth: 12 },
        6: { halign: 'right', cellWidth: 18 },
        7: { halign: 'left', cellWidth: 35 }
      },
      margin: { left: margin, right: margin, bottom: footerHeight },
      tableWidth: 'wrap',
      pageBreak: 'auto',
      showHead: 'everyPage',
      didDrawPage: (data) => {
        addFooter(data.pageNumber, doc.getNumberOfPages());
      }
    });

    yPosition = (doc as any).lastAutoTable.finalY;

    // SERVICE CHARGES (if any) - Production relevant only
    if (order.serviceCharges && order.serviceCharges.length > 0) {
      yPosition += 10;
      
      checkPageBreak(60);

      doc.setFillColor(...colors.warning);
      doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 8, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ADDITIONAL SERVICES REQUIRED', margin + 5, yPosition + 5);

      yPosition += 12;

      const serviceHeaders = ['S.No', 'Service Description', 'Instructions'];
      const serviceData = order.serviceCharges.map((charge, index) => [
        (index + 1).toString(),
        charge.description,
        'Follow standard procedure'
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [serviceHeaders],
        body: serviceData,
        theme: 'grid',
        headStyles: {
          fillColor: colors.warning,
          textColor: [255, 255, 255],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          cellPadding: 2
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2,
          valign: 'middle',
          lineColor: colors.border,
          lineWidth: 0.1
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          1: { halign: 'left', cellWidth: 100 },
          2: { halign: 'left', cellWidth: 65 }
        },
        margin: { left: margin, right: margin, bottom: footerHeight },
        tableWidth: 'wrap',
        pageBreak: 'auto',
        showHead: 'everyPage',
        didDrawPage: (data) => {
          addFooter(data.pageNumber, doc.getNumberOfPages());
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY;
    }

    // PRODUCTION SUMMARY
    yPosition += 15;
    
    checkPageBreak(40);

    const summaryHeight = 35;
    doc.setFillColor(...colors.light);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, summaryHeight, 2, 2, 'F');
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, summaryHeight, 2, 2, 'S');

    doc.setTextColor(...colors.warning);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTION SUMMARY', margin + 8, yPosition + 8);

    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const totalParts = order.parts.length;
    const totalQuantity = order.parts.reduce((sum, part) => sum + part.quantity, 0);
    const totalVolume = order.parts.reduce((sum, part) => sum + (part.volume * part.quantity), 0);
    
    doc.text(`Total Parts: ${totalParts}`, margin + 8, yPosition + 16);
    doc.text(`Total Quantity: ${totalQuantity}`, margin + 8, yPosition + 22);
    doc.text(`Total Volume: ${totalVolume.toFixed(2)} cm³`, margin + 8, yPosition + 28);
    
    // Right side - Production checklist
    const checklistRightCol = margin + (pageWidth - 2 * margin) / 2 + 8;
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTION CHECKLIST:', checklistRightCol, yPosition + 16);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const checklistItems = [
      '☐ Material verified',
      '☐ Technology confirmed',
      '☐ Quality check passed',
      '☐ Packaging completed'
    ];
    
    checklistItems.forEach((item, index) => {
      doc.text(item, checklistRightCol, yPosition + 28 + (index * 8));
    });

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      addFooter(i, totalPages);
    }

    // Save the PDF
    const fileName = `JobWork_${order.orderNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}