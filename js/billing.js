/**
 * Mishab Luxury Cosmetics - Billing Calculation Engine
 * Provides accurate financial calculations, Indian GST distribution,
 * tax inclusive/exclusive logic, round-off adjustments, and Indian currency in words.
 */

const BillingEngine = {
  /**
   * Safe decimal round to 2 places
   */
  round2(num) {
    return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
  },

  /**
   * Format currency for UI display (e.g. ₹ 1,249.00)
   */
  formatCurrency(amount, symbol = '₹') {
    const val = Number(amount) || 0;
    return `${symbol} ${val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  },

  /**
   * Calculate single line item
   * @param {Object} item - { quantity, unitPrice, discountType, discountValue, taxRate }
   * @param {String} taxMode - 'exclusive' or 'inclusive'
   */
  calculateLineItem(item, taxMode = 'exclusive') {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    const gross = this.round2(qty * unitPrice);

    let discVal = Number(item.discountValue) || 0;
    let discAmount = 0;
    if (item.discountType === 'percentage') {
      discVal = Math.min(100, Math.max(0, discVal));
      discAmount = this.round2(gross * (discVal / 100));
    } else {
      discAmount = Math.min(gross, Math.max(0, discVal));
    }

    const net = this.round2(Math.max(0, gross - discAmount));
    const taxRate = Math.max(0, Number(item.taxRate) || 0);

    let taxable = net;
    let taxAmount = 0;

    if (taxMode === 'inclusive') {
      // In inclusive mode, net contains the tax
      taxAmount = this.round2(net - (net / (1 + (taxRate / 100))));
      taxable = this.round2(net - taxAmount);
    } else {
      // In exclusive mode, tax is added on top of net
      taxAmount = this.round2(net * (taxRate / 100));
    }

    const lineTotal = taxMode === 'inclusive' ? net : this.round2(net + taxAmount);

    return {
      quantity: qty,
      unitPrice: unitPrice,
      grossAmount: gross,
      discountAmount: discAmount,
      taxableAmount: taxable,
      taxRate: taxRate,
      taxAmount: taxAmount,
      lineTotal: lineTotal
    };
  },

  /**
   * Complete Bill Calculation
   */
  calculateBill(config) {
    const {
      items = [],
      taxMode = 'exclusive', // 'exclusive' | 'inclusive'
      gstTreatment = 'cgst_sgst', // 'cgst_sgst' | 'igst' | 'exempt'
      enableTax = true,
      overallDiscountType = 'percentage', // 'percentage' | 'fixed'
      overallDiscountValue = 0,
      packagingCharge = 0,
      deliveryCharge = 0,
      serviceCharge = 0,
      otherCharges = 0,
      amountPaid = 0
    } = config;

    let itemsGross = 0;
    let productDiscountsTotal = 0;
    let preTaxSubtotal = 0; // Sum of line net amounts

    // Calculate each item
    const evaluatedItems = items.map((rawItem, idx) => {
      const calc = this.calculateLineItem(rawItem, taxMode);
      itemsGross += calc.grossAmount;
      productDiscountsTotal += calc.discountAmount;
      preTaxSubtotal += (calc.grossAmount - calc.discountAmount);

      return {
        ...rawItem,
        serialNo: idx + 1,
        ...calc
      };
    });

    itemsGross = this.round2(itemsGross);
    productDiscountsTotal = this.round2(productDiscountsTotal);
    preTaxSubtotal = this.round2(preTaxSubtotal);

    // Bill Overall Discount
    let overallDiscountAmount = 0;
    const billDiscVal = Math.max(0, Number(overallDiscountValue) || 0);
    if (overallDiscountType === 'percentage') {
      const clampedPct = Math.min(100, billDiscVal);
      overallDiscountAmount = this.round2(preTaxSubtotal * (clampedPct / 100));
    } else {
      overallDiscountAmount = Math.min(preTaxSubtotal, billDiscVal);
    }

    // Effective taxable base after overall discount
    const netBaseAfterDiscount = Math.max(0, this.round2(preTaxSubtotal - overallDiscountAmount));
    const discountFactor = preTaxSubtotal > 0 ? (netBaseAfterDiscount / preTaxSubtotal) : 1;

    // Distribute taxes across lines with discount factor applied
    let totalTaxableValue = 0;
    let totalTax = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    // Determine weighted or primary tax rates for breakdown
    let totalCgstRate = 0;
    let totalSgstRate = 0;
    let totalIgstRate = 0;

    if (enableTax && gstTreatment !== 'exempt') {
      evaluatedItems.forEach(item => {
        const itemLineNet = item.grossAmount - item.discountAmount;
        const proratedLineNet = this.round2(itemLineNet * discountFactor);
        const rate = item.taxRate || 0;

        let lineTaxable = proratedLineNet;
        let lineTax = 0;

        if (taxMode === 'inclusive') {
          lineTax = this.round2(proratedLineNet - (proratedLineNet / (1 + (rate / 100))));
          lineTaxable = this.round2(proratedLineNet - lineTax);
        } else {
          lineTax = this.round2(proratedLineNet * (rate / 100));
          lineTaxable = proratedLineNet;
        }

        totalTaxableValue += lineTaxable;
        totalTax += lineTax;

        if (gstTreatment === 'cgst_sgst') {
          const halfTax = this.round2(lineTax / 2);
          cgstAmount += halfTax;
          sgstAmount += (lineTax - halfTax); // preserve exact cent
          totalCgstRate = Math.max(totalCgstRate, rate / 2);
          totalSgstRate = Math.max(totalSgstRate, rate / 2);
        } else if (gstTreatment === 'igst') {
          igstAmount += lineTax;
          totalIgstRate = Math.max(totalIgstRate, rate);
        }
      });
    } else {
      totalTaxableValue = netBaseAfterDiscount;
      totalTax = 0;
    }

    totalTaxableValue = this.round2(totalTaxableValue);
    totalTax = this.round2(totalTax);
    cgstAmount = this.round2(cgstAmount);
    sgstAmount = this.round2(sgstAmount);
    igstAmount = this.round2(igstAmount);

    // Additional charges
    const pkg = Math.max(0, Number(packagingCharge) || 0);
    const del = Math.max(0, Number(deliveryCharge) || 0);
    const srv = Math.max(0, Number(serviceCharge) || 0);
    const oth = Math.max(0, Number(otherCharges) || 0);
    const totalAdditionalCharges = this.round2(pkg + del + srv + oth);

    // Unrounded grand total
    let unroundedTotal = 0;
    if (taxMode === 'inclusive') {
      unroundedTotal = this.round2(netBaseAfterDiscount + totalAdditionalCharges);
    } else {
      unroundedTotal = this.round2(totalTaxableValue + totalTax + totalAdditionalCharges);
    }

    // Round-off adjustment to nearest integer rupee
    const roundedTotal = Math.round(unroundedTotal);
    const roundOff = this.round2(roundedTotal - unroundedTotal);
    const grandTotal = Math.max(0, roundedTotal);

    // Payment & Balance
    const numericPaid = Math.max(0, Number(amountPaid) || 0);
    const balanceDue = Math.max(0, this.round2(grandTotal - numericPaid));

    let paymentStatus = 'Unpaid';
    if (numericPaid >= grandTotal && grandTotal > 0) {
      paymentStatus = 'Paid';
    } else if (numericPaid > 0 && numericPaid < grandTotal) {
      paymentStatus = 'Partially Paid';
    } else if (grandTotal === 0) {
      paymentStatus = 'Paid';
    }

    const words = this.numberToWordsIndian(grandTotal);

    return {
      items: evaluatedItems,
      itemsCount: items.length,
      totalQuantity: items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0),
      itemsGross,
      productDiscountsTotal,
      preTaxSubtotal,
      overallDiscountType,
      overallDiscountValue: billDiscVal,
      overallDiscountAmount,
      totalDiscountCombined: this.round2(productDiscountsTotal + overallDiscountAmount),
      taxableAmount: totalTaxableValue,
      taxMode,
      gstTreatment,
      enableTax,
      cgstRate: totalCgstRate,
      cgstAmount,
      sgstRate: totalSgstRate,
      sgstAmount,
      igstRate: totalIgstRate,
      igstAmount,
      totalTax,
      packagingCharge: pkg,
      deliveryCharge: del,
      serviceCharge: srv,
      otherCharges: oth,
      totalAdditionalCharges,
      unroundedTotal,
      roundOff,
      grandTotal,
      amountPaid: numericPaid,
      balanceDue,
      paymentStatus,
      amountInWords: words
    };
  },

  /**
   * Convert number to words in Indian numbering system
   * Example: 2549 -> "Rupees Two Thousand Five Hundred Forty Nine Only"
   */
  numberToWordsIndian(num) {
    const val = Math.floor(Math.abs(Number(num) || 0));
    if (val === 0) return 'Rupees Zero Only';

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertChunk = (n) => {
      let str = '';
      if (n >= 100) {
        str += units[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += units[n] + ' ';
      }
      return str.trim();
    };

    let result = '';
    let remaining = val;

    // Crores (1,00,00,000)
    const crores = Math.floor(remaining / 10000000);
    remaining %= 10000000;
    if (crores > 0) {
      result += convertChunk(crores) + ' Crore ';
    }

    // Lakhs (1,00,000)
    const lakhs = Math.floor(remaining / 100000);
    remaining %= 100000;
    if (lakhs > 0) {
      result += convertChunk(lakhs) + ' Lakh ';
    }

    // Thousands (1,000)
    const thousands = Math.floor(remaining / 1000);
    remaining %= 1000;
    if (thousands > 0) {
      result += convertChunk(thousands) + ' Thousand ';
    }

    // Hundreds & below
    if (remaining > 0) {
      result += convertChunk(remaining);
    }

    // Handle decimal paise if any
    const originalNum = Number(num) || 0;
    const decimalPart = Math.round((Math.abs(originalNum) - Math.floor(Math.abs(originalNum))) * 100);
    let paiseStr = '';
    if (decimalPart > 0) {
      paiseStr = ` and ${convertChunk(decimalPart)} Paise`;
    }

    return `Rupees ${result.trim()}${paiseStr} Only`;
  }
};

window.BillingEngine = BillingEngine;
