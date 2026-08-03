// lib/arrearsPdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Property, ArrearsResponse, OverdueTenantsResponse, Tenant } from '@/types';

// Helper function to format currency
function formatCurrency(value: number): string {
  if (value >= 1000000000) {
    return `Ksh ${(value / 1000000000).toFixed(2)}B`;
  } else if (value >= 1000000) {
    return `Ksh ${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `Ksh ${(value / 1000000).toFixed(1)}M`;
  }
  return `Ksh ${value.toLocaleString()}`;
}

// Helper function to get full currency display
function getFullCurrencyDisplay(value: number): string {
  return `Ksh ${value.toLocaleString()}`;
}

// Helper function to load letterhead
const loadLetterheadImage = async (
  doc: jsPDF,
  pageWidth: number
): Promise<boolean> => {
  try {
    const topLetterheadUrl = '/letterhead-02.png';
    const response = await fetch(topLetterheadUrl);
    
    if (!response.ok) return false;
    
    const blob = await response.blob();
    const reader = new FileReader();
    
    const base64data = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    const img = new Image();
    const imgDimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = base64data;
    });
    
    const maxWidth = pageWidth - 20;
    const maxHeight = 35;
    
    let finalWidth = maxWidth;
    let finalHeight = (imgDimensions.height / imgDimensions.width) * maxWidth;
    
    if (finalHeight > maxHeight) {
      finalHeight = maxHeight;
      finalWidth = (imgDimensions.width / imgDimensions.height) * maxHeight;
    }
    
    const xPosition = (pageWidth - finalWidth) / 2;
    doc.addImage(base64data, 'PNG', xPosition, 10, finalWidth, finalHeight, undefined, 'FAST');
    
    return true;
  } catch (error) {
    console.error('Error loading letterhead:', error);
    return false;
  }
};

// Helper function to draw a horizontal line
const drawLine = (doc: jsPDF, y: number, pageWidth: number) => {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, y, pageWidth - 14, y);
};

// Helper function to add section header
const addSectionHeader = (doc: jsPDF, title: string, y: number, pageWidth: number): number => {
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, y);
  
  // Add a subtle underline
  drawLine(doc, y + 3, pageWidth);
  
  return y + 10;
};

// Helper function to add info box
const addInfoBox = (doc: jsPDF, items: { label: string; value: string }[], y: number, pageWidth: number): number => {
  const startX = 14;
  const boxWidth = pageWidth - 28;
  const rowHeight = 8;
  const padding = 4;
  
  // Draw background box
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(startX, y - 2, boxWidth, (items.length * (rowHeight + padding)) + 4, 2, 2, 'FD');
  
  items.forEach((item, index) => {
    const yPos = y + (index * (rowHeight + padding)) + 2;
    
    // Label
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.label}:`, startX + 6, yPos + 5);
    
    // Value
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    const labelWidth = doc.getTextWidth(`${item.label}: `);
    doc.text(item.value, startX + 6 + labelWidth + 4, yPos + 5);
  });
  
  return y + (items.length * (rowHeight + padding)) + 6;
};

/**
 * Export Combined Arrears Report to PDF
 * Includes both regular arrears and overdue tenants
 */
