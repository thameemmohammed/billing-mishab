/**
 * BISMI INTERNATIONAL GENERAL TRADING L.L.C
 * Cash / Debit Memo Invoice Template & PDF Generation Engine
 * Generates exact 150 mm x 210 mm portrait physical bill memo matching printed typewriter copies.
 */

const InvoiceEngine = {
  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Render the HTML string for the exact 150 mm x 210 mm portrait Cash/Debit Memo.
   * Matches the physical pre-printed typewriter bill pad down to every detail.
   */
  generateInvoiceHtml(invoiceData) {
    const calc = invoiceData.calculations || {};
    const items = invoiceData.items || [];
    
    // Format invoice number: strip any 'No.' or leading non-digits to keep clean red number
    let rawNum = String(invoiceData.invoiceNumber || '11202').trim();
    let numOnly = rawNum.replace(/^No\.?\s*/i, '');
    if (!numOnly) numOnly = '11202';

    // Date
    let invDate = invoiceData.invoiceDate || '';
    if (!invDate) {
      const now = new Date();
      invDate = now.toISOString().split('T')[0];
    }

    // Customer
    const customerName = invoiceData.customerName || '';

    // Split grand total into Dhs and Fils
    const grandTotalNum = Number(calc.grandTotal) || 0;
    const totalDhs = Math.floor(grandTotalNum);
    const totalFils = String(Math.round((grandTotalNum - totalDhs) * 100)).padStart(2, '0');

    // Exactly 17 rows as in physical memo pad
    const TOTAL_MEMO_ROWS = 17;
    let tableRowsHtml = '';

    for (let i = 0; i < TOTAL_MEMO_ROWS; i++) {
      if (i < items.length) {
        const item = items[i];
        const lineTotalNum = Number(item.lineTotal || (item.unitPrice * (item.quantity || 1))) || 0;
        const itemDhs = Math.floor(lineTotalNum);
        const itemFils = String(Math.round((lineTotalNum - itemDhs) * 100)).padStart(2, '0');

        tableRowsHtml += `
          <tr class="memo-row filled-row">
            <td class="col-sno"><span class="typed-val">${i + 1}</span></td>
            <td class="col-desc"><span class="typed-val desc-typed">${this.escapeHtml(item.name || '')}</span></td>
            <td class="col-qty"><span class="typed-val">${item.quantity || 1}</span></td>
            <td class="col-dhs"><span class="typed-val">${itemDhs}</span></td>
            <td class="col-fils"><span class="typed-val">${itemFils}</span></td>
          </tr>
        `;
      } else {
        tableRowsHtml += `
          <tr class="memo-row empty-row">
            <td class="col-sno">&nbsp;</td>
            <td class="col-desc">&nbsp;</td>
            <td class="col-qty">&nbsp;</td>
            <td class="col-dhs">&nbsp;</td>
            <td class="col-fils">&nbsp;</td>
          </tr>
        `;
      }
    }

    return `
      <div class="invoice-sheet bismi-memo-sheet" id="invoice-sheet-container">
        
        <!-- TOP BORDERED HEADER BOX -->
        <div class="memo-top-box">
          
          <!-- LEFT BRAND SECTION -->
          <div class="memo-brand-wrap">
            <div class="memo-logo-svg">
              <svg viewBox="0 0 76 68" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <!-- Globe at top left -->
                <circle cx="28" cy="11" r="9.5" fill="none" stroke="#15325B" stroke-width="1.3" />
                <ellipse cx="28" cy="11" rx="9.5" ry="3.8" fill="none" stroke="#15325B" stroke-width="0.9" />
                <ellipse cx="28" cy="11" rx="4.2" ry="9.5" fill="none" stroke="#15325B" stroke-width="0.9" />
                <line x1="18.5" y1="11" x2="37.5" y2="11" stroke="#15325B" stroke-width="0.9" />
                <circle cx="28" cy="11" r="2.2" fill="#15325B" />
                
                <!-- Stylized Monogram "B" with sharp serif and dynamic swooshes -->
                <g fill="#15325B">
                  <!-- Wing serif top -->
                  <path d="M 24 18 C 16 23 8 28 0 31 C 10 27 18 22 24 18 Z" />
                  <!-- Main stem & double lobes -->
                  <path d="M 22 18 L 15 57 L 27 57 C 38 57 46 51 46 43 C 46 37 41 33 34 31 C 40 29 44 25 44 20 C 44 14 36 18 24 18 Z M 24 24 L 28 24 C 33 24 36 26 36 30 C 36 33 33 35 28 35 L 22 35 Z M 21 41 L 28 41 C 34 41 38 43 38 49 C 38 54 33 55 27 55 L 19 55 Z" />
                  <!-- Dynamic horizontal swoosh wings -->
                  <path d="M 10 47 C 22 42 40 44 56 37 C 42 42 26 44 10 47 Z" />
                  <path d="M 2 54 C 14 50 30 50 45 45 C 31 49 16 50 2 54 Z" />
                </g>
              </svg>
            </div>

            <!-- Boxed Title and English Text -->
            <div class="memo-title-bordered-box">
              <div class="memo-ar-name">بسمي انترناشيونال للتجارة العامة ش.ذ.م.م</div>
              <div class="memo-bismi-box">
                <span class="memo-bismi-text">BISMI</span>
              </div>
              <div class="memo-en-sub1">INTERNATIONAL</div>
              <div class="memo-en-sub2">GENERAL TRADING L.L.C</div>
            </div>
          </div>

          <!-- RIGHT CONTACT DETAILS -->
          <div class="memo-contact-wrap">
            <div class="memo-contact-ar">
              <div class="memo-phone-ar">تليفون: ٠٤-٣٢٠٢٠٢٣ ، فاكس: ٠٤-٣٢٠٢٠٢٢</div>
              <div class="memo-pobox-ar">ص.ب: ٥٧٦٣٣ ، العوير، الإمارات العربية المتحدة</div>
            </div>
            <div class="memo-contact-en">
              <div class="memo-phone-en">Tel: 04-3202023 , Fax: 04-3202022</div>
              <div class="memo-pobox-en">P.O Box: 57633, Al Aweer Dubai, U.A.E</div>
              <div class="memo-email-en">E-mail: sales.aweer@bismiintl.com</div>
            </div>
          </div>
        </div>

        <!-- SUB-HEADER META ROW: NO, CASH/DEBIT MEMO, DATE -->
        <div class="memo-meta-strip">
          <div class="memo-no-part">
            <span class="label-no">No.</span>
            <span class="val-no-red">${numOnly}</span>
          </div>

          <div class="memo-heading-part">
            <div class="memo-heading-ar">فاتورة نقدية / على الحساب</div>
            <div class="memo-heading-en">CASH/DEBIT MEMO</div>
          </div>

          <div class="memo-date-part">
            <span class="label-date-en">Date</span>
            <div class="dots-wrapper date-dots-wrap">
              <span class="typed-val date-typed-val">${invDate}</span>
              <span class="guide-dots"></span>
            </div>
            <span class="label-date-ar">التاريخ</span>
          </div>
        </div>

        <!-- CUSTOMER ROW -->
        <div class="memo-customer-strip">
          <span class="label-cust-en">Mr./M/s :</span>
          <div class="dots-wrapper cust-dots-wrap">
            <span class="typed-val cust-typed-val">${this.escapeHtml(customerName)}</span>
            <span class="guide-dots"></span>
          </div>
          <span class="label-cust-ar">السيد / السادة</span>
        </div>

        <!-- MAIN TABLE WITH 17 ROWS AND WATERMARK -->
        <div class="memo-table-container">
          
          <!-- FAINT BLUE WATERMARK IN BACKGROUND -->
          <div class="memo-watermark">
            <svg viewBox="0 0 160 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <circle cx="80" cy="28" r="16" fill="none" stroke="#15325B" stroke-width="2.2" opacity="0.10" />
              <ellipse cx="80" cy="28" rx="16" ry="6.2" fill="none" stroke="#15325B" stroke-width="1.6" opacity="0.10" />
              <ellipse cx="80" cy="28" rx="6.5" ry="16" fill="none" stroke="#15325B" stroke-width="1.6" opacity="0.10" />
              <line x1="64" y1="28" x2="96" y2="28" stroke="#15325B" stroke-width="1.6" opacity="0.10" />
              <circle cx="80" cy="28" r="3.5" fill="#15325B" opacity="0.12" />
              <g fill="#15325B" opacity="0.09">
                <path d="M 72 42 C 58 50 44 60 28 66 C 46 58 62 49 72 42 Z" />
                <path d="M 70 42 L 56 120 L 80 120 C 100 120 114 108 114 93 C 114 82 104 74 90 71 C 102 67 110 59 110 50 C 110 38 94 42 70 42 Z M 72 54 L 80 54 C 88 54 94 58 94 66 C 94 72 88 76 80 76 L 68 76 Z M 66 88 L 80 88 C 90 88 98 92 98 103 C 98 113 88 115 76 115 L 62 115 Z" />
                <path d="M 44 101 C 66 92 98 95 128 82 C 102 91 72 95 44 101 Z" />
                <path d="M 30 114 C 52 107 80 107 108 98 C 82 105 54 107 30 114 Z" />
              </g>
            </svg>
          </div>

          <table class="memo-table">
            <thead>
              <tr class="thead-row-1">
                <th rowspan="2" class="col-sno"><div class="th-ar">الرقم</div><div class="th-en">S.No.</div></th>
                <th rowspan="2" class="col-desc"><div class="th-ar">الـتـــفـــاصـــيـــل</div><div class="th-en">DESCRIPTION</div></th>
                <th rowspan="2" class="col-qty"><div class="th-ar">الـعــدد</div><div class="th-en">QTY</div></th>
                <th colspan="2" class="col-amount-main"><div class="th-amount-row"><span class="th-en">AMOUNT</span><span class="th-ar">المبلغ</span></div></th>
              </tr>
              <tr class="thead-row-2">
                <th class="col-dhs"><div class="th-ar">درهم</div><div class="th-en">Dhs.</div></th>
                <th class="col-fils"><div class="th-ar">فلس</div><div class="th-en">Fils</div></th>
              </tr>
            </thead>
            <tbody>
              ${tableRowsHtml}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="3" class="total-label-cell">
                  <div class="total-split">
                    <span class="total-en">Total .</span>
                    <span class="total-dots"></span>
                    <span class="total-ar">المجموع</span>
                  </div>
                </td>
                <td class="col-dhs total-dhs-cell"><span class="typed-val total-typed">${totalDhs}</span></td>
                <td class="col-fils total-fils-cell"><span class="typed-val total-typed">${totalFils}</span></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- BOTTOM SIGNATURES -->
        <div class="memo-signatures-row">
          <div class="sig-col sig-receiver">
            <span class="sig-en">Receiver's Sign:</span>
            <span class="sig-dots"></span>
            <span class="sig-ar">توقيع المستلم</span>
          </div>
          <div class="sig-col sig-authorized">
            <span class="sig-en">Signature:</span>
            <span class="sig-dots"></span>
            <span class="sig-ar">التوقيع</span>
          </div>
        </div>

      </div>
    `;
  },

  /**
   * Dynamically ensure that jsPDF and html2canvas are loaded.
   * Resolves issues on GitHub Pages, CDN blips, or missing local vendor files.
   */
  async ensureLibrariesLoaded() {
    const getH2C = () => {
      if (typeof window.html2canvas === 'function') return window.html2canvas;
      if (window.html2canvas && typeof window.html2canvas.default === 'function') return window.html2canvas.default;
      if (typeof html2canvas === 'function') return html2canvas;
      return null;
    };

    const getJsPDF = () => {
      if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
      if (typeof window.jsPDF === 'function') return window.jsPDF;
      return null;
    };

    const loadScript = (url) => new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${url}"]`);
      if (existing) {
        if (getH2C() || getJsPDF()) {
          resolve();
          return;
        }
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', (e) => reject(e), { once: true });
        setTimeout(resolve, 300);
        return;
      }
      const s = document.createElement('script');
      s.src = url;
      s.crossOrigin = 'anonymous';
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });

    // 1. Resolve html2canvas
    if (!getH2C()) {
      const h2cUrls = [
        'vendor/html2canvas.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
        'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
        'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.js'
      ];
      for (const url of h2cUrls) {
        try {
          await loadScript(url);
          if (getH2C()) break;
        } catch (e) {
          console.warn('Could not load html2canvas from', url);
        }
      }
    }

    // 2. Resolve jsPDF
    if (!getJsPDF()) {
      const jspdfUrls = [
        'vendor/jspdf.umd.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
        'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'
      ];
      for (const url of jspdfUrls) {
        try {
          await loadScript(url);
          if (getJsPDF()) break;
        } catch (e) {
          console.warn('Could not load jsPDF from', url);
        }
      }
    }

    const h2c = getH2C();
    const jsPdfClass = getJsPDF();

    if (!jsPdfClass) {
      throw new Error('PDF generator library (jsPDF) could not be loaded. Please ensure internet access.');
    }

    return { html2canvas: h2c, jsPDF: jsPdfClass };
  },

  /**
   * Render preview into DOM modal
   */
  renderPreview(invoiceData, containerElement) {
    if (!containerElement) return;
    const html = this.generateInvoiceHtml(invoiceData);
    containerElement.innerHTML = html;
  },

  /**
   * Generate and Download PDF using exact 150mm x 210mm portrait custom page size
   */
  async downloadPDF(invoiceData, onProgress) {
    if (typeof onProgress === 'function') onProgress('Preparing exact 150 mm × 210 mm Cash/Debit Memo...');

    // Ensure libraries are actively available
    const { html2canvas: h2cFn, jsPDF: jsPDFClass } = await this.ensureLibrariesLoaded();

    // Format clean invoice number
    let rawNum = String(invoiceData.invoiceNumber || '11202').trim();
    let numOnly = rawNum.replace(/^No\.?\s*/i, '');
    if (!numOnly) numOnly = '11202';

    // 1. Create temporary off-screen container matching exact 150mm x 210mm portrait
    const tempContainer = document.createElement('div');
    tempContainer.className = 'pdf-render-target';
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '150mm';
    tempContainer.style.height = '210mm';
    tempContainer.style.minHeight = '210mm';
    tempContainer.style.maxHeight = '210mm';
    tempContainer.style.boxSizing = 'border-box';
    tempContainer.style.backgroundColor = '#FFFFFF';
    tempContainer.style.zIndex = '-9999';
    tempContainer.innerHTML = this.generateInvoiceHtml(invoiceData);

    document.body.appendChild(tempContainer);

    try {
      const targetSheet = tempContainer.querySelector('.invoice-sheet');

      if (typeof onProgress === 'function') onProgress('Constructing 150 mm × 210 mm Portrait Memo PDF...');

      // Initialize jsPDF with exact custom page size 150mm x 210mm portrait
      const doc = new jsPDFClass({
        orientation: 'portrait',
        unit: 'mm',
        format: [150, 210],
        compress: true
      });

      // If html2canvas is available, capture at high DPI
      if (typeof h2cFn === 'function') {
        if (typeof onProgress === 'function') onProgress('Rendering ultra-crisp print canvas...');
        await new Promise(r => setTimeout(r, 200));

        let canvas;
        try {
          canvas = await h2cFn(targetSheet, {
            scale: 3,
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: '#FFFFFF',
            windowWidth: 750,
            windowHeight: 1050
          });
        } catch (captureErr) {
          console.warn('High-res capture failed, trying standard scale...', captureErr);
          canvas = await h2cFn(targetSheet, {
            scale: 2,
            useCORS: false,
            allowTaint: false,
            backgroundColor: '#FFFFFF'
          });
        }

        let imgData = null;
        try {
          imgData = canvas.toDataURL('image/jpeg', 0.98);
        } catch (taintErr) {
          console.warn('Canvas tainted, re-rendering safe mode...', taintErr);
          targetSheet.querySelectorAll('img').forEach(img => img.remove());
          const cleanCanvas = await h2cFn(targetSheet, {
            scale: 2,
            useCORS: false,
            allowTaint: false,
            backgroundColor: '#FFFFFF'
          });
          imgData = cleanCanvas.toDataURL('image/jpeg', 0.95);
        }

        // Place image exactly onto 150mm x 210mm canvas
        doc.addImage(imgData, 'JPEG', 0, 0, 150, 210, undefined, 'FAST');
      } else {
        // Direct Native Vector jsPDF Fallback (Guaranteed to work even if html2canvas is blocked)
        this.renderNativeJsPdfVector(doc, invoiceData);
      }

      const fileName = `Invoice-${numOnly}.pdf`;

      if (typeof onProgress === 'function') onProgress('Saving PDF file...');
      doc.save(fileName);

      return true;
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      throw err;
    } finally {
      if (tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    }
  },

  /**
   * Direct vector drawing fallback inside jsPDF for 150mm x 210mm portrait Bismi Memo
   */
  renderNativeJsPdfVector(doc, invoiceData) {
    const calc = invoiceData.calculations || {};
    const items = invoiceData.items || [];

    let rawNum = String(invoiceData.invoiceNumber || '11202').trim();
    let numOnly = rawNum.replace(/^No\.?\s*/i, '');
    if (!numOnly) numOnly = '11202';

    const invDate = invoiceData.invoiceDate || '';
    const customerName = invoiceData.customerName || '';

    const grandTotalNum = Number(calc.grandTotal) || 0;
    const totalDhs = Math.floor(grandTotalNum);
    const totalFils = String(Math.round((grandTotalNum - totalDhs) * 100)).padStart(2, '0');

    // Page boundaries
    // Outer Top Header Box
    doc.setDrawColor(21, 50, 91);
    doc.setLineWidth(0.4);
    doc.roundedRect(6, 6, 138, 24, 2, 2, 'S');

    // Top Header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(21, 50, 91);
    doc.text('BISMI', 45, 17, { align: 'center' });
    doc.setFontSize(6);
    doc.text('INTERNATIONAL', 45, 21, { align: 'center' });
    doc.setFontSize(5);
    doc.text('GENERAL TRADING L.L.C', 45, 24, { align: 'center' });

    // Right header contact
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text('Tel: 04-3202023 , Fax: 04-3202022', 138, 18, { align: 'right' });
    doc.text('P.O Box: 57633, Al Aweer Dubai, U.A.E', 138, 22, { align: 'right' });
    doc.text('E-mail: sales.aweer@bismiintl.com', 138, 26, { align: 'right' });

    // Sub-header Row
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(21, 50, 91);
    doc.text('No.', 7, 36);

    // Red stamped number
    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(189, 32, 32);
    doc.text(numOnly, 14, 36);

    // Center Heading
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(21, 50, 91);
    doc.text('CASH/DEBIT MEMO', 75, 36, { align: 'center' });

    // Date
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Date', 110, 36);
    doc.setFont('courier', 'bold');
    doc.text(invDate, 120, 36);

    // Customer Line
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Mr./M/s :', 7, 43);
    doc.setFont('courier', 'bold');
    doc.text(customerName, 24, 43);

    // Table coordinates
    const tableTop = 46;
    const tableHeight = 142;
    const tableWidth = 138;
    const colX = {
      start: 6,
      sno: 16,
      desc: 95,
      qty: 110,
      dhs: 130,
      end: 144
    };

    // Table outer border
    doc.setDrawColor(21, 50, 91);
    doc.setLineWidth(0.4);
    doc.rect(colX.start, tableTop, tableWidth, tableHeight, 'S');

    // Header dividing line
    const headerH = 10;
    doc.line(colX.start, tableTop + headerH, colX.end, tableTop + headerH);

    // Vertical column dividers
    doc.line(colX.sno, tableTop, colX.sno, tableTop + tableHeight);
    doc.line(colX.desc, tableTop, colX.desc, tableTop + tableHeight);
    doc.line(colX.qty, tableTop, colX.qty, tableTop + tableHeight);
    doc.line(colX.dhs, tableTop + 5, colX.dhs, tableTop + tableHeight);

    // Header labels
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('S.No.', (colX.start + colX.sno) / 2, tableTop + 8, { align: 'center' });
    doc.text('DESCRIPTION', (colX.sno + colX.desc) / 2, tableTop + 8, { align: 'center' });
    doc.text('QTY', (colX.desc + colX.qty) / 2, tableTop + 8, { align: 'center' });
    doc.text('AMOUNT', (colX.qty + colX.end) / 2, tableTop + 4, { align: 'center' });
    doc.line(colX.qty, tableTop + 5, colX.end, tableTop + 5);
    doc.text('Dhs.', (colX.qty + colX.dhs) / 2, tableTop + 8.5, { align: 'center' });
    doc.text('Fils', (colX.dhs + colX.end) / 2, tableTop + 8.5, { align: 'center' });

    // 17 dotted rows
    const rowH = 7.0;
    const bodyTop = tableTop + headerH;
    for (let r = 1; r <= 17; r++) {
      const curY = bodyTop + (r * rowH);
      if (r < 17) {
        doc.setLineDashPattern([1, 1], 0);
        doc.line(colX.start, curY, colX.end, curY);
      }
    }
    doc.setLineDashPattern([], 0); // reset solid

    // Draw item rows
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(17, 17, 17);
    items.slice(0, 17).forEach((it, idx) => {
      const rowY = bodyTop + (idx * rowH) + 5;
      const lineTotal = Number(it.lineTotal || (it.unitPrice * (it.quantity || 1))) || 0;
      const dhs = Math.floor(lineTotal);
      const fils = String(Math.round((lineTotal - dhs) * 100)).padStart(2, '0');

      doc.text(String(idx + 1), (colX.start + colX.sno) / 2, rowY, { align: 'center' });
      doc.text(String(it.name || '').substring(0, 36), colX.sno + 2, rowY);
      doc.text(String(it.quantity || 1), (colX.desc + colX.qty) / 2, rowY, { align: 'center' });
      doc.text(String(dhs), (colX.qty + colX.dhs) / 2, rowY, { align: 'center' });
      doc.text(fils, (colX.dhs + colX.end) / 2, rowY, { align: 'center' });
    });

    // Total Row
    const totalY = bodyTop + (17 * rowH);
    doc.setLineWidth(0.4);
    doc.line(colX.start, totalY, colX.end, totalY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(21, 50, 91);
    doc.text('Total .', colX.start + 3, totalY + 5.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(17, 17, 17);
    doc.text(String(totalDhs), (colX.qty + colX.dhs) / 2, totalY + 5.5, { align: 'center' });
    doc.text(totalFils, (colX.dhs + colX.end) / 2, totalY + 5.5, { align: 'center' });

    // Signatures row
    const sigY = tableTop + tableHeight + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(21, 50, 91);
    doc.text("Receiver's Sign: .......................................", 7, sigY);
    doc.text("Signature: .......................................", 95, sigY);
  },

  /**
   * Native Browser Printing directly configured for 150mm x 210mm portrait
   */
  printInvoice(invoiceData) {
    let container = document.getElementById('print-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'print-container';
      container.className = 'print-only-container';
      document.body.appendChild(container);
    }
    container.innerHTML = this.generateInvoiceHtml(invoiceData);

    // Trigger print
    window.print();
  }
};

window.InvoiceEngine = InvoiceEngine;
