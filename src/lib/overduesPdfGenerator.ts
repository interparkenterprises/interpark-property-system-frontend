import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Property, OverdueTenantsResponse } from '@/types';

// Helper function to load and add letterhead image
const loadLetterheadImage = async (
  doc: jsPDF,
  pageWidth: number
): Promise<boolean> => {
  try {
    // Use PNG for better quality
    const topLetterheadUrl = '/letterhead-02.png';
    
    const response = await fetch(topLetterheadUrl);
    
    if (!response.ok) {
      return false;
    }
    
    const blob = await response.blob();
    
    const reader = new FileReader();
    
    const base64data = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    // Get original dimensions
    const img = new Image();
    const imgDimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = base64data;
    });
    
    // Calculate proportional dimensions
    const maxWidth = pageWidth - 20;
    const maxHeight = 35; // Slightly taller than before
    
    let finalWidth = maxWidth;
    let finalHeight = (imgDimensions.height / imgDimensions.width) * maxWidth;
    
    if (finalHeight > maxHeight) {
      finalHeight = maxHeight;
      finalWidth = (imgDimensions.width / imgDimensions.height) * maxHeight;
    }
    
    const xPosition = (pageWidth - finalWidth) / 2;
    
    // Use 'PNG' format and add compression option
    doc.addImage(base64data, 'PNG', xPosition, 10, finalWidth, finalHeight, undefined, 'FAST');
    
    return true;
  } catch (error) {
    console.error('Error loading letterhead:', error);
    return false;
  }
};

export const exportOverduesToPDF = async (
  property: Property,
  overdueData: OverdueTenantsResponse,
  filterDays: number | null,
  filteredTenants: any[]
) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.width;

  let yPosition = 10;

  // Add letterhead
  const letterheadLoaded = await loadLetterheadImage(doc, pageWidth);

  if (letterheadLoaded) {
    yPosition = 40;
  } else {
    // Fallback text header
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 178);

    doc.text(
      'INTERPARK ENTERPRISES LIMITED',
      pageWidth / 2,
      20,
      { align: 'center' }
    );

    yPosition = 30;
  }

  // Title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');

  doc.text(
    'OVERDUE TENANTS REPORT',
    pageWidth / 2,
    yPosition + 10,
    { align: 'center' }
  );

  // Property and Date Info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  doc.text(`Property: ${property.name}`, 20, yPosition + 25);

  doc.text(`Address: ${property.address}`, 20, yPosition + 32);

  doc.text(
    `Report Date: ${new Date().toLocaleDateString('en-US')}`,
    20,
    yPosition + 39
  );

  if (filterDays) {
    doc.text(
      `Filter: ${filterDays} Days Overdue`,
      20,
      yPosition + 46
    );

    doc.text(
      `Report Period: Last ${filterDays} days`,
      20,
      yPosition + 53
    );
  } else {
    doc.text(
      `Filter: All Overdue Tenants`,
      20,
      yPosition + 46
    );

    doc.text(
      `Report Period: Complete history`,
      20,
      yPosition + 53
    );
  }

  // Summary section
  const summaryStartY = filterDays
    ? yPosition + 60
    : yPosition + 53;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');

  doc.text('SUMMARY', 20, summaryStartY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const summaryData = [
    [
      'Total Overdue Tenants:',
      overdueData.summary.totalOverdueTenants.toString(),
    ],
    [
      'Total Overdue Amount:',
      `Ksh ${overdueData.summary.totalOverdueAmount.toLocaleString()}`,
    ],
    [
      'Average Overdue Amount:',
      `Ksh ${overdueData.summary.averageOverdueAmount.toLocaleString()}`,
    ],
    ['Filtered Tenants:', filteredTenants.length.toString()],
  ];

  autoTable(doc, {
    startY: summaryStartY + 5,

    head: [['Metric', 'Value']],

    body: summaryData,

    theme: 'striped',

    headStyles: {
      fillColor: [220, 38, 38],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },

    styles: {
      fontSize: 10,
      cellPadding: 5,
    },

    columnStyles: {
      0: {
        cellWidth: 80,
        fontStyle: 'bold',
      },

      1: {
        cellWidth: 80,
      },
    },

    margin: {
      left: 20,
    },
  });

  // Get the Y position after summary table
  let finalY = (doc as any).lastAutoTable.finalY + 10;

  // Overdue Tenants Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');

  doc.text('OVERDUE TENANTS DETAILS', 20, finalY);

  finalY += 5;

  if (filteredTenants.length > 0) {
    const tableData = filteredTenants.map((tenant: any) => {
      const paymentsBehind =
        tenant.paymentSummary?.nextPayment?.paymentsBehind || 0;

      const overdueDays = paymentsBehind * 30;

      const outstandingBalance =
        tenant.paymentSummary?.paymentHistory?.outstandingBalance || 0;

      const nextDueDate =
        tenant.paymentSummary?.nextPayment?.dueDateFormatted ||
        tenant.paymentSummary?.nextPayment?.dueDate ||
        '-';

      const unitLabel =
        [tenant.unit?.type, tenant.unit?.unitNo]
          .filter(Boolean)
          .join(' ') ||
        tenant.unit?.unitType ||
        'Unit';

      return [
        tenant.fullName,
        unitLabel,
        tenant.contact || tenant.email || 'No contact',
        `${paymentsBehind} month(s)`,
        `${overdueDays} days`,
        `Ksh ${outstandingBalance.toLocaleString()}`,
        nextDueDate,
      ];
    });

    autoTable(doc, {
      startY: finalY,

      head: [
        [
          'Tenant Name',
          'Unit',
          'Contact',
          'Payments Behind',
          'Overdue Days',
          'Outstanding Balance',
          'Next Due Date',
        ],
      ],

      body: tableData,

      theme: 'striped',

      headStyles: {
        fillColor: [220, 38, 38],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },

      styles: {
        fontSize: 9,
        cellPadding: 4,
      },

      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
        6: { cellWidth: 25 },
      },

      margin: {
        left: 20,
        right: 20,
      },
    });

    finalY = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);

    doc.text(
      'No overdue tenants found for the selected filter.',
      20,
      finalY + 10
    );
  }

  // Footer
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);

    doc.text(
      `Generated on ${new Date().toLocaleString()} - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `Overdue_Tenants_Report_${property.name.replace(
    /\s+/g,
    '_'
  )}_${new Date().toISOString().split('T')[0]}.pdf`;

  doc.save(filename);
};