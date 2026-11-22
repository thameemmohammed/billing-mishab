/**
 * Mishab Luxury Cosmetics - Storage Management Module
 * Handles localStorage persistence for store settings, product inventory,
 * invoice records, and active draft states.
 */

const STORAGE_KEYS = {
  SETTINGS: 'mishab_beauty_store_settings',
  INVENTORY: 'mishab_beauty_inventory',
  INVOICES: 'mishab_beauty_invoices',
  DRAFT: 'mishab_beauty_billing_draft',
  COUNTER: 'mishab_beauty_invoice_counter'
};

// Initial 20 Required Sample Products
const INITIAL_PRODUCTS = [
  { id: 'prod-1', name: 'Glow & Shine Face Wash', category: 'Skincare', price: 249, sku: 'SKN-101', stock: 45, unit: 'Bottle', taxRate: 18, description: 'Gentle foaming cleanser with botanical extracts' },
  { id: 'prod-2', name: 'Vitamin C Face Serum', category: 'Skincare', price: 599, sku: 'SKN-102', stock: 32, unit: 'Bottle', taxRate: 18, description: '20% active Vitamin C with Ferulic Acid' },
  { id: 'prod-3', name: 'Aloe Vera Moisturizer', category: 'Skincare', price: 349, sku: 'SKN-103', stock: 50, unit: 'Jar', taxRate: 18, description: 'Soothing ultra-light gel-cream hydration' },
  { id: 'prod-4', name: 'SPF 50 Sunscreen', category: 'Skincare', price: 499, sku: 'SKN-104', stock: 38, unit: 'Tube', taxRate: 18, description: 'Broad-spectrum matte finish UV defense' },
  { id: 'prod-5', name: 'Rose Water Toner', category: 'Skincare', price: 199, sku: 'SKN-105', stock: 42, unit: 'Bottle', taxRate: 18, description: '100% pure steam-distilled Damask rose water' },
  { id: 'prod-6', name: 'Matte Liquid Foundation', category: 'Makeup', price: 699, sku: 'MKP-201', stock: 25, unit: 'Bottle', taxRate: 18, description: '24-hour flawless medium-to-full buildable coverage' },
  { id: 'prod-7', name: 'Velvet Matte Lipstick', category: 'Makeup', price: 299, sku: 'MKP-202', stock: 65, unit: 'Piece', taxRate: 18, description: 'Richly pigmented hydrating matte lipstick' },
  { id: 'prod-8', name: 'Waterproof Mascara', category: 'Makeup', price: 399, sku: 'MKP-203', stock: 30, unit: 'Piece', taxRate: 18, description: 'Volumizing lash-extension waterproof formula' },
  { id: 'prod-9', name: 'Liquid Eyeliner', category: 'Makeup', price: 249, sku: 'MKP-204', stock: 48, unit: 'Piece', taxRate: 18, description: 'Precision felt-tip jet black 24hr eyeliner' },
  { id: 'prod-10', name: 'Compact Face Powder', category: 'Makeup', price: 349, sku: 'MKP-205', stock: 35, unit: 'Compact', taxRate: 18, description: 'Micro-fine oil-control blur setting powder' },
  { id: 'prod-11', name: 'Blush Palette', category: 'Makeup', price: 549, sku: 'MKP-206', stock: 20, unit: 'Palette', taxRate: 18, description: '4-pan luminous peach and rose blush shades' },
  { id: 'prod-12', name: 'Makeup Setting Spray', category: 'Makeup', price: 449, sku: 'MKP-207', stock: 28, unit: 'Bottle', taxRate: 18, description: 'Long-lasting hydrating dewy lock-in mist' },
  { id: 'prod-13', name: 'Nail Polish - Cherry Red', category: 'Nail Care', price: 99, sku: 'NAL-301', stock: 85, unit: 'Bottle', taxRate: 18, description: 'High-gloss chip-resistant salon finish enamel' },
  { id: 'prod-14', name: 'Nail Polish Remover', category: 'Nail Care', price: 79, sku: 'NAL-302', stock: 55, unit: 'Bottle', taxRate: 18, description: 'Acetone-free nourishing argan oil formula' },
  { id: 'prod-15', name: 'Hair Repair Shampoo', category: 'Hair Care', price: 299, sku: 'HAR-401', stock: 40, unit: 'Bottle', taxRate: 18, description: 'Sulphate-free restorative keratin infusion' },
  { id: 'prod-16', name: 'Keratin Hair Conditioner', category: 'Hair Care', price: 349, sku: 'HAR-402', stock: 36, unit: 'Bottle', taxRate: 18, description: 'Deep conditioning silk moisture treatment' },
  { id: 'prod-17', name: 'Hair Growth Serum', category: 'Hair Care', price: 499, sku: 'HAR-403', stock: 22, unit: 'Dropper', taxRate: 18, description: 'Redensyl + Procapil peptide hair density booster' },
  { id: 'prod-18', name: 'Body Lotion - Vanilla', category: 'Body Care', price: 279, sku: 'BDY-501', stock: 32, unit: 'Bottle', taxRate: 18, description: 'Warm Madagascar vanilla & shea butter moisturiser' },
  { id: 'prod-19', name: 'Luxury Body Wash', category: 'Body Care', price: 399, sku: 'BDY-502', stock: 30, unit: 'Bottle', taxRate: 18, description: 'Sensual amber blossom silky shower creme' },
  { id: 'prod-20', name: 'Under-Eye Cream', category: 'Skincare', price: 449, sku: 'SKN-106', stock: 24, unit: 'Tube', taxRate: 18, description: 'Caffeine & niacinamide dark circle brightener' }
];

// Initial Store Profile Settings
const DEFAULT_STORE_SETTINGS = {
  storeName: 'Mishab Luxury Cosmetics',
  storeTagline: 'Haute Parfumerie & Beauté',
  logoUrl: 'assets/logo/mishab-logo.svg',
  address: 'Boulevard 14, Luxury Galleria, Indiranagar',
  cityStateZip: 'Bengaluru, Karnataka - 560038',
  phone: '+91 98765 43210',
  email: 'concierge@mishabcosmetics.com',
  website: 'www.mishabcosmetics.com',
  gstin: '29AABCM1234F1Z8',
  businessRegNo: 'CIN: U52399KA2024PTC189211',
  currencySymbol: '₹',
  invoicePrefix: 'INV-2026-',
  invoiceStartNumber: 101,
  defaultTaxMode: 'exclusive', // 'exclusive' or 'inclusive'
  defaultGstTreatment: 'cgst_sgst', // 'cgst_sgst' or 'igst' or 'exempt'
  defaultTaxRate: 18,
  footerNote: 'Thank you for shopping with Mishab Luxury Cosmetics. Glow with confidence!',
  returnPolicy: 'Exchanges accepted within 7 days with original invoice & unbroken seal. Personal cosmetics cannot be returned once unsealed.',
  paymentInfo: 'GPay / PhonePe / Paytm / Cards Accepted',
  upiId: 'mishabcosmetics@okaxis',
  bankName: 'HDFC Bank - Indiranagar Branch',
  accountNumber: '50200088991234',
  ifscCode: 'HDFC0001234'
};

// Seed sample past invoices for demo and testing
const INITIAL_SAMPLE_INVOICES = [
  {
    id: 'inv-2026-101',
    invoiceNumber: 'INV-2026-101',
    invoiceDate: '2026-11-20',
    invoiceTime: '14:35',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98451 22334',
    customerEmail: 'ananya.s@gmail.com',
    customerAddress: 'Richmond Town, Bengaluru',
    customerGstin: '',
    customerNotes: 'VIP Member #882',
    taxMode: 'exclusive',
    gstTreatment: 'cgst_sgst',
    overallDiscountType: 'fixed',
    overallDiscountValue: 100,
    packagingCharge: 0,
    deliveryCharge: 0,
    serviceCharge: 0,
    otherCharges: 0,
    items: [
      { id: 'prod-2', name: 'Vitamin C Face Serum', sku: 'SKN-102', category: 'Skincare', quantity: 1, unit: 'Bottle', unitPrice: 599, discountType: 'fixed', discountValue: 0, taxRate: 18, amount: 599 },
      { id: 'prod-4', name: 'SPF 50 Sunscreen', sku: 'SKN-104', category: 'Skincare', quantity: 1, unit: 'Tube', unitPrice: 499, discountType: 'fixed', discountValue: 0, taxRate: 18, amount: 499 },
      { id: 'prod-7', name: 'Velvet Matte Lipstick', sku: 'MKP-202', category: 'Makeup', quantity: 2, unit: 'Piece', unitPrice: 299, discountType: 'percentage', discountValue: 10, taxRate: 18, amount: 538.2 }
    ],
    calculations: {
      itemsSubtotal: 1696.2,
      productDiscounts: 59.8,
      overallDiscount: 100,
      taxableAmount: 1536.2,
      cgstRate: 9,
      cgstAmount: 138.26,
      sgstRate: 9,
      sgstAmount: 138.26,
      igstRate: 0,
      igstAmount: 0,
      totalTax: 276.52,
      additionalCharges: 0,
      unroundedTotal: 1812.72,
      roundOff: 0.28,
      grandTotal: 1813,
      amountInWords: 'Rupees One Thousand Eight Hundred Thirteen Only'
    },
    payment: {
      mode: 'UPI',
      amountPaid: 1813,
      balanceDue: 0,
      status: 'Paid',
      transactionRef: 'UPI/632190822189'
    },
    storeSnapshot: { ...DEFAULT_STORE_SETTINGS },
    createdAt: '2026-11-20T14:35:00.000Z'
  },
  {
    id: 'inv-2026-102',
    invoiceNumber: 'INV-2026-102',
    invoiceDate: '2026-11-21',
    invoiceTime: '17:10',
    customerName: 'Priya Mehra',
    customerPhone: '+91 99002 44556',
    customerEmail: 'priya.mehra@outlook.com',
    customerAddress: 'Koramangala 4th Block, Bengaluru',
    customerGstin: '',
    customerNotes: 'Gift packaging requested',
    taxMode: 'exclusive',
    gstTreatment: 'cgst_sgst',
    overallDiscountType: 'percentage',
    overallDiscountValue: 5,
    packagingCharge: 50,
    deliveryCharge: 0,
    serviceCharge: 0,
    otherCharges: 0,
    items: [
      { id: 'prod-6', name: 'Matte Liquid Foundation', sku: 'MKP-201', category: 'Makeup', quantity: 1, unit: 'Bottle', unitPrice: 699, discountType: 'fixed', discountValue: 0, taxRate: 18, amount: 699 },
      { id: 'prod-11', name: 'Blush Palette', sku: 'MKP-206', category: 'Makeup', quantity: 1, unit: 'Palette', unitPrice: 549, discountType: 'fixed', discountValue: 0, taxRate: 18, amount: 549 },
      { id: 'prod-12', name: 'Makeup Setting Spray', sku: 'MKP-207', category: 'Makeup', quantity: 1, unit: 'Bottle', unitPrice: 449, discountType: 'fixed', discountValue: 0, taxRate: 18, amount: 449 }
    ],
    calculations: {
      itemsSubtotal: 1697,
      productDiscounts: 0,
      overallDiscount: 84.85,
      taxableAmount: 1612.15,
      cgstRate: 9,
      cgstAmount: 145.10,
      sgstRate: 9,
      sgstAmount: 145.10,
      igstRate: 0,
      igstAmount: 0,
      totalTax: 290.20,
      additionalCharges: 50,
      unroundedTotal: 1952.35,
      roundOff: -0.35,
      grandTotal: 1952,
      amountInWords: 'Rupees One Thousand Nine Hundred Fifty Two Only'
    },
    payment: {
      mode: 'Credit Card',
      amountPaid: 1952,
      balanceDue: 0,
      status: 'Paid',
      transactionRef: 'AUTH-VISA-9042'
    },
    storeSnapshot: { ...DEFAULT_STORE_SETTINGS },
    createdAt: '2026-11-21T17:10:00.000Z'
  }
];

class StorageManager {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_STORE_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.INVOICES)) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_SAMPLE_INVOICES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.COUNTER)) {
      localStorage.setItem(STORAGE_KEYS.COUNTER, '103');
    }
  }

  // --- Settings ---
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_STORE_SETTINGS };
    } catch (e) {
      console.error('Error reading settings from localStorage', e);
      return { ...DEFAULT_STORE_SETTINGS };
    }
  }

  saveSettings(settings) {
    try {
      const updated = { ...this.getSettings(), ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error saving settings to localStorage', e);
      return null;
    }
  }

  // --- Inventory ---
  getInventory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      return data ? JSON.parse(data) : [...INITIAL_PRODUCTS];
    } catch (e) {
      console.error('Error reading inventory', e);
      return [...INITIAL_PRODUCTS];
    }
  }

  saveInventory(products) {
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(products));
      return true;
    } catch (e) {
      console.error('Error saving inventory', e);
      return false;
    }
  }

  addProduct(product) {
    const products = this.getInventory();
    const newProduct = {
      id: 'prod-' + Date.now(),
      name: product.name.trim(),
      category: product.category || 'Skincare',
      price: Number(product.price) || 0,
      sku: (product.sku || 'SKU-' + Math.floor(100 + Math.random() * 900)).toUpperCase(),
      stock: Number(product.stock) || 0,
      unit: product.unit || 'Piece',
      taxRate: Number(product.taxRate) || 18,
      description: product.description || ''
    };
    products.unshift(newProduct);
    this.saveInventory(products);
    return newProduct;
  }

  updateProduct(id, updatedFields) {
    const products = this.getInventory();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updatedFields,
      price: Number(updatedFields.price !== undefined ? updatedFields.price : products[index].price),
      stock: Number(updatedFields.stock !== undefined ? updatedFields.stock : products[index].stock),
      taxRate: Number(updatedFields.taxRate !== undefined ? updatedFields.taxRate : products[index].taxRate)
    };
    this.saveInventory(products);
    return products[index];
  }

  deleteProduct(id) {
    let products = this.getInventory();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length !== products.length) {
      this.saveInventory(filtered);
      return true;
    }
    return false;
  }

  adjustStock(productId, delta) {
    const products = this.getInventory();
    const p = products.find(item => item.id === productId);
    if (p) {
      p.stock = Math.max(0, (p.stock || 0) + delta);
      this.saveInventory(products);
    }
  }

  // --- Invoices ---
  getInvoices() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading invoices', e);
      return [];
    }
  }

  saveInvoice(invoice) {
    try {
      const invoices = this.getInvoices();
      // Ensure unique ID
      if (!invoice.id) {
        invoice.id = 'inv-' + Date.now();
      }
      // Check if updating existing or inserting new
      const existingIdx = invoices.findIndex(inv => inv.id === invoice.id || inv.invoiceNumber === invoice.invoiceNumber);
      if (existingIdx >= 0) {
        invoices[existingIdx] = invoice;
      } else {
        invoices.unshift(invoice);
      }
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));

      // Advance counter if this matches the prefix pattern
      const settings = this.getSettings();
      const numMatch = invoice.invoiceNumber.match(/(\d+)$/);
      if (numMatch) {
        const currentNum = parseInt(numMatch[1], 10);
        const storedCounter = parseInt(localStorage.getItem(STORAGE_KEYS.COUNTER) || '101', 10);
        if (currentNum >= storedCounter) {
          localStorage.setItem(STORAGE_KEYS.COUNTER, (currentNum + 1).toString());
        }
      }

      // Deduct stock for inventory items in this bill
      if (Array.isArray(invoice.items)) {
        invoice.items.forEach(item => {
          if (item.id && !item.id.startsWith('custom-')) {
            this.adjustStock(item.id, -(item.quantity || 1));
          }
        });
      }

      return invoice;
    } catch (e) {
      console.error('Error saving invoice', e);
      return null;
    }
  }

  deleteInvoice(id) {
    const invoices = this.getInvoices();
    const filtered = invoices.filter(inv => inv.id !== id && inv.invoiceNumber !== id);
    if (filtered.length !== invoices.length) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  getNextInvoiceNumber() {
    const settings = this.getSettings();
    const counter = parseInt(localStorage.getItem(STORAGE_KEYS.COUNTER) || '101', 10);
    const prefix = settings.invoicePrefix || 'INV-2026-';
    return `${prefix}${counter}`;
  }

  // --- Draft Persistence ---
  getDraft() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRAFT);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveDraft(draftData) {
    try {
      localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draftData));
    } catch (e) {
      console.error('Error saving draft', e);
    }
  }

  clearDraft() {
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  }

  // --- Reset to default factory sample data ---
  resetToDemo() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_STORE_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_SAMPLE_INVOICES));
    localStorage.setItem(STORAGE_KEYS.COUNTER, '103');
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  }
}

// Global instance
window.storageManager = new StorageManager();