export async function exportCombinedArrearsToPDF(
  property: Property,
  arrearsData: ArrearsResponse | null,
  overdueData: OverdueTenantsResponse | null,
  filterDays: number | null = null,
  filteredOverdueTenants: Tenant[] = []
): Promise<void> {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Add letterhead
  await loadLetterheadImage(doc, pageWidth);

  // ============================================
  // HEADER SECTION
  // ============================================
  let currentY = 48;

  // Main Title
  doc.setFontSize(22);
  doc.setTextColor(0, 51, 102);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPREHENSIVE ARREARS REPORT', pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Subtitle / Divider
  doc.setDrawColor(0, 51, 102);
  doc.setLineWidth(0.8);
  doc.line(60, currentY, pageWidth - 60, currentY);
  currentY += 8;

  // Property Info Box
  const infoItems = [
    { label: 'Property', value: property.name },
    { label: 'Date Generated', value: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })},
  ];

  if (filterDays) {
    infoItems.push({ label: 'Filter Applied', value: `${filterDays} days overdue or more` });
  }

  currentY = addInfoBox(doc, infoItems, currentY, pageWidth);
  currentY += 10;

  // ============================================
  // SECTION 1: ARREARS SUMMARY
  // ============================================
  if (arrearsData) {
    currentY = addSectionHeader(doc, 'SECTION 1: ARREARS SUMMARY', currentY, pageWidth);

    // Summary Cards in a 2x2 grid
    const summaryCards = [
      { label: 'Total Arrears', value: getFullCurrencyDisplay(arrearsData.summary.totalArrears), color: [220, 53, 69] },
      { label: 'Total Expected', value: getFullCurrencyDisplay(arrearsData.summary.totalExpected), color: [0, 123, 255] },
      { label: 'Total Paid', value: getFullCurrencyDisplay(arrearsData.summary.totalPaid), color: [40, 167, 69] },
      { label: 'Total Items', value: arrearsData.summary.itemCount.toString(), color: [108, 117, 125] },
    ];

    const cardWidth = (pageWidth - 44) / 4;
    const cardHeight = 35;
    const cardSpacing = 6;

    summaryCards.forEach((card, index) => {
      const x = 14 + (index * (cardWidth + cardSpacing));
      const y = currentY;

      // Card background
      doc.setFillColor(248, 249, 250);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

      // Top color bar
      doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      doc.rect(x, y, cardWidth, 3, 'F');

      // Label
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(card.label, x + (cardWidth / 2), y + 12, { align: 'center' });

      // Value
      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, x + (cardWidth / 2), y + 26, { align: 'center' });
    });

    currentY += cardHeight + 15;

    // ============================================
    // SECTION 2: ARREARS DETAILS BY TENANT
    // ============================================
    if (arrearsData.arrears.length > 0) {
      currentY = addSectionHeader(doc, 'SECTION 2: ARREARS DETAILS BY TENANT', currentY, pageWidth);

      // Group arrears by tenant
      const groupedArrears = arrearsData.arrears.reduce((acc, item) => {
        const key = item.tenantId;
        if (!acc[key]) {
          acc[key] = {
            tenantName: item.tenantName,
            tenantContact: item.tenantContact,
            unitName: `${item.unitType} ${item.unitNo}`,
            totalArrears: 0,
            totalPaid: 0,
            items: [],
          };
        }
        acc[key].items.push(item);
        acc[key].totalArrears += item.balance;
        acc[key].totalPaid += item.paidAmount;
        return acc;
      }, {} as Record<string, any>);

      const groupedArray = Object.values(groupedArrears).sort((a, b) => b.totalArrears - a.totalArrears);

      // Create table data for arrears by tenant
      const tableData = groupedArray.flatMap((group, index) => {
        const rows: any[] = [];
        
        // Header row for this tenant
        rows.push([
          { content: `${index + 1}`, styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } },
          { content: group.tenantName, styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } },
          { content: group.unitName, styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } },
          { content: getFullCurrencyDisplay(group.totalPaid), styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } },
          { content: getFullCurrencyDisplay(group.totalArrears), styles: { fontStyle: 'bold', fillColor: [240, 244, 248], textColor: [220, 53, 69] } },
          { content: `${group.items.length} invoice${group.items.length > 1 ? 's' : ''}`, styles: { fontStyle: 'bold', fillColor: [240, 244, 248] } },
        ]);

        // Detail rows for each invoice
        group.items.forEach((item: any) => {
          rows.push([
            '',
            '',
            `  ${item.invoiceNumber} (${item.invoiceType === 'RENT' ? 'Rent' : item.billType})`,
            getFullCurrencyDisplay(item.paidAmount),
            getFullCurrencyDisplay(item.balance),
            item.status,
          ]);
        });

        return rows;
      });

      if (tableData.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [
            ['#', 'Tenant', 'Unit / Invoice', 'Paid', 'Balance', 'Status'],
          ],
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: [0, 51, 102],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
          },
          styles: {
            fontSize: 8,
            cellPadding: 4,
          },
          columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 30 },
            2: { cellWidth: 55 },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 20, halign: 'center' },
          },
          margin: { left: 14, right: 14 },
          rowPageBreak: 'auto',
          tableWidth: 'auto',
        });

        currentY = (doc as any).lastAutoTable.finalY + 12;
      }
    }
  }

  // ============================================
  // SECTION 3: OVERDUE TENANTS
  // ============================================
  if (overdueData && filteredOverdueTenants.length > 0) {
    // Check if we need a new page
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }

    currentY = addSectionHeader(doc, 'SECTION 3: OVERDUE TENANTS', currentY, pageWidth);

    // Overdue Summary Cards
    const overdueSummaryCards = [
      { label: 'Total Overdue Tenants', value: overdueData.summary.totalOverdueTenants.toString(), color: [220, 53, 69] },
      { label: 'Total Overdue Amount', value: getFullCurrencyDisplay(overdueData.summary.totalOverdueAmount), color: [220, 53, 69] },
      { label: 'Average Overdue', value: getFullCurrencyDisplay(overdueData.summary.averageOverdueAmount), color: [255, 193, 7] },
      { label: 'Filter Applied', value: filterDays ? `${filterDays} days+` : 'All', color: [108, 117, 125] },
    ];

    const cardWidth = (pageWidth - 44) / 4;
    const cardHeight = 30;
    const cardSpacing = 6;

    overdueSummaryCards.forEach((card, index) => {
      const x = 14 + (index * (cardWidth + cardSpacing));
      const y = currentY;

      // Card background
      doc.setFillColor(248, 249, 250);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

      // Top color bar
      doc.setFillColor(card.color[0], card.color[1], card.color[2]);
      doc.rect(x, y, cardWidth, 3, 'F');

      // Label
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(card.label, x + (cardWidth / 2), y + 10, { align: 'center' });

      // Value
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, x + (cardWidth / 2), y + 23, { align: 'center' });
    });

    currentY += cardHeight + 15;

    // Overdue Tenants Details Table
    const overdueTableData = filteredOverdueTenants.map((tenant: any) => {
      const paymentsBehind = tenant.paymentSummary?.nextPayment?.paymentsBehind || 0;
      const overdueDays = tenant.overdueDetails?.daysOverdue || paymentsBehind * 30;
      const outstandingBalance = tenant.paymentSummary?.paymentHistory?.outstandingBalance || 0;
      const nextDueDate = tenant.paymentSummary?.nextPayment?.dueDateFormatted ||
                         tenant.paymentSummary?.nextPayment?.dueDate || '-';
      const unitLabel = [tenant.unit?.type, tenant.unit?.unitNo].filter(Boolean).join(' ') || 
                       tenant.unit?.unitType || 'Unit';

      return [
        tenant.fullName,
        unitLabel,
        tenant.contact || tenant.email || 'No contact',
        `${paymentsBehind}`,
        `${overdueDays} days`,
        getFullCurrencyDisplay(outstandingBalance),
        nextDueDate,
      ];
    });

    if (overdueTableData.length > 0) {
      autoTable(doc, {
        startY: currentY,
        head: [
          ['Tenant', 'Unit', 'Contact', 'Periods Behind', 'Overdue Days', 'Outstanding', 'Next Due'],
        ],
        body: overdueTableData,
        theme: 'striped',
        headStyles: {
          fillColor: [220, 53, 69],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'center',
        },
        styles: {
          fontSize: 8,
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 22 },
          2: { cellWidth: 25 },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 28, halign: 'right' },
          6: { cellWidth: 22, halign: 'center' },
        },
        margin: { left: 14, right: 14 },
        rowPageBreak: 'auto',
        tableWidth: 'auto',
      });

      currentY = (doc as any).lastAutoTable.finalY + 12;
    }
  }

  // ============================================
  // SECTION 4: OVERDUE CATEGORIES DISTRIBUTION
  // ============================================
  if (overdueData?.summary.overdueCategories) {
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 20;
    }

    currentY = addSectionHeader(doc, 'SECTION 4: OVERDUE DISTRIBUTION', currentY, pageWidth);

    const categories = overdueData.summary.overdueCategories;
    const categoryData = [
      ['1 Week', categories.week1.toString()],
      ['2 Weeks', categories.week2.toString()],
      ['1 Month', categories.month1.toString()],
      ['2 Months', categories.month2.toString()],
      ['3 Months', categories.month3.toString()],
      ['Over 3 Months', categories.more.toString()],
    ];

    // Calculate total for percentages
    const total = Object.values(categories).reduce((a, b) => a + b, 0);

    // Add percentage column
    const categoryDataWithPercent = categoryData.map(([period, count]) => {
      const percentage = total > 0 ? ((parseInt(count) / total) * 100).toFixed(1) : '0.0';
      return [period, count, `${percentage}%`];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Overdue Period', 'Number of Tenants', 'Percentage']],
      body: categoryDataWithPercent,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
      },
      styles: {
        fontSize: 9,
        cellPadding: 6,
      },
      columnStyles: {
        0: { cellWidth: 50, halign: 'left' },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 35, halign: 'center' },
      },
      margin: { left: 14 },
      tableWidth: 125,
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // ============================================
  // FOOTER
  // ============================================
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 22, pageWidth - 14, pageHeight - 22);
    
    // Footer text
    doc.setFontSize(9);
    doc.setTextColor(0, 51, 102);
    doc.setFont('helvetica', 'bold');
    doc.text('INTERPARK ENTERPRISES LIMITED', pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  // Generate filename
  const filename = `${property.name.replace(/\s+/g, '_')}_Combined_Arrears_Report_${
    new Date().toISOString().split('T')[0]
  }.pdf`;

  // Save the PDF
  doc.save(filename);
}