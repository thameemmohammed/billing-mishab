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
      if (typeof onProgress === 'function') onProgress('Rendering ultra-crisp print canvas...');

      // Wait for fonts/images to settle
      await new Promise(r => setTimeout(r, 200));

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

      // html2canvas capture at scale: 3 for ~300 DPI crystal clarity
      const canvas = await window.html2canvas(targetSheet, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#FFFFFF',
        windowWidth: 1050,
        windowHeight: 750
      });

      if (typeof onProgress === 'function') onProgress('Constructing 210 mm × 150 mm Landscape PDF...');

      const { jsPDF } = window.jspdf;

      // jsPDF configuration with custom page size 210mm x 150mm landscape
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [210, 150],
        compress: true
      });

      let imgData = null;
      try {
        imgData = canvas.toDataURL('image/jpeg', 0.98);
      } catch (taintErr) {
        console.warn('Canvas tainted, re-rendering with strict safe mode...', taintErr);
        // Fallback: strip all images and re-render canvas cleanly
        targetSheet.querySelectorAll('img').forEach(img => img.remove());
        const cleanCanvas = await window.html2canvas(targetSheet, {
          scale: 2,
          useCORS: false,
          allowTaint: false,
          backgroundColor: '#FFFFFF'
        });
        imgData = cleanCanvas.toDataURL('image/jpeg', 0.95);
      }

      // Place image exactly onto 210mm x 150mm canvas
      doc.addImage(imgData, 'JPEG', 0, 0, 210, 150, undefined, 'FAST');

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
