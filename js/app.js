/**
 * Mishab Luxury Cosmetics & Beauté - Master Application Controller
 * Connects StorageManager, BillingEngine, and InvoiceEngine with modern UI state management.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const App = {
    currentView: 'dashboard',
    activeBill: null,
    searchInventoryTerm: '',
    selectedCategory: 'All',
    historySearchTerm: '',
    historyStatusFilter: 'All',

    init() {
      this.initActiveBill();
      this.bindNavigation();
      this.bindDashboardEvents();
      this.bindBillingEvents();
      this.bindInventoryEvents();
      this.bindHistoryEvents();
      this.bindSettingsEvents();
      this.bindModalEvents();

      // Initial View Render
      this.switchView('dashboard');
      this.renderQuickCatalog();
      this.renderInventoryTable();
      this.renderInvoiceHistory();
      this.loadStoreSettingsForm();
    },

    // ------------------------------------------------------------------------
    // TOAST NOTIFICATIONS
    // ------------------------------------------------------------------------
    showToast(message, type = 'success') {
      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      
      const icon = type === 'success' 
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2E7D32" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
        : type === 'error'
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C62828" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C5A059" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;

      toast.innerHTML = `
        ${icon}
        <div style="flex:1;">${message}</div>
      `;

      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    },

    // ------------------------------------------------------------------------
    // VIEW NAVIGATION
    // ------------------------------------------------------------------------
    bindNavigation() {
      // Desktop Nav Links
      document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = link.getAttribute('data-view');
          this.switchView(target);
        });
      });

      // Mobile Bottom Nav Items
      document.querySelectorAll('.mobile-bottom-bar .mobile-nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const target = item.getAttribute('data-view');
          this.switchView(target);
        });
      });

      // Mobile Hamburger
      const menuBtn = document.getElementById('mobile-menu-toggle');
      const sidebar = document.getElementById('app-sidebar');
      if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
          sidebar.classList.toggle('mobile-open');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
          if (window.innerWidth <= 768 && sidebar.classList.contains('mobile-open')) {
            if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
              sidebar.classList.remove('mobile-open');
            }
          }
        });
      }
    },

    switchView(viewName) {
      this.currentView = viewName;

      // Close mobile sidebar if open
      const sidebar = document.getElementById('app-sidebar');
      if (sidebar) sidebar.classList.remove('mobile-open');

      // Update Section visibility
      document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active-view');
      });
      const activeSection = document.getElementById(`view-${viewName}`);
      if (activeSection) activeSection.classList.add('active-view');

      // Update Sidebar active state
      document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-view') === viewName);
      });

      // Update Mobile Nav active state
      document.querySelectorAll('.mobile-bottom-bar .mobile-nav-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-view') === viewName);
      });

      // Update Topbar Title
      const pageHeading = document.getElementById('topbar-page-heading');
      const pageSub = document.getElementById('topbar-page-sub');
      const titles = {
        dashboard: { main: 'Dashboard', sub: 'Store Performance & Quick Operations' },
        billing: { main: 'Create New Bill', sub: 'Interactive POS & 210mm × 150mm Invoicing' },
        inventory: { main: 'Product Inventory', sub: 'Cosmetics Catalog, Pricing & Stock Control' },
        invoices: { main: 'Invoice History', sub: 'Archived Tax Invoices & Print Management' },
        settings: { main: 'Store Settings', sub: 'Business Identity, Tax Rules & Receipts Policy' }
      };
      if (pageHeading && titles[viewName]) {
        pageHeading.textContent = titles[viewName].main;
        pageSub.textContent = titles[viewName].sub;
      }

      // View-specific refreshes
      if (viewName === 'dashboard') {
        this.renderDashboard();
      } else if (viewName === 'inventory') {
        this.renderInventoryTable();
      } else if (viewName === 'invoices') {
        this.renderInvoiceHistory();
      } else if (viewName === 'settings') {
        this.loadStoreSettingsForm();
      } else if (viewName === 'billing') {
        this.renderActiveBillUI();
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // ------------------------------------------------------------------------
    // DASHBOARD
    // ------------------------------------------------------------------------
    bindDashboardEvents() {
      // CTA "Create New Bill" buttons on dashboard
      document.querySelectorAll('.action-go-billing').forEach(btn => {
        btn.addEventListener('click', () => this.switchView('billing'));
      });
      document.querySelectorAll('.action-go-inventory').forEach(btn => {
        btn.addEventListener('click', () => this.switchView('inventory'));
      });
      document.querySelectorAll('.action-go-invoices').forEach(btn => {
        btn.addEventListener('click', () => this.switchView('invoices'));
      });
      document.querySelectorAll('.action-go-settings').forEach(btn => {
        btn.addEventListener('click', () => this.switchView('settings'));
      });
    },

    renderDashboard() {
      const invoices = window.storageManager.getInvoices();
      const inventory = window.storageManager.getInventory();
      const settings = window.storageManager.getSettings();

      // Calculate Metrics
      const totalInvoices = invoices.length;
      const totalSales = invoices.reduce((sum, inv) => sum + (inv.calculations?.grandTotal || 0), 0);
      const totalProducts = inventory.length;
      const lowStockCount = inventory.filter(p => (p.stock || 0) <= 10).length;

      // Update UI Counters
      const elStoreName = document.getElementById('dash-store-name');
      const elTotalSales = document.getElementById('dash-total-sales');
      const elTotalInvoices = document.getElementById('dash-total-invoices');
      const elTotalProducts = document.getElementById('dash-total-products');
      const elLowStock = document.getElementById('dash-low-stock');

      if (elStoreName) elStoreName.textContent = settings.storeName || 'Mishab Luxury Cosmetics';
      if (elTotalSales) elTotalSales.textContent = `₹ ${totalSales.toLocaleString('en-IN')}`;
      if (elTotalInvoices) elTotalInvoices.textContent = totalInvoices;
      if (elTotalProducts) elTotalProducts.textContent = totalProducts;
      if (elLowStock) elLowStock.textContent = lowStockCount;

      // Render Recent Invoices (up to 5)
      const recentListContainer = document.getElementById('dashboard-recent-invoices-tbody');
      if (recentListContainer) {
        if (invoices.length === 0) {
          recentListContainer.innerHTML = `
            <tr>
              <td colspan="6" class="text-center" style="padding: 24px; color: var(--text-muted);">
                No invoices recorded yet. Click "Create New Bill" to generate your first invoice.
              </td>
            </tr>
          `;
        } else {
          recentListContainer.innerHTML = invoices.slice(0, 5).map(inv => {
            const statusClass = inv.payment?.status === 'Paid' ? 'badge-paid' : (inv.payment?.status === 'Partially Paid' ? 'badge-partial' : 'badge-unpaid');
            return `
              <tr>
                <td><strong>${inv.invoiceNumber}</strong></td>
                <td>${inv.invoiceDate}</td>
                <td>${inv.customerName || 'Walk-in Customer'}</td>
                <td><strong>₹ ${(inv.calculations?.grandTotal || 0).toLocaleString('en-IN')}</strong></td>
                <td><span class="status-badge ${statusClass}">${inv.payment?.status || 'Paid'}</span></td>
                <td>
                  <div class="actions-cell">
                    <button class="icon-action-btn" title="Preview Bill" onclick="App.previewInvoiceById('${inv.id}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    </button>
                    <button class="icon-action-btn" title="Download 210x150mm PDF" onclick="App.downloadInvoiceById('${inv.id}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </button>
                    <button class="icon-action-btn" title="Print Bill" onclick="App.printInvoiceById('${inv.id}')">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('');
        }
      }
    },

    // ------------------------------------------------------------------------
    // BILLING & NEW BILL CREATION (CORE MODULE)
    // ------------------------------------------------------------------------
    initActiveBill() {
      const savedDraft = window.storageManager.getDraft();
      const settings = window.storageManager.getSettings();
      const now = new Date();

      if (savedDraft && savedDraft.items && savedDraft.items.length > 0) {
        this.activeBill = savedDraft;
      } else {
        const todayStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().substring(0, 5);

        this.activeBill = {
          invoiceNumber: window.storageManager.getNextInvoiceNumber(),
          invoiceDate: todayStr,
          invoiceTime: timeStr,
          referenceNo: '',
          dueDate: '',
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          customerAddress: '',
          customerGstin: '',
          customerNotes: '',
          taxMode: settings.defaultTaxMode || 'exclusive',
          gstTreatment: settings.defaultGstTreatment || 'cgst_sgst',
          enableTax: true,
          overallDiscountType: 'percentage',
          overallDiscountValue: 0,
          packagingCharge: 0,
          deliveryCharge: 0,
          serviceCharge: 0,
          otherCharges: 0,
          items: [],
          payment: {
            mode: 'UPI',
            amountPaid: 0,
            transactionRef: '',
            isExactPaid: true
          }
        };
      }
    },

    bindBillingEvents() {
      // Walk-in Customer 1-Click Button
      const btnWalkIn = document.getElementById('btn-walkin-customer');
      if (btnWalkIn) {
        btnWalkIn.addEventListener('click', () => {
          this.activeBill.customerName = 'Walk-in Retail Customer';
          this.activeBill.customerPhone = '';
          this.activeBill.customerEmail = '';
          this.activeBill.customerAddress = '';
          this.activeBill.customerGstin = '';
          this.syncBillingInputsFromState();
          this.showToast('Applied Walk-in Customer details', 'info');
        });
      }

      // Catalog Search & Category Filter
      const catalogSearchInput = document.getElementById('catalog-search-input');
      if (catalogSearchInput) {
        catalogSearchInput.addEventListener('input', (e) => {
          this.searchInventoryTerm = e.target.value.toLowerCase().trim();
          this.renderQuickCatalog();
        });
      }

      // Custom Ad-hoc item toggle & form
      const toggleCustom = document.getElementById('custom-item-toggle');
      const customFields = document.getElementById('custom-item-fields');
      if (toggleCustom && customFields) {
        toggleCustom.addEventListener('click', () => {
          customFields.classList.toggle('show');
        });
      }

      const btnAddCustom = document.getElementById('btn-add-custom-item');
      if (btnAddCustom) {
        btnAddCustom.addEventListener('click', () => {
          const nameInput = document.getElementById('custom-item-name');
          const priceInput = document.getElementById('custom-item-price');
          const qtyInput = document.getElementById('custom-item-qty');
          const taxInput = document.getElementById('custom-item-tax');

          const name = (nameInput.value || '').trim();
          const price = parseFloat(priceInput.value) || 0;
          const qty = parseFloat(qtyInput.value) || 1;
          const taxRate = parseFloat(taxInput.value) || 18;

          if (!name) {
            this.showToast('Please enter an item name', 'error');
            nameInput.focus();
            return;
          }
          if (price <= 0) {
            this.showToast('Please enter a valid price', 'error');
            priceInput.focus();
            return;
          }

          this.addItemToBill({
            id: 'custom-' + Date.now(),
            name: name,
            sku: 'CUST-' + Math.floor(100 + Math.random() * 900),
            category: 'Custom Service',
            unit: 'Service/Item',
            unitPrice: price,
            quantity: qty,
            discountType: 'fixed',
            discountValue: 0,
            taxRate: taxRate
          });

          // Reset inputs
          nameInput.value = '';
          priceInput.value = '';
          qtyInput.value = '1';
          if (customFields) customFields.classList.remove('show');
          this.showToast(`Added "${name}" to bill`, 'success');
        });
      }

      // Accordion headers toggle
      document.querySelectorAll('.form-accordion .accordion-header').forEach(header => {
        header.addEventListener('click', () => {
          const parent = header.closest('.form-accordion');
          parent.classList.toggle('open');
        });
      });

      // Synchronize Form Inputs with activeBill state
      this.bindBillingFormInputs();

      // Bill Action Buttons
      const btnGenerate = document.getElementById('btn-generate-download-bill');
      if (btnGenerate) {
        btnGenerate.addEventListener('click', () => this.generateAndDownloadBill());
      }

      const btnPreview = document.getElementById('btn-preview-bill');
      if (btnPreview) {
        btnPreview.addEventListener('click', () => this.previewCurrentBill());
      }

      const btnClear = document.getElementById('btn-clear-bill');
      if (btnClear) {
        btnClear.addEventListener('click', () => {
          if (confirm('Are you sure you want to clear this billing draft?')) {
            window.storageManager.clearDraft();
            this.initActiveBill();
            this.renderActiveBillUI();
            this.showToast('Billing draft cleared', 'info');
          }
        });
      }

      // Mobile Sticky Bar Trigger
      const mobileCta = document.getElementById('mobile-sticky-cta-btn');
      if (mobileCta) {
        mobileCta.addEventListener('click', () => this.generateAndDownloadBill());
      }

      // Exact Paid Button
      const btnExactPaid = document.getElementById('btn-set-exact-paid');
      if (btnExactPaid) {
        btnExactPaid.addEventListener('click', () => {
          const calc = this.recalculateCurrentBill();
          const paidInput = document.getElementById('bill-amount-paid');
          if (paidInput) {
            paidInput.value = calc.grandTotal;
            this.activeBill.payment.amountPaid = calc.grandTotal;
            this.renderBillingSummary();
          }
        });
      }
    },

    bindBillingFormInputs() {
      // Map input IDs to activeBill properties
      const inputMap = {
        'bill-inv-number': (val) => { this.activeBill.invoiceNumber = val; },
        'bill-inv-date': (val) => { this.activeBill.invoiceDate = val; },
        'bill-inv-time': (val) => { this.activeBill.invoiceTime = val; },
        'bill-inv-ref': (val) => { this.activeBill.referenceNo = val; },
        'bill-inv-due': (val) => { this.activeBill.dueDate = val; },
        'bill-cust-name': (val) => { this.activeBill.customerName = val; },
        'bill-cust-phone': (val) => { this.activeBill.customerPhone = val; },
        'bill-cust-email': (val) => { this.activeBill.customerEmail = val; },
        'bill-cust-address': (val) => { this.activeBill.customerAddress = val; },
        'bill-cust-gstin': (val) => { this.activeBill.customerGstin = val; },
        'bill-cust-notes': (val) => { this.activeBill.customerNotes = val; },
        'bill-tax-mode': (val) => { this.activeBill.taxMode = val; },
        'bill-gst-treatment': (val) => { this.activeBill.gstTreatment = val; },
        'bill-overall-disc-type': (val) => { this.activeBill.overallDiscountType = val; },
        'bill-overall-disc-val': (val) => { this.activeBill.overallDiscountValue = parseFloat(val) || 0; },
        'bill-charge-pkg': (val) => { this.activeBill.packagingCharge = parseFloat(val) || 0; },
        'bill-charge-del': (val) => { this.activeBill.deliveryCharge = parseFloat(val) || 0; },
        'bill-charge-srv': (val) => { this.activeBill.serviceCharge = parseFloat(val) || 0; },
        'bill-charge-oth': (val) => { this.activeBill.otherCharges = parseFloat(val) || 0; },
        'bill-payment-mode': (val) => { this.activeBill.payment.mode = val; },
        'bill-payment-ref': (val) => { this.activeBill.payment.transactionRef = val; },
        'bill-amount-paid': (val) => {
          this.activeBill.payment.amountPaid = parseFloat(val) || 0;
          this.activeBill.payment.isExactPaid = false;
        }
      };

      Object.keys(inputMap).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', (e) => {
            inputMap[id](e.target.value);
            this.recalculateAndSaveDraft();
          });
          el.addEventListener('change', (e) => {
            inputMap[id](e.target.value);
            this.recalculateAndSaveDraft();
          });
        }
      });

      // Enable Tax Checkbox
      const taxToggle = document.getElementById('bill-enable-tax');
      if (taxToggle) {
        taxToggle.addEventListener('change', (e) => {
          this.activeBill.enableTax = e.target.checked;
          this.recalculateAndSaveDraft();
        });
      }
    },

    syncBillingInputsFromState() {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined && val !== null ? val : '';
      };

      setVal('bill-inv-number', this.activeBill.invoiceNumber);
      setVal('bill-inv-date', this.activeBill.invoiceDate);
      setVal('bill-inv-time', this.activeBill.invoiceTime);
      setVal('bill-inv-ref', this.activeBill.referenceNo);
      setVal('bill-inv-due', this.activeBill.dueDate);
      setVal('bill-cust-name', this.activeBill.customerName);
      setVal('bill-cust-phone', this.activeBill.customerPhone);
      setVal('bill-cust-email', this.activeBill.customerEmail);
      setVal('bill-cust-address', this.activeBill.customerAddress);
      setVal('bill-cust-gstin', this.activeBill.customerGstin);
      setVal('bill-cust-notes', this.activeBill.customerNotes);
      setVal('bill-tax-mode', this.activeBill.taxMode || 'exclusive');
      setVal('bill-gst-treatment', this.activeBill.gstTreatment || 'cgst_sgst');
      setVal('bill-overall-disc-type', this.activeBill.overallDiscountType || 'percentage');
      setVal('bill-overall-disc-val', this.activeBill.overallDiscountValue || 0);
      setVal('bill-charge-pkg', this.activeBill.packagingCharge || 0);
      setVal('bill-charge-del', this.activeBill.deliveryCharge || 0);
      setVal('bill-charge-srv', this.activeBill.serviceCharge || 0);
      setVal('bill-charge-oth', this.activeBill.otherCharges || 0);
      setVal('bill-payment-mode', this.activeBill.payment?.mode || 'UPI');
      setVal('bill-payment-ref', this.activeBill.payment?.transactionRef || '');

      const taxToggle = document.getElementById('bill-enable-tax');
      if (taxToggle) taxToggle.checked = this.activeBill.enableTax !== false;
    },

    addItemToBill(product) {
      const existing = this.activeBill.items.find(it => it.id === product.id);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
      } else {
        this.activeBill.items.push({
          id: product.id,
          name: product.name,
          sku: product.sku || '',
          category: product.category || 'Cosmetics',
          unit: product.unit || 'Piece',
          unitPrice: Number(product.price || product.unitPrice) || 0,
          quantity: 1,
          discountType: 'fixed',
          discountValue: 0,
          taxRate: product.taxRate || 18
        });
      }
      this.recalculateAndSaveDraft();
      this.renderSelectedItemsList();
    },

    updateItemQty(index, newQty) {
      const qty = Math.max(1, parseInt(newQty, 10) || 1);
      if (this.activeBill.items[index]) {
        this.activeBill.items[index].quantity = qty;
        this.recalculateAndSaveDraft();
        this.renderSelectedItemsList();
      }
    },

    updateItemPrice(index, newPrice) {
      const price = Math.max(0, parseFloat(newPrice) || 0);
      if (this.activeBill.items[index]) {
        this.activeBill.items[index].unitPrice = price;
        this.recalculateAndSaveDraft();
        this.renderSelectedItemsList();
      }
    },

    updateItemDiscount(index, discVal, discType = 'fixed') {
      if (this.activeBill.items[index]) {
        this.activeBill.items[index].discountValue = Math.max(0, parseFloat(discVal) || 0);
        this.activeBill.items[index].discountType = discType;
        this.recalculateAndSaveDraft();
        this.renderSelectedItemsList();
      }
    },

    removeItemFromBill(index) {
      if (this.activeBill.items[index]) {
        const removed = this.activeBill.items.splice(index, 1);
        this.recalculateAndSaveDraft();
        this.renderSelectedItemsList();
        this.showToast(`Removed "${removed[0].name}"`, 'info');
      }
    },

    recalculateCurrentBill() {
      const calc = window.BillingEngine.calculateBill({
        items: this.activeBill.items,
        taxMode: this.activeBill.taxMode,
        gstTreatment: this.activeBill.gstTreatment,
        enableTax: this.activeBill.enableTax !== false,
        overallDiscountType: this.activeBill.overallDiscountType,
        overallDiscountValue: this.activeBill.overallDiscountValue,
        packagingCharge: this.activeBill.packagingCharge,
        deliveryCharge: this.activeBill.deliveryCharge,
        serviceCharge: this.activeBill.serviceCharge,
        otherCharges: this.activeBill.otherCharges,
        amountPaid: this.activeBill.payment.amountPaid
      });

      this.activeBill.calculations = calc;

      // If user hasn't explicitly entered a custom paid amount, auto-sync paid with grand total
      if (this.activeBill.payment.isExactPaid) {
        this.activeBill.payment.amountPaid = calc.grandTotal;
        calc.amountPaid = calc.grandTotal;
        calc.balanceDue = 0;
        calc.paymentStatus = 'Paid';
        const paidInput = document.getElementById('bill-amount-paid');
        if (paidInput) paidInput.value = calc.grandTotal;
      }

      this.activeBill.payment.balanceDue = calc.balanceDue;
      this.activeBill.payment.status = calc.paymentStatus;

      return calc;
    },

    recalculateAndSaveDraft() {
      this.recalculateCurrentBill();
      window.storageManager.saveDraft(this.activeBill);
      this.renderBillingSummary();
    },

    renderActiveBillUI() {
      this.syncBillingInputsFromState();
      this.renderQuickCatalog();
      this.renderSelectedItemsList();
      this.recalculateAndSaveDraft();
    },

    renderQuickCatalog() {
      const container = document.getElementById('quick-catalog-grid');
      const chipsContainer = document.getElementById('category-chips-bar');
      if (!container) return;

      const inventory = window.storageManager.getInventory();

      // Extract unique categories
      const categories = ['All', ...new Set(inventory.map(p => p.category))];

      // Render category chips
      if (chipsContainer) {
        chipsContainer.innerHTML = categories.map(cat => `
          <button class="category-chip ${this.selectedCategory === cat ? 'active' : ''}" onclick="App.filterQuickCategory('${cat}')">
            ${cat}
          </button>
        `).join('');
      }

      // Filter products
      const filtered = inventory.filter(item => {
        const matchesCategory = this.selectedCategory === 'All' || item.category === this.selectedCategory;
        const matchesSearch = !this.searchInventoryTerm || 
          item.name.toLowerCase().includes(this.searchInventoryTerm) || 
          (item.sku && item.sku.toLowerCase().includes(this.searchInventoryTerm));
        return matchesCategory && matchesSearch;
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--text-muted);">
            No cosmetics products match "${this.searchInventoryTerm}".
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map(item => `
        <div class="quick-prod-card" onclick="App.addItemToBill(${JSON.stringify(item).replace(/"/g, '&quot;')})">
          <span class="quick-prod-category">${item.category}</span>
          <div class="quick-prod-title">${item.name}</div>
          <div class="quick-prod-footer">
            <span class="quick-prod-price">₹${item.price.toLocaleString('en-IN')}</span>
            <button class="quick-add-btn" title="Add to bill">+</button>
          </div>
        </div>
      `).join('');
    },

    filterQuickCategory(cat) {
      this.selectedCategory = cat;
      this.renderQuickCatalog();
    },

    renderSelectedItemsList() {
      const container = document.getElementById('bill-selected-items-list');
      if (!container) return;

      const items = this.activeBill.items || [];
      if (items.length === 0) {
        container.innerHTML = `
          <div class="empty-bill-message">
            <svg class="empty-bill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <p><strong>Your bill is currently empty.</strong></p>
            <p style="font-size: 0.8rem; margin-top: 4px;">Tap products from the catalog above or enter a custom treatment item to begin.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = items.map((item, idx) => {
        const itemCalc = window.BillingEngine.calculateLineItem(item, this.activeBill.taxMode);
        const safeName = (item.name || '').replace(/"/g, '&quot;');

        return `
          <div class="bill-item-card">
            <!-- Row 1: Item Name, SKU & Delete Button -->
            <div class="item-card-top-row">
              <div class="item-main-details">
                <input type="text" class="item-name-input" value="${safeName}" onchange="App.updateItemName(${idx}, this.value)" placeholder="Product name" />
                <div class="item-sub-meta">
                  <span>SKU: ${item.sku || 'N/A'}</span>
                  <span>•</span>
                  <span>Tax: ${item.taxRate || 18}%</span>
                </div>
              </div>
              <button type="button" class="btn-remove-row" title="Remove item" onclick="App.removeItemFromBill(${idx})" aria-label="Remove item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>

            <!-- Row 2: Controls Cluster (Qty Stepper, Rate, Total) -->
            <div class="item-card-bottom-row">
              <div class="stepper-col">
                <span class="control-mini-label">Qty</span>
                <div class="qty-stepper">
                  <button type="button" class="stepper-btn" onclick="App.updateItemQty(${idx}, ${item.quantity - 1})" aria-label="Decrease quantity">-</button>
                  <input type="number" class="qty-input" value="${item.quantity}" min="1" onchange="App.updateItemQty(${idx}, this.value)" />
                  <button type="button" class="stepper-btn" onclick="App.updateItemQty(${idx}, ${item.quantity + 1})" aria-label="Increase quantity">+</button>
                </div>
              </div>

              <div class="rate-control-wrap">
                <span class="control-mini-label">Rate (₹)</span>
                <input type="number" class="price-edit-input" value="${item.unitPrice}" min="0" step="any" onchange="App.updateItemPrice(${idx}, this.value)" />
              </div>

              <div class="item-total-col">
                <span class="control-mini-label">Total</span>
                <div class="item-row-total">₹${itemCalc.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    },

    updateItemName(index, newName) {
      if (this.activeBill.items[index]) {
        this.activeBill.items[index].name = newName.trim();
        this.recalculateAndSaveDraft();
      }
    },

    renderBillingSummary() {
      const calc = this.activeBill.calculations || this.recalculateCurrentBill();

      // UI elements
      const fmt = (v) => (Number(v) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const elSubtotal = document.getElementById('summary-subtotal');
      const elProdDisc = document.getElementById('summary-prod-discount');
      const elBillDisc = document.getElementById('summary-bill-discount');
      const elTaxable = document.getElementById('summary-taxable');
      const elTaxTotal = document.getElementById('summary-tax');
      const elCharges = document.getElementById('summary-charges');
      const elRoundOff = document.getElementById('summary-roundoff');
      const elGrandTotal = document.getElementById('summary-grand-total');
      const elWords = document.getElementById('summary-amount-words');
      const elBalance = document.getElementById('summary-balance-due');
      const elStatus = document.getElementById('summary-payment-status');

      if (elSubtotal) elSubtotal.textContent = `₹ ${fmt(calc.preTaxSubtotal || calc.itemsGross)}`;
      if (elProdDisc) elProdDisc.textContent = `-₹ ${fmt(calc.productDiscountsTotal)}`;
      if (elBillDisc) elBillDisc.textContent = `-₹ ${fmt(calc.overallDiscountAmount)}`;
      if (elTaxable) elTaxable.textContent = `₹ ${fmt(calc.taxableAmount)}`;
      if (elTaxTotal) elTaxTotal.textContent = `₹ ${fmt(calc.totalTax)}`;
      if (elCharges) elCharges.textContent = `₹ ${fmt(calc.totalAdditionalCharges)}`;
      if (elRoundOff) elRoundOff.textContent = `${calc.roundOff > 0 ? '+' : ''}₹ ${fmt(calc.roundOff)}`;
      if (elGrandTotal) elGrandTotal.textContent = `₹ ${fmt(calc.grandTotal)}`;
      if (elWords) elWords.textContent = calc.amountInWords;
      if (elBalance) elBalance.textContent = `₹ ${fmt(calc.balanceDue)}`;
      if (elStatus) elStatus.textContent = calc.paymentStatus;

      // Mobile Sticky Bar update
      const mobileItems = document.getElementById('mobile-sticky-items-count');
      const mobileTotal = document.getElementById('mobile-sticky-total');
      if (mobileItems) mobileItems.textContent = `${calc.itemsCount} ITEMS`;
      if (mobileTotal) mobileTotal.textContent = `₹ ${fmt(calc.grandTotal)}`;
    },

    // ------------------------------------------------------------------------
    // INVOICE GENERATION & 210mm x 150mm DOWNLOAD
    // ------------------------------------------------------------------------
    async generateAndDownloadBill() {
      // 1. Validation
      if (!this.activeBill.items || this.activeBill.items.length === 0) {
        this.showToast('Please add at least one beauty product before generating bill', 'error');
        return;
      }

      // Check item quantities & prices
      for (const it of this.activeBill.items) {
        if (!it.quantity || it.quantity <= 0) {
          this.showToast(`Invalid quantity for item "${it.name}"`, 'error');
          return;
        }
      }

      // Set fallback customer name if empty
      if (!this.activeBill.customerName || !this.activeBill.customerName.trim()) {
        this.activeBill.customerName = 'Walk-in Retail Customer';
      }

      // 2. Finalize Calculation
      const calc = this.recalculateCurrentBill();
      const storeSettings = window.storageManager.getSettings();

      const finalInvoice = {
        ...this.activeBill,
        id: 'inv-' + Date.now(),
        calculations: calc,
        storeSnapshot: { ...storeSettings },
        createdAt: new Date().toISOString()
      };

      // 3. Save to Invoice History & Deduct Inventory Stock
      const saved = window.storageManager.saveInvoice(finalInvoice);
      if (!saved) {
        this.showToast('Could not save invoice record. Please try again.', 'error');
        return;
      }

      // 4. Client-side PDF Generation (210mm x 150mm Landscape)
      this.showToast('Generating official 210mm × 150mm PDF document...', 'info');

      try {
        await window.InvoiceEngine.downloadPDF(finalInvoice, (msg) => {
          console.log(msg);
        });

        this.showToast(`Invoice ${finalInvoice.invoiceNumber} downloaded successfully!`, 'success');

        // 5. Clear current billing draft & Advance to next invoice
        window.storageManager.clearDraft();
        this.initActiveBill();
        this.renderActiveBillUI();

        // 6. Refresh Dashboard & History
        this.renderDashboard();
        this.renderInvoiceHistory();
        this.renderInventoryTable();

        // Show completed confirmation dialog with options
        this.showInvoiceSuccessModal(finalInvoice);
      } catch (err) {
        console.error(err);
        this.showToast('Error creating PDF: ' + err.message, 'error');
      }
    },

    previewCurrentBill() {
      if (!this.activeBill.items || this.activeBill.items.length === 0) {
        this.showToast('Please add products to preview invoice', 'error');
        return;
      }
      this.recalculateCurrentBill();
      const store = window.storageManager.getSettings();
      const previewData = {
        ...this.activeBill,
        customerName: this.activeBill.customerName || 'Walk-in Retail Customer',
        storeSnapshot: store
      };

      this.openInvoicePreviewModal(previewData);
    },

    previewInvoiceById(id) {
      const invoices = window.storageManager.getInvoices();
      const inv = invoices.find(item => item.id === id || item.invoiceNumber === id);
      if (inv) {
        this.openInvoicePreviewModal(inv);
      } else {
        this.showToast('Invoice not found', 'error');
      }
    },

    async downloadInvoiceById(id) {
      const invoices = window.storageManager.getInvoices();
      const inv = invoices.find(item => item.id === id || item.invoiceNumber === id);
      if (inv) {
        this.showToast(`Downloading 210mm × 150mm PDF for ${inv.invoiceNumber}...`, 'info');
        try {
          await window.InvoiceEngine.downloadPDF(inv);
          this.showToast('Downloaded successfully', 'success');
        } catch (e) {
          this.showToast('Download failed: ' + e.message, 'error');
        }
      }
    },

    printInvoiceById(id) {
      const invoices = window.storageManager.getInvoices();
      const inv = invoices.find(item => item.id === id || item.invoiceNumber === id);
      if (inv) {
        window.InvoiceEngine.printInvoice(inv);
      }
    },

    // ------------------------------------------------------------------------
    // MODALS: PREVIEW & SUCCESS
    // ------------------------------------------------------------------------
    bindModalEvents() {
      const backdrop = document.getElementById('invoice-preview-modal');
      const closeBtn = document.getElementById('modal-close-preview');
      if (backdrop && closeBtn) {
        closeBtn.addEventListener('click', () => backdrop.classList.remove('active'));
        backdrop.addEventListener('click', (e) => {
          if (e.target === backdrop) backdrop.classList.remove('active');
        });
      }

      // Success Modal Close
      const successModal = document.getElementById('invoice-success-modal');
      const closeSuccess = document.getElementById('modal-close-success');
      if (successModal && closeSuccess) {
        closeSuccess.addEventListener('click', () => successModal.classList.remove('active'));
      }
    },

    openInvoicePreviewModal(invoiceData) {
      const modal = document.getElementById('invoice-preview-modal');
      const container = document.getElementById('modal-preview-render-area');
      const titleSpan = document.getElementById('modal-preview-inv-number');
      if (!modal || !container) return;

      if (titleSpan) titleSpan.textContent = invoiceData.invoiceNumber;
      window.InvoiceEngine.renderPreview(invoiceData, container);

      // Auto-scale invoice sheet to fit mobile viewport dynamically
      const updateModalScale = () => {
        const viewport = modal.querySelector('.modal-preview-viewport');
        const scaler = document.getElementById('modal-preview-render-area');
        if (viewport && scaler) {
          const availWidth = viewport.clientWidth - 16;
          // 210mm in screen pixels at 96 DPI is ~794px, height is ~567px
          const scale = Math.min(1, Math.max(0.32, availWidth / 794));
          scaler.style.transform = `scale(${scale})`;
          scaler.style.transformOrigin = 'center top';
          scaler.style.marginBottom = `-${Math.round(567 * (1 - scale))}px`;
        }
      };

      // Bind modal action buttons
      const btnPdf = document.getElementById('modal-btn-download-pdf');
      const btnPrint = document.getElementById('modal-btn-print');

      if (btnPdf) {
        btnPdf.onclick = async () => {
          btnPdf.disabled = true;
          try {
            await window.InvoiceEngine.downloadPDF(invoiceData);
            this.showToast('PDF downloaded successfully!', 'success');
          } catch (e) {
            this.showToast('Failed to download: ' + e.message, 'error');
          } finally {
            btnPdf.disabled = false;
          }
        };
      }

      if (btnPrint) {
        btnPrint.onclick = () => {
          window.InvoiceEngine.printInvoice(invoiceData);
        };
      }

      modal.classList.add('active');
      requestAnimationFrame(updateModalScale);
      setTimeout(updateModalScale, 100);
      window.addEventListener('resize', updateModalScale, { passive: true });
    },

    showInvoiceSuccessModal(invoiceData) {
      const modal = document.getElementById('invoice-success-modal');
      const numSpan = document.getElementById('success-inv-num');
      const totalSpan = document.getElementById('success-inv-total');
      if (!modal) return;

      if (numSpan) numSpan.textContent = invoiceData.invoiceNumber;
      if (totalSpan) totalSpan.textContent = `₹ ${invoiceData.calculations.grandTotal.toLocaleString('en-IN')}`;

      const btnPrint = document.getElementById('success-btn-print');
      const btnRedownload = document.getElementById('success-btn-redownload');
      const btnNew = document.getElementById('success-btn-new-bill');

      if (btnPrint) {
        btnPrint.onclick = () => {
          window.InvoiceEngine.printInvoice(invoiceData);
        };
      }

      if (btnRedownload) {
        btnRedownload.onclick = async () => {
          await window.InvoiceEngine.downloadPDF(invoiceData);
        };
      }

      if (btnNew) {
        btnNew.onclick = () => {
          modal.classList.remove('active');
          this.switchView('billing');
        };
      }

      modal.classList.add('active');
    },

    // ------------------------------------------------------------------------
    // INVENTORY MANAGEMENT
    // ------------------------------------------------------------------------
    bindInventoryEvents() {
      // Inventory search
      const invSearch = document.getElementById('inv-table-search');
      if (invSearch) {
        invSearch.addEventListener('input', (e) => {
          this.renderInventoryTable(e.target.value.toLowerCase().trim());
        });
      }

      // Category filter dropdown
      const catFilter = document.getElementById('inv-table-category-filter');
      if (catFilter) {
        catFilter.addEventListener('change', () => {
          this.renderInventoryTable();
        });
      }

      // Add product modal trigger
      const btnOpenAdd = document.getElementById('btn-open-add-product');
      const addModal = document.getElementById('add-product-modal');
      const closeAdd = document.getElementById('modal-close-add-product');
      if (btnOpenAdd && addModal) {
        btnOpenAdd.addEventListener('click', () => {
          addModal.classList.add('active');
        });
        if (closeAdd) closeAdd.addEventListener('click', () => addModal.classList.remove('active'));
      }

      // Save new product form
      const formAdd = document.getElementById('form-add-product');
      if (formAdd) {
        formAdd.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = document.getElementById('add-prod-name').value.trim();
          const category = document.getElementById('add-prod-category').value;
          const price = parseFloat(document.getElementById('add-prod-price').value) || 0;
          const sku = document.getElementById('add-prod-sku').value.trim();
          const stock = parseInt(document.getElementById('add-prod-stock').value, 10) || 0;
          const unit = document.getElementById('add-prod-unit').value.trim() || 'Piece';
          const taxRate = parseFloat(document.getElementById('add-prod-tax').value) || 18;
          const description = document.getElementById('add-prod-desc').value.trim();

          if (!name || price <= 0) {
            this.showToast('Please enter valid product name and price', 'error');
            return;
          }

          window.storageManager.addProduct({
            name, category, price, sku, stock, unit, taxRate, description
          });

          addModal.classList.remove('active');
          formAdd.reset();
          this.renderInventoryTable();
          this.renderQuickCatalog();
          this.renderDashboard();
          this.showToast(`Product "${name}" added to inventory`, 'success');
        });
      }

      // Edit product modal & form
      const editModal = document.getElementById('edit-product-modal');
      const closeEdit = document.getElementById('modal-close-edit-product');
      if (editModal && closeEdit) {
        closeEdit.addEventListener('click', () => editModal.classList.remove('active'));
      }

      const formEdit = document.getElementById('form-edit-product');
      if (formEdit) {
        formEdit.addEventListener('submit', (e) => {
          e.preventDefault();
          const id = document.getElementById('edit-prod-id').value;
          const name = document.getElementById('edit-prod-name').value.trim();
          const category = document.getElementById('edit-prod-category').value;
          const price = parseFloat(document.getElementById('edit-prod-price').value) || 0;
          const sku = document.getElementById('edit-prod-sku').value.trim();
          const stock = parseInt(document.getElementById('edit-prod-stock').value, 10) || 0;
          const unit = document.getElementById('edit-prod-unit').value.trim();
          const taxRate = parseFloat(document.getElementById('edit-prod-tax').value) || 18;
          const description = document.getElementById('edit-prod-desc').value.trim();

          window.storageManager.updateProduct(id, {
            name, category, price, sku, stock, unit, taxRate, description
          });

          editModal.classList.remove('active');
          this.renderInventoryTable();
          this.renderQuickCatalog();
          this.renderDashboard();
          this.showToast(`Product "${name}" updated`, 'success');
        });
      }
    },

    renderInventoryTable(filterTerm = '') {
      const tbody = document.getElementById('inventory-table-tbody');
      const catFilterEl = document.getElementById('inv-table-category-filter');
      if (!tbody) return;

      const categoryFilter = catFilterEl ? catFilterEl.value : 'All';
      const inventory = window.storageManager.getInventory();

      // Populate category dropdown if needed
      if (catFilterEl && catFilterEl.options.length <= 1) {
        const cats = ['All', ...new Set(inventory.map(p => p.category))];
        catFilterEl.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
      }

      const filtered = inventory.filter(p => {
        const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
        const matchesTerm = !filterTerm || 
          p.name.toLowerCase().includes(filterTerm) || 
          (p.sku && p.sku.toLowerCase().includes(filterTerm));
        return matchesCat && matchesTerm;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" class="text-center" style="padding: 24px; color: var(--text-muted);">
              No products found.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(p => {
        const stockStatus = (p.stock || 0) <= 10 
          ? `<span class="status-badge badge-unpaid">Low (${p.stock})</span>` 
          : `<span class="status-badge badge-paid">${p.stock} units</span>`;

        return `
          <tr>
            <td><strong>${p.sku || 'N/A'}</strong></td>
            <td>
              <div style="font-weight: 600; color: var(--text-primary);">${p.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${p.description || ''}</div>
            </td>
            <td><span class="category-chip" style="font-size: 0.72rem; padding: 2px 8px;">${p.category}</span></td>
            <td><strong>₹ ${p.price.toLocaleString('en-IN')}</strong></td>
            <td>${p.unit || 'Piece'}</td>
            <td>${p.taxRate || 18}%</td>
            <td>${stockStatus}</td>
            <td>
              <div class="actions-cell">
                <button class="icon-action-btn" title="Add to current bill" onclick="App.addItemToBill(${JSON.stringify(p).replace(/"/g, '&quot;')}); App.showToast('Added ${p.name} to bill', 'success');">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button class="icon-action-btn" title="Edit product" onclick="App.openEditProductModal('${p.id}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="icon-action-btn btn-delete" title="Delete product" onclick="App.deleteProduct('${p.id}', '${p.name}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    },

    openEditProductModal(id) {
      const inventory = window.storageManager.getInventory();
      const product = inventory.find(p => p.id === id);
      if (!product) return;

      document.getElementById('edit-prod-id').value = product.id;
      document.getElementById('edit-prod-name').value = product.name;
      document.getElementById('edit-prod-category').value = product.category;
      document.getElementById('edit-prod-price').value = product.price;
      document.getElementById('edit-prod-sku').value = product.sku || '';
      document.getElementById('edit-prod-stock').value = product.stock || 0;
      document.getElementById('edit-prod-unit').value = product.unit || 'Piece';
      document.getElementById('edit-prod-tax').value = product.taxRate || 18;
      document.getElementById('edit-prod-desc').value = product.description || '';

      document.getElementById('edit-product-modal').classList.add('active');
    },

    deleteProduct(id, name) {
      if (confirm(`Are you sure you want to delete "${name}" from product inventory?`)) {
        window.storageManager.deleteProduct(id);
        this.renderInventoryTable();
        this.renderQuickCatalog();
        this.renderDashboard();
        this.showToast(`Product "${name}" deleted`, 'info');
      }
    },

    // ------------------------------------------------------------------------
    // INVOICE HISTORY
    // ------------------------------------------------------------------------
    bindHistoryEvents() {
      const searchInput = document.getElementById('history-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.historySearchTerm = e.target.value.toLowerCase().trim();
          this.renderInvoiceHistory();
        });
      }

      const statusSelect = document.getElementById('history-status-select');
      if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
          this.historyStatusFilter = e.target.value;
          this.renderInvoiceHistory();
        });
      }

      const dateInput = document.getElementById('history-date-filter');
      if (dateInput) {
        dateInput.addEventListener('change', () => {
          this.renderInvoiceHistory();
        });
      }
    },

    renderInvoiceHistory() {
      const tbody = document.getElementById('history-table-tbody');
      if (!tbody) return;

      const dateInput = document.getElementById('history-date-filter');
      const selectedDate = dateInput ? dateInput.value : '';

      const invoices = window.storageManager.getInvoices();

      const filtered = invoices.filter(inv => {
        const matchesTerm = !this.historySearchTerm ||
          inv.invoiceNumber.toLowerCase().includes(this.historySearchTerm) ||
          (inv.customerName && inv.customerName.toLowerCase().includes(this.historySearchTerm)) ||
          (inv.customerPhone && inv.customerPhone.includes(this.historySearchTerm));

        const matchesStatus = this.historyStatusFilter === 'All' || inv.payment?.status === this.historyStatusFilter;
        const matchesDate = !selectedDate || inv.invoiceDate === selectedDate;

        return matchesTerm && matchesStatus && matchesDate;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center" style="padding: 24px; color: var(--text-muted);">
              No invoices match the selected criteria.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(inv => {
        const statusClass = inv.payment?.status === 'Paid' ? 'badge-paid' : (inv.payment?.status === 'Partially Paid' ? 'badge-partial' : 'badge-unpaid');
        const itemsSummary = inv.items ? `${inv.items.length} items (${inv.calculations?.totalQuantity || inv.items.length} units)` : '0 items';

        return `
          <tr>
            <td><strong>${inv.invoiceNumber}</strong></td>
            <td>${inv.invoiceDate} <span style="font-size: 0.72rem; color: var(--text-muted);">${inv.invoiceTime || ''}</span></td>
            <td>
              <div style="font-weight: 600;">${inv.customerName || 'Walk-in Customer'}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${inv.customerPhone || ''}</div>
            </td>
            <td>${itemsSummary}</td>
            <td><strong>₹ ${(inv.calculations?.grandTotal || 0).toLocaleString('en-IN')}</strong></td>
            <td><span class="status-badge ${statusClass}">${inv.payment?.status || 'Paid'}</span></td>
            <td>
              <div class="actions-cell">
                <button class="icon-action-btn" title="View 210x150mm Bill" onclick="App.previewInvoiceById('${inv.id}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
                <button class="icon-action-btn" title="Download 210x150mm Landscape PDF" onclick="App.downloadInvoiceById('${inv.id}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
                <button class="icon-action-btn" title="Print Bill" onclick="App.printInvoiceById('${inv.id}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                </button>
                <button class="icon-action-btn btn-delete" title="Delete Invoice" onclick="App.deleteInvoice('${inv.id}', '${inv.invoiceNumber}')">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    },

    deleteInvoice(id, invNumber) {
      if (confirm(`Are you sure you want to permanently delete invoice ${invNumber}?`)) {
        window.storageManager.deleteInvoice(id);
        this.renderInvoiceHistory();
        this.renderDashboard();
        this.showToast(`Invoice ${invNumber} deleted`, 'info');
      }
    },

    // ------------------------------------------------------------------------
    // STORE INFORMATION SETTINGS
    // ------------------------------------------------------------------------
    loadStoreSettingsForm() {
      const settings = window.storageManager.getSettings();
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val !== undefined && val !== null ? val : '';
      };

      setVal('setting-store-name', settings.storeName);
      setVal('setting-store-tagline', settings.storeTagline);
      setVal('setting-address', settings.address);
      setVal('setting-city-state', settings.cityStateZip);
      setVal('setting-phone', settings.phone);
      setVal('setting-email', settings.email);
      setVal('setting-website', settings.website);
      setVal('setting-gstin', settings.gstin);
      setVal('setting-reg-no', settings.businessRegNo);
      setVal('setting-upi-id', settings.upiId);
      setVal('setting-bank-name', settings.bankName);
      setVal('setting-account-no', settings.accountNumber);
      setVal('setting-ifsc', settings.ifscCode);
      setVal('setting-tax-mode', settings.defaultTaxMode || 'exclusive');
      setVal('setting-gst-treatment', settings.defaultGstTreatment || 'cgst_sgst');
      setVal('setting-footer-note', settings.footerNote);
      setVal('setting-return-policy', settings.returnPolicy);

      // Logo preview
      const logoPreview = document.getElementById('setting-logo-preview');
      if (logoPreview) {
        logoPreview.src = settings.logoUrl || 'assets/logo/mishab-logo.svg';
      }
    },

    bindSettingsEvents() {
      // Save Settings Form
      const form = document.getElementById('form-store-settings');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const updated = {
            storeName: document.getElementById('setting-store-name').value.trim(),
            storeTagline: document.getElementById('setting-store-tagline').value.trim(),
            address: document.getElementById('setting-address').value.trim(),
            cityStateZip: document.getElementById('setting-city-state').value.trim(),
            phone: document.getElementById('setting-phone').value.trim(),
            email: document.getElementById('setting-email').value.trim(),
            website: document.getElementById('setting-website').value.trim(),
            gstin: document.getElementById('setting-gstin').value.trim(),
            businessRegNo: document.getElementById('setting-reg-no').value.trim(),
            upiId: document.getElementById('setting-upi-id').value.trim(),
            bankName: document.getElementById('setting-bank-name').value.trim(),
            accountNumber: document.getElementById('setting-account-no').value.trim(),
            ifscCode: document.getElementById('setting-ifsc').value.trim(),
            defaultTaxMode: document.getElementById('setting-tax-mode').value,
            defaultGstTreatment: document.getElementById('setting-gst-treatment').value,
            footerNote: document.getElementById('setting-footer-note').value.trim(),
            returnPolicy: document.getElementById('setting-return-policy').value.trim()
          };

          window.storageManager.saveSettings(updated);
          this.renderDashboard();
          this.showToast('Store settings saved successfully!', 'success');
        });
      }

      // Logo Upload Handler (converts to base64)
      const logoInput = document.getElementById('setting-logo-file');
      if (logoInput) {
        logoInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (file) {
            if (file.size > 2 * 1024 * 1024) {
              this.showToast('Logo file size should be under 2MB', 'error');
              return;
            }
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
              const base64Data = uploadEvent.target.result;
              window.storageManager.saveSettings({ logoUrl: base64Data });
              const logoPreview = document.getElementById('setting-logo-preview');
              if (logoPreview) logoPreview.src = base64Data;
              this.showToast('Store logo updated', 'success');
            };
            reader.readAsDataURL(file);
          }
        });
      }

      // Reset Logo to Default Monogram
      const btnResetLogo = document.getElementById('btn-reset-default-logo');
      if (btnResetLogo) {
        btnResetLogo.addEventListener('click', () => {
          window.storageManager.saveSettings({ logoUrl: 'assets/logo/mishab-logo.svg' });
          const logoPreview = document.getElementById('setting-logo-preview');
          if (logoPreview) logoPreview.src = 'assets/logo/mishab-logo.svg';
          this.showToast('Reset to default luxury crest logo', 'info');
        });
      }

      // Reset All Data to Demo Factory Settings
      const btnResetDemo = document.getElementById('btn-reset-demo-data');
      if (btnResetDemo) {
        btnResetDemo.addEventListener('click', () => {
          if (confirm('Are you sure you want to restore factory demo data? This will reset inventory, store settings, and sample invoices.')) {
            window.storageManager.resetToDemo();
            this.initActiveBill();
            this.renderDashboard();
            this.renderInventoryTable();
            this.renderInvoiceHistory();
            this.loadStoreSettingsForm();
            this.showToast('Factory demo data restored!', 'success');
          }
        });
      }
    }
  };

  // Expose to window for inline onclick handlers
  window.App = App;
  App.init();
});
