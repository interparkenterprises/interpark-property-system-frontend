import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Property, ArrearsResponse } from '@/types';

/**
 * Export Arrears Report to PDF
 * @param property - Property data
 * @param arrearsData - Arrears data response
 * @returns Promise<void>
 */
export async function exportArrearsToPDF(
  property: Property,
  arrearsData: ArrearsResponse
): Promise<void> {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Add letterhead (top)
  try {
    const topLetterheadUrl = 'https://www.genspark.ai/api/files/s/a8WiMPx8';
    const response = await fetch(topLetterheadUrl);
    if (response.ok) {
      const blob = await response.blob();
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onloadend = () => {
          const base64data = reader.result as string;
          doc.addImage(base64data, 'PNG', 10, 10, pageWidth - 20, 25);
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.error('Error loading letterhead:', error);
    // Fallback text header
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 178);
    doc.text('INTERPARK ENTERPRISES LIMITED', pageWidth / 2, 20, { align: 'center' });
  }

  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 102, 178);
  doc.text('ARREARS REPORT', pageWidth / 2, 45, { align: 'center' });

  // Property Info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Property: ${property.name}`, 14, 55);
  doc.text(
    `Date Generated: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
    14,
    62
  );

  // Table data with numbering
  const tableData = arrearsData.arrears.map((item, index) => [
    (index + 1).toString(), // Numbering 1, 2, 3, etc.
    item.tenantName,
    item.unitType,
    item.unitNo,
    item.floor,
    item.invoiceNumber,
    item.invoiceType === 'RENT' ? 'Rent' : `Bill (${item.billType})`,
    `Ksh ${item.expectedAmount.toLocaleString()}`,
    `Ksh ${item.paidAmount.toLocaleString()}`,
    `Ksh ${item.balance.toLocaleString()}`,
    item.status === 'UNPAID' ? 'Unpaid' : 'Partial',
  ]);

  // Calculate totals for footer
  const totalExpected = arrearsData.summary.totalExpected;
  const totalPaid = arrearsData.summary.totalPaid;
  const totalArrears = arrearsData.summary.totalArrears;

  // Create footer row - exactly like the image
  const footerRow = [
    '', // Empty for the numbering column
    '', // Empty for Tenant Name
    '', // Empty for Unit Type
    '', // Empty for Unit No
    '', // Empty for Floor
    '', // Empty for Invoice No
    'Total', // "Total" text in the Type column
    `Ksh ${totalExpected.toLocaleString()}`, // Total Expected
    `Ksh ${totalPaid.toLocaleString()}`, // Total Paid
    `Ksh ${totalArrears.toLocaleString()}`, // Total Balance (Arrears)
    '', // Empty for Status
  ];

  // Generate table using autoTable with footer
  autoTable(doc, {
    startY: 70,
    head: [
      [
        '#',
        'Tenant Name',
        'Unit Type',
        'Unit No',
        'Floor',
        'Invoice No',
        'Type',
        'Expected',
        'Paid',
        'Balance',
        'Status',
      ],
    ],
    body: tableData,
    foot: [footerRow], // Add the footer row
    theme: 'striped',
    headStyles: {
      fillColor: [0, 102, 178],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [0, 0, 0],
    },
    footStyles: {
      fontSize: 8,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fillColor: [249, 249, 249], // Light gray background for footer
    },
    alternateRowStyles: {
      fillColor: [249, 249, 249],
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 15 },
      5: { cellWidth: 30 },
      6: { cellWidth: 30, halign: 'center' },
      7: { cellWidth: 25, halign: 'right' },
      8: { cellWidth: 25, halign: 'right' },
      9: { cellWidth: 25, halign: 'right', fontStyle: 'bold', textColor: [220, 53, 69] },
      10: { cellWidth: 20, halign: 'center' },
    },
    // Special styling for footer cells
    didDrawCell: (data) => {
      // If this is a footer cell
      if (data.section === 'foot') {
        // Style for "Total" cell (column 6)
        if (data.column.index === 6) {
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
        }
        // Style for total amount cells (columns 7, 8, 9)
        if ([7, 8, 9].includes(data.column.index)) {
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
        }
      }
    },
    margin: { left: 14, right: 14 },
    styles: { overflow: 'linebreak' },
    // Add a line above the footer for visual separation
    didParseCell: (data) => {
      if (data.section === 'foot') {
        data.cell.styles.lineWidth = 0.5;
        data.cell.styles.lineColor = [150, 150, 150];
        data.cell.styles.valign = 'middle';
      }
    },
  });

  // Get the final Y position of the table
  const finalY = (doc as any).lastAutoTable?.finalY ?? 70;

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Use 10pt for footer company name, 8pt for page number
    doc.setFontSize(10);
    doc.setTextColor(0, 102, 178); // Blue color for company name
    doc.text('INTERPARK ENTERPRISES LIMITED', pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0); // Black color for page number
    doc.text(`Page ${i}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Generate filename
  const filename = `${property.name.replace(/\s+/g, '_')}_Arrears_Report_${
    new Date().toISOString().split('T')[0]
  }.pdf`;

  // Save the PDF
  doc.save(filename);
}