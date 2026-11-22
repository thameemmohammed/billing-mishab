/**
 * Mishab Luxury Cosmetics - Invoice Template & PDF Generation Engine
 * Handles exact 210 mm x 150 mm landscape invoice rendering, preview modal,
 * and high-DPI client-side PDF generation using jsPDF & html2canvas.
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
   * Render the HTML string for the 210 mm x 150 mm landscape invoice.
   * Uses precise millimeter geometry and cosmetics luxury styling.
   */
  generateInvoiceHtml(invoiceData) {
    const store = invoiceData.storeSnapshot || window.storageManager.getSettings();
    const calc = invoiceData.calculations;
    const payment = invoiceData.payment || {};
    const items = invoiceData.items || [];

    // Format helpers
    const fmt = (val) => (Number(val) || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Determine status badge class
    let statusClass = 'status-paid';
    if (payment.status === 'Partially Paid') statusClass = 'status-partial';
    else if (payment.status === 'Unpaid') statusClass = 'status-unpaid';

    // Build item rows
    // Compact row padding if items count > 4 to strictly preserve 150mm paper height
    const isCompact = items.length > 4;
    const rowClass = isCompact ? 'table-row-compact' : 'table-row-normal';

    const itemsRowsHtml = items.map((item, index) => {
      const discText = item.discountAmount > 0 
        ? `-₹${fmt(item.discountAmount)}`
        : '-';
      const taxText = item.taxRate ? `${item.taxRate}%` : '0%';

      return `
        <tr class="${rowClass}">
          <td class="text-center col-sn">${index + 1}</td>
          <td class="col-desc">
            <div class="item-name">${this.escapeHtml(item.name)}</div>
            ${item.sku ? `<span class="item-sku">SKU: ${this.escapeHtml(item.sku)}</span>` : ''}
          </td>
          <td class="text-center col-qty">
            <strong>${item.quantity}</strong> <span class="item-unit">${this.escapeHtml(item.unit || 'pcs')}</span>
          </td>
          <td class="text-right col-price">₹${fmt(item.unitPrice)}</td>
          <td class="text-right col-disc">${discText}</td>
          <td class="text-center col-tax">${taxText}</td>
          <td class="text-right col-amount">₹${fmt(item.lineTotal || (item.taxableAmount + item.taxAmount))}</td>
        </tr>
      `;
    }).join('');

    // Optional GST rows (only show if applicable and > 0)
    let taxBreakdownRows = '';
    if (calc.enableTax && calc.gstTreatment !== 'exempt') {
      if (calc.gstTreatment === 'cgst_sgst') {
        if (calc.cgstAmount > 0) {
          taxBreakdownRows += `
            <div class="calc-row">
              <span class="calc-label">CGST (${calc.cgstRate || 9}%):</span>
              <span class="calc-val">₹${fmt(calc.cgstAmount)}</span>
            </div>
            <div class="calc-row">
              <span class="calc-label">SGST (${calc.sgstRate || 9}%):</span>
              <span class="calc-val">₹${fmt(calc.sgstAmount)}</span>
            </div>
          `;
        }
      } else if (calc.gstTreatment === 'igst' && calc.igstAmount > 0) {
        taxBreakdownRows += `
          <div class="calc-row">
            <span class="calc-label">IGST (${calc.igstRate || 18}%):</span>
            <span class="calc-val">₹${fmt(calc.igstAmount)}</span>
          </div>
        `;
      }
    }

    // Optional discounts
    let discountRows = '';
    if (calc.productDiscountsTotal > 0) {
      discountRows += `
        <div class="calc-row text-discount">
          <span class="calc-label">Product Discounts:</span>
          <span class="calc-val">-₹${fmt(calc.productDiscountsTotal)}</span>
        </div>
      `;
    }
    if (calc.overallDiscountAmount > 0) {
      const discLabel = calc.overallDiscountType === 'percentage' 
        ? `Bill Discount (${calc.overallDiscountValue}%):` 
        : 'Bill Discount (Flat):';
      discountRows += `
        <div class="calc-row text-discount">
          <span class="calc-label">${discLabel}</span>
          <span class="calc-val">-₹${fmt(calc.overallDiscountAmount)}</span>
        </div>
      `;
    }

    // Optional charges
    let chargesRows = '';
    if (calc.packagingCharge > 0) {
      chargesRows += `
        <div class="calc-row">
          <span class="calc-label">Packaging &amp; Gift Wrap:</span>
          <span class="calc-val">₹${fmt(calc.packagingCharge)}</span>
        </div>
      `;
    }
    if (calc.deliveryCharge > 0) {
      chargesRows += `
        <div class="calc-row">
          <span class="calc-label">Delivery Charges:</span>
          <span class="calc-val">₹${fmt(calc.deliveryCharge)}</span>
        </div>
      `;
    }
    if (calc.serviceCharge > 0) {
      chargesRows += `
        <div class="calc-row">
          <span class="calc-label">Service Fee:</span>
          <span class="calc-val">₹${fmt(calc.serviceCharge)}</span>
        </div>
      `;
    }
    if (calc.otherCharges > 0) {
      chargesRows += `
        <div class="calc-row">
          <span class="calc-label">Other Charges:</span>
          <span class="calc-val">₹${fmt(calc.otherCharges)}</span>
        </div>
      `;
    }

    // Round off row
    let roundOffRow = '';
    if (calc.roundOff !== 0) {
      roundOffRow = `
        <div class="calc-row">
          <span class="calc-label">Round Off:</span>
          <span class="calc-val">${calc.roundOff > 0 ? '+' : ''}₹${fmt(calc.roundOff)}</span>
        </div>
      `;
    }

    // Customer display
    const customerName = invoiceData.customerName || 'Walk-in Retail Customer';
    const customerPhone = invoiceData.customerPhone ? `Ph: ${this.escapeHtml(invoiceData.customerPhone)}` : '';
    const customerEmail = invoiceData.customerEmail ? this.escapeHtml(invoiceData.customerEmail) : '';
    const customerAddress = invoiceData.customerAddress ? this.escapeHtml(invoiceData.customerAddress) : '';
    const customerGstin = invoiceData.customerGstin ? `GSTIN: ${this.escapeHtml(invoiceData.customerGstin)}` : '';

    // Build Store Logo (Use inline SVG for default to prevent canvas tainting in file:// and offline modes)
    let logoHtml = '';
    const hasCustomDataLogo = store.logoUrl && store.logoUrl.startsWith('data:image/');
    
    if (hasCustomDataLogo) {
      logoHtml = `<img src="${store.logoUrl}" alt="${this.escapeHtml(store.storeName)}" class="inv-logo-img" crossorigin="anonymous" />`;
    } else {
      // Default Luxury Monogram Botanical Crest (Inline SVG: immune to canvas tainting)
      logoHtml = `
        <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="30" fill="#FAF5EF" stroke="#C5A059" stroke-width="1.8" />
          <circle cx="32" cy="32" r="26" fill="none" stroke="#B76E79" stroke-width="0.8" stroke-dasharray="2,2" />
          <path d="M 32 10 C 35 18 39 24 46 26 C 39 28 35 34 32 42 C 29 34 25 28 18 26 C 25 24 29 18 32 10 Z" fill="#C5A059" opacity="0.28" />
          <path d="M 23 20 C 26 23 29 27 28 34 C 23 31 19 28 23 20 Z" fill="#B76E79" opacity="0.35" />
          <path d="M 41 20 C 38 23 35 27 36 34 C 41 31 45 28 41 20 Z" fill="#B76E79" opacity="0.35" />
          <text x="32" y="39" font-family="'Playfair Display', 'Cormorant Garamond', Georgia, serif" font-size="22" font-weight="700" font-style="italic" fill="#8F4853" text-anchor="middle">M</text>
          <polygon points="32,7 33,10 36,11 33,12 32,15 31,12 28,11 31,10" fill="#C5A059" />
        </svg>
      `;
    }

    return `
      <div class="invoice-sheet" id="invoice-sheet-container">
        <!-- Top Rose Gold Aesthetic Bar -->
        <div class="inv-top-bar"></div>

        <!-- Sheet Header (Height ~22mm) -->
        <header class="inv-header">
          <!-- Left: Boutique Branding -->
          <div class="inv-brand-box">
            <div class="inv-brand-logo-wrap">
              ${logoHtml}
            </div>
            <div class="inv-store-info">
              <h1 class="inv-store-title">${this.escapeHtml(store.storeName)}</h1>
              <div class="inv-store-sub">${this.escapeHtml(store.storeTagline || 'Haute Parfumerie & Beauté')}</div>
              <div class="inv-store-meta">
                <span>${this.escapeHtml(store.address || '')}${store.cityStateZip ? `, ${this.escapeHtml(store.cityStateZip)}` : ''}</span>
                <span>${store.phone ? `Ph: ${this.escapeHtml(store.phone)}` : ''} ${store.email ? `• ${this.escapeHtml(store.email)}` : ''}</span>
                ${store.gstin ? `<span class="gstin-badge">GSTIN: <strong>${this.escapeHtml(store.gstin)}</strong></span>` : ''}
              </div>
            </div>
          </div>

          <!-- Right: Invoice Metadata & Title Badge -->
          <div class="inv-meta-box">
            <div class="inv-title-badge">TAX INVOICE</div>
            <div class="inv-number-row">
              <span class="inv-num-label">INVOICE NO:</span>
              <span class="inv-num-val">${this.escapeHtml(invoiceData.invoiceNumber)}</span>
            </div>
            <div class="inv-date-row">
              <span>Date: <strong>${this.escapeHtml(invoiceData.invoiceDate)}</strong></span>
              ${invoiceData.invoiceTime ? `<span>Time: ${this.escapeHtml(invoiceData.invoiceTime)}</span>` : ''}
            </div>
            <div class="inv-status-pill ${statusClass}">
              ${payment.status ? payment.status.toUpperCase() : 'PAID'}
            </div>
          </div>
        </header>

        <!-- Bill To / Customer Strip (Height ~11mm) -->
        <section class="inv-customer-strip">
          <div class="customer-left">
            <span class="strip-label">BILLED TO:</span>
            <span class="customer-name-val">${this.escapeHtml(customerName)}</span>
            ${customerPhone ? `<span class="customer-sub-val">${customerPhone}</span>` : ''}
            ${customerEmail ? `<span class="customer-sub-val">${customerEmail}</span>` : ''}
            ${customerAddress ? `<span class="customer-sub-val">${customerAddress}</span>` : ''}
            ${customerGstin ? `<span class="customer-sub-val gstin-tag">${customerGstin}</span>` : ''}
          </div>
          <div class="customer-right">
            <div class="payment-mode-tag">
              <span class="strip-label">PAYMENT MODE:</span>
              <strong>${this.escapeHtml(payment.mode || 'Cash')}</strong>
            </div>
            ${payment.transactionRef ? `<div class="ref-sub">Ref: ${this.escapeHtml(payment.transactionRef)}</div>` : ''}
            ${invoiceData.referenceNo ? `<div class="ref-sub">Order: ${this.escapeHtml(invoiceData.referenceNo)}</div>` : ''}
          </div>
        </section>

        <!-- Product Table Area (Height ~50-56mm) -->
        <section class="inv-table-section">
          <table class="inv-table">
            <thead>
              <tr>
                <th class="text-center col-sn">#</th>
                <th class="text-left col-desc">Product / Treatment Item</th>
                <th class="text-center col-qty">Qty</th>
                <th class="text-right col-price">Rate (₹)</th>
                <th class="text-right col-disc">Disc.</th>
                <th class="text-center col-tax">Tax</th>
                <th class="text-right col-amount">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>
        </section>

        <!-- Bottom Balanced Area: Terms & Totals (Height ~40mm) -->
        <footer class="inv-footer-section">
          <!-- Left: Words, UPI/Bank, Terms, Signature -->
          <div class="footer-left-col">
            <div class="words-box">
              <span class="words-label">Amount in Words:</span>
              <span class="words-val">${this.escapeHtml(calc.amountInWords || 'Rupees Zero Only')}</span>
            </div>

            <div class="bank-upi-strip">
              ${store.upiId ? `
                <div class="upi-item">
                  <span class="upi-label">UPI ID:</span>
                  <span class="upi-val">${this.escapeHtml(store.upiId)}</span>
                </div>
              ` : ''}
              ${store.bankName ? `
                <div class="bank-item">
                  <span class="bank-val">${this.escapeHtml(store.bankName)} | A/C: ${this.escapeHtml(store.accountNumber || '')} | IFSC: ${this.escapeHtml(store.ifscCode || '')}</span>
                </div>
              ` : ''}
            </div>

            <div class="terms-box">
              <p class="terms-text"><strong>Terms &amp; Policy:</strong> ${this.escapeHtml(store.returnPolicy || 'Exchanges accepted within 7 days with original invoice.')}</p>
              <p class="thank-text">${this.escapeHtml(store.footerNote || 'Thank you for your valued patronage!')}</p>
            </div>

            <div class="signature-box">
              <div class="sign-line"></div>
              <span class="sign-label">Authorized Signatory • ${this.escapeHtml(store.storeName)}</span>
            </div>
          </div>

          <!-- Right: Compact Calculations Summary -->
          <div class="footer-right-col">
            <div class="calc-summary-card">
              <div class="calc-row">
                <span class="calc-label">Items Subtotal:</span>
                <span class="calc-val">₹${fmt(calc.preTaxSubtotal || calc.itemsGross)}</span>
              </div>
              
              ${discountRows}

              <div class="calc-row">
                <span class="calc-label">Taxable Value:</span>
                <span class="calc-val">₹${fmt(calc.taxableAmount)}</span>
              </div>

              ${taxBreakdownRows}
              ${chargesRows}
              ${roundOffRow}

              <div class="calc-row grand-total-row">
                <span class="grand-label">GRAND TOTAL:</span>
                <span class="grand-val">₹${fmt(calc.grandTotal)}</span>
              </div>

              <div class="calc-row payment-status-row">
                <span>Paid: <strong>₹${fmt(payment.amountPaid || calc.amountPaid || 0)}</strong></span>
                <span>Balance: <strong class="${(payment.balanceDue || 0) > 0 ? 'text-due' : 'text-cleared'}">₹${fmt(payment.balanceDue || 0)}</strong></span>
              </div>
            </div>
          </div>
        </footer>

        <!-- Bottom Micro Stamp -->
        <div class="inv-bottom-tag">
          <span>Official 210mm × 150mm Landscape Beauty Receipt</span>
          <span>Computer Generated Tax Invoice</span>
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
      // Check if already in DOM
      const existing = document.querySelector(`script[src="${url}"]`);
      if (existing) {
        setTimeout(resolve, 150);
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
        'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
        'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
        'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.js',
        'vendor/html2canvas.min.js'
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
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
        'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
        'vendor/jspdf.umd.min.js'
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
      throw new Error('PDF generator library (jsPDF) could not be loaded. Please ensure internet access or verify vendor files.');
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
   * Generate and Download PDF using exact 210mm x 150mm custom page size
   */
  async downloadPDF(invoiceData, onProgress) {
    if (typeof onProgress === 'function') onProgress('Preparing high-resolution invoice document...');

    // Ensure libraries are actively available
    const { html2canvas: h2cFn, jsPDF: jsPDFClass } = await this.ensureLibrariesLoaded();

    // 1. Create temporary off-screen container matching exact 210mm x 150mm aspect ratio
    const tempContainer = document.createElement('div');
    tempContainer.className = 'pdf-render-target';
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm';
    tempContainer.style.height = '150mm';
    tempContainer.style.minHeight = '150mm';
    tempContainer.style.maxHeight = '150mm';
    tempContainer.style.boxSizing = 'border-box';
    tempContainer.style.backgroundColor = '#FFFFFF';
    tempContainer.style.zIndex = '-9999';
    tempContainer.innerHTML = this.generateInvoiceHtml(invoiceData);

    document.body.appendChild(tempContainer);

    try {
      const targetSheet = tempContainer.querySelector('.invoice-sheet');

      // Sanitize any non-data URI images in the sheet to prevent browser canvas tainting in file:// mode
      targetSheet.querySelectorAll('img').forEach(img => {
        if (!img.src.startsWith('data:')) {
          const fallback = document.createElement('div');
          fallback.innerHTML = `
            <svg viewBox="0 0 64 64" width="14mm" height="14mm" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="30" fill="#FAF5EF" stroke="#C5A059" stroke-width="1.8" />
              <circle cx="32" cy="32" r="26" fill="none" stroke="#B76E79" stroke-width="0.8" stroke-dasharray="2,2" />
              <text x="32" y="40" font-family="'Playfair Display', serif" font-size="22" font-weight="700" font-style="italic" fill="#8F4853" text-anchor="middle">M</text>
            </svg>
          `;
          img.parentNode.replaceChild(fallback.firstElementChild, img);
        }
      });

      if (typeof onProgress === 'function') onProgress('Constructing 210 mm × 150 mm Landscape PDF...');

      // Initialize jsPDF with custom page size 210mm x 150mm landscape
      const doc = new jsPDFClass({
        orientation: 'landscape',
        unit: 'mm',
        format: [210, 150],
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
            windowWidth: 1050,
            windowHeight: 750
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
          console.warn('Canvas tainted, re-rendering with strict safe mode...', taintErr);
          targetSheet.querySelectorAll('img').forEach(img => img.remove());
          const cleanCanvas = await h2cFn(targetSheet, {
            scale: 2,
            useCORS: false,
            allowTaint: false,
            backgroundColor: '#FFFFFF'
          });
          imgData = cleanCanvas.toDataURL('image/jpeg', 0.95);
        }

        // Place image exactly onto 210mm x 150mm canvas
        doc.addImage(imgData, 'JPEG', 0, 0, 210, 150, undefined, 'FAST');
      } else {
        // Direct Native Vector jsPDF Fallback (Guaranteed to work even if html2canvas is blocked)
        this.renderNativeJsPdfVector(doc, invoiceData);
      }

      const fileName = `Invoice-${invoiceData.invoiceNumber || 'NEW'}.pdf`;

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
   * Direct vector drawing fallback inside jsPDF for 210mm x 150mm landscape
   */
  renderNativeJsPdfVector(doc, invoiceData) {
    const store = invoiceData.storeSnapshot || window.storageManager.getSettings();
    const calc = invoiceData.calculations;
    const payment = invoiceData.payment || {};
    const items = invoiceData.items || [];

    // Background and top bar
    doc.setFillColor(183, 110, 121);
    doc.rect(0, 0, 210, 4, 'F');

    // Header Store Info
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(35, 23, 26);
    doc.text(store.storeName || 'Mishab Luxury Cosmetics', 12, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(183, 110, 121);
    doc.text((store.storeTagline || 'Haute Parfumerie & Beauté').toUpperCase(), 12, 18);

    doc.setTextColor(90, 80, 82);
    doc.setFontSize(7.5);
    doc.text(`${store.address || ''}, ${store.cityStateZip || ''}`, 12, 22);
    doc.text(`Ph: ${store.phone || ''} | GSTIN: ${store.gstin || 'N/A'}`, 12, 26);

    // Header Right
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(143, 72, 83);
    doc.text('TAX INVOICE', 198, 14, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(35, 23, 26);
    doc.text(`Invoice No: ${invoiceData.invoiceNumber}`, 198, 18, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${invoiceData.invoiceDate} ${invoiceData.invoiceTime || ''}`, 198, 22, { align: 'right' });
    doc.text(`Status: ${(payment.status || 'PAID').toUpperCase()}`, 198, 26, { align: 'right' });

    // Customer strip
    doc.setFillColor(250, 247, 242);
    doc.rect(12, 29, 186, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 100, 102);
    doc.text('BILLED TO:', 15, 34);
    doc.setTextColor(30, 20, 25);
    doc.text(`${invoiceData.customerName || 'Walk-in Retail Customer'}  ${invoiceData.customerPhone ? '(' + invoiceData.customerPhone + ')' : ''}`, 33, 34);
    doc.text(`Payment: ${payment.mode || 'Cash'}`, 195, 34, { align: 'right' });

    // Table Header
    doc.setFillColor(244, 236, 225);
    doc.rect(12, 39, 186, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(45, 35, 37);
    doc.text('#', 15, 43);
    doc.text('Product Description', 24, 43);
    doc.text('Qty', 110, 43, { align: 'center' });
    doc.text('Rate (Rs)', 135, 43, { align: 'right' });
    doc.text('Disc', 155, 43, { align: 'right' });
    doc.text('Tax %', 170, 43, { align: 'center' });
    doc.text('Amount (Rs)', 195, 43, { align: 'right' });

    // Table Rows
    let y = 49;
    doc.setFont('helvetica', 'normal');
    items.slice(0, 7).forEach((it, idx) => {
      doc.text(String(idx + 1), 15, y);
      doc.text(String(it.name).substring(0, 45), 24, y);
      doc.text(String(it.quantity), 110, y, { align: 'center' });
      doc.text(Number(it.unitPrice).toFixed(2), 135, y, { align: 'right' });
      doc.text(it.discountAmount > 0 ? Number(it.discountAmount).toFixed(2) : '-', 155, y, { align: 'right' });
      doc.text(`${it.taxRate || 18}%`, 170, y, { align: 'center' });
      doc.text(Number(it.lineTotal || it.grossAmount).toFixed(2), 195, y, { align: 'right' });
      y += 6;
    });

    // Summary Box
    doc.setDrawColor(230, 220, 210);
    doc.line(12, 105, 198, 105);

    // Left Footer
    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(50, 40, 45);
    doc.text(`Amount in Words: ${calc.amountInWords || 'Rupees Zero Only'}`, 12, 112);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`UPI ID: ${store.upiId || 'mishabcosmetics@okaxis'} | ${store.returnPolicy || 'Exchanges within 7 days'}`, 12, 118);
    doc.text(`${store.footerNote || 'Thank you for shopping with Mishab Luxury Cosmetics!'}`, 12, 124);
    doc.text('Authorized Signatory ___________________', 12, 138);

    // Right Summary
    let sumY = 110;
    const addSumRow = (label, val, isBold = false) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(isBold ? 9 : 7.5);
      doc.setTextColor(isBold ? 143 : 70, isBold ? 72 : 60, isBold ? 83 : 65);
      doc.text(label, 155, sumY);
      doc.text(`Rs. ${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 198, sumY, { align: 'right' });
      sumY += 5;
    };

    addSumRow('Subtotal:', calc.preTaxSubtotal || calc.itemsGross);
    if (calc.totalDiscountCombined > 0) addSumRow('Total Discount:', -calc.totalDiscountCombined);
    addSumRow('Taxable Value:', calc.taxableAmount);
    if (calc.totalTax > 0) addSumRow('GST Tax:', calc.totalTax);
    if (calc.totalAdditionalCharges > 0) addSumRow('Additional Charges:', calc.totalAdditionalCharges);
    addSumRow('GRAND TOTAL:', calc.grandTotal, true);
  },

  /**
   * Native Browser Printing directly configured for 210mm x 150mm landscape
   */
  printInvoice(invoiceData) {
    const printArea = document.getElementById('print-container');
    if (!printArea) {
      const div = document.createElement('div');
      div.id = 'print-container';
      div.className = 'print-only-container';
      document.body.appendChild(div);
    }
    const container = document.getElementById('print-container');
    container.innerHTML = this.generateInvoiceHtml(invoiceData);

    // Trigger print
    window.print();
  }
};

window.InvoiceEngine = InvoiceEngine;
