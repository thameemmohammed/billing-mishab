# Mishab Luxury Cosmetics & Beauté — Billing Management System

An elegant, commercial-grade, mobile-first billing and Point of Sale (POS) website designed specifically for beauty, skincare, and luxury cosmetics boutiques. Built purely with **HTML5, CSS3, and Vanilla JavaScript** (zero frontend frameworks).

---

## 🌟 Key Features

### 1. Custom 210 mm × 150 mm Landscape Invoicing
- **Exact Paper Size**: Length: 21 cm (210 mm) × Width: 15 cm (150 mm).
- **Orientation**: Landscape format tailored for boutique cosmetics receipts.
- **Client-Side PDF Generation**: Generates high-definition, 300 DPI print-ready PDFs using custom-dimensioned `jsPDF` (`[210, 150]` mm) and `html2canvas`.
- **Automatic File Naming**: Saved as `Invoice-${invoiceNumber}.pdf` (e.g. `Invoice-INV-2026-101.pdf`).
- **Native Print Integration**: Custom CSS `@media print` rules configured with `@page { size: 210mm 150mm landscape; margin: 0; }`.
- **Responsive Preview Viewport**: On-screen modal accurately scales the 210 mm × 150 mm bill to fit smartphone screens without clipping.

### 2. Luxury Boutique UI/UX Aesthetic
- **Color Palette**: Soft ivory (`#FAF7F2`), delicate cream (`#FDFBF7`), blush pink (`#F5E8E4`), muted rose gold (`#B76E79`), champagne gold (`#C5A059`), and charcoal typography (`#231C1E`).
- **Typography**: Editorial serif headings (`Playfair Display` & `Cormorant Garamond`) paired with modern UI typography (`Plus Jakarta Sans`).
- **Interactive Controls**: Touch steppers, live category filter chips, search-as-you-type autocomplete, floating summary bar, and toast alerts.

### 3. Mobile-First Responsiveness
- **Bottom Navigation Bar**: Sleek mobile app navigation with tabs for *Dashboard*, *Products*, *Quick Bill*, *History*, and *Settings*.
- **Touch-Friendly Controls**: Minimum 44px tap targets, +/- quantity buttons, and swipe-friendly horizontal category chips.
- **Sticky Billing Summary Bar**: Mobile bottom bar tracks line items and grand total live with quick access to generate bills.

### 4. Advanced Invoicing & Tax Engine (`billing.js`)
- **Flexible Tax Configuration**:
  - Tax-Exclusive Pricing (taxes calculated on top of net item prices).
  - Tax-Inclusive Pricing (item prices already contain GST).
  - Intra-State GST: Splits into **CGST** (50%) and **SGST** (50%).
  - Inter-State GST: Computes single unified **IGST** (100%).
  - Tax-Exempt Mode.
- **Multi-Tier Discount System**:
  - Product-level percentage or fixed rupee discount.
  - Overall bill-level percentage or flat discount.
- **Additional Service & Logistics Charges**:
  - Packaging & luxury gift wrapping charges.
  - Delivery / courier fees.
  - Service charges and custom fees.
- **Automated Round-Off Adjustment**:
  - Exact round-off to the nearest integer rupee.
- **Indian Currency in Words**:
  - Converts numbers into Indian numbering format (Crores, Lakhs, Thousands, Hundreds, Tens, Units, and decimal Paise).
  - Example: `₹ 2,499.00` → *"Rupees Two Thousand Four Hundred Ninety Nine Only"*.
- **Payment & Balance Tracking**:
  - Supports UPI (GPay/PhonePe), Cash, Credit Card, Debit Card, and Bank Transfer.
  - Tracks paid amount, remaining balance, and auto-assigns status: *Paid*, *Partially Paid*, or *Unpaid*.

### 5. Product Inventory & Stock Management
- **Preloaded Sample Catalog**: 20 authentic beauty & cosmetics items across 5 core categories:
  - **Skincare**: Glow & Shine Face Wash, Vitamin C Face Serum, Aloe Vera Moisturizer, SPF 50 Sunscreen, Rose Water Toner, Under-Eye Cream.
  - **Makeup**: Matte Liquid Foundation, Velvet Matte Lipstick, Waterproof Mascara, Liquid Eyeliner, Compact Face Powder, Blush Palette, Makeup Setting Spray.
  - **Nail Care**: Nail Polish - Cherry Red, Nail Polish Remover.
  - **Hair Care**: Hair Repair Shampoo, Keratin Hair Conditioner, Hair Growth Serum.
  - **Body Care**: Body Lotion - Vanilla, Luxury Body Wash.
- **Full Inventory Controls**: Add new products, edit price/stock/tax rate, search, filter by category, and delete with safety confirmation.
- **Stock Tracking**: Inventory stock is automatically adjusted whenever an invoice is generated.

### 6. Store Information & Branding Settings
- Customize store business name, tagline, address, phone, email, website.
- Official GSTIN number and business registration details.
- Custom logo upload (converts image to Base64 in `localStorage`) or reset to default luxury monogram crest.
- Custom return/exchange policies and footer gratitude notes.
- Bank account details and UPI ID for customer QR / payments.

### 7. Persistent LocalStorage System
- All store settings, inventory updates, drafts, and invoice history persist locally in the browser.
- Safe draft recovery prevents accidental data loss during tab switching.

---

## 📁 Project Structure

```
beauty-billing/
├── index.html              # Main HTML5 Semantic Application
├── css/
│   └── style.css           # Custom Luxury Cosmetics CSS & 210x150mm Print Styles
├── js/
│   ├── app.js              # Application Controller & UI Event Orchestration
│   ├── billing.js          # Financial Engine, GST Distributions & Number-to-Words
│   ├── invoice.js          # 210mm x 150mm Template Renderer & jsPDF Generator
│   └── storage.js          # LocalStorage CRUD & Preloaded Catalog Persistence
├── vendor/
│   ├── jspdf.umd.min.js    # jsPDF v2.5.1 Library
│   └── html2canvas.min.js  # html2canvas v1.4.1 High-DPI Canvas Capture
├── assets/
│   └── logo/
│       └── mishab-logo.svg # Default Luxury Monogram Crest Logo
└── README.md               # Documentation & Specifications
```

---

## 🚀 How to Run the Website

1. Simply open `index.html` in any modern web browser (Google Chrome, Safari, Firefox, Edge).
2. Or serve it via any static local web server:
   ```bash
   # Using Python 3:
   python3 -m http.server 8080
   ```
   Then open `http://localhost:8080` in your browser or phone.

---

## 🖨️ Printing & PDF Verification

- To verify the **210 mm × 150 mm** dimension:
  1. Click **Create New Bill**.
  2. Select any products from the quick catalog (e.g. *Vitamin C Face Serum*, *Velvet Matte Lipstick*).
  3. Click **GENERATE & DOWNLOAD BILL** or **Preview Bill** → **Download 210×150mm PDF**.
  4. Open the downloaded PDF in Acrobat Reader or your PDF viewer.
  5. Check **File Properties / Page Setup**:
     - Paper Size: `210.0 × 150.0 mm` (8.27 × 5.91 inches).
     - Orientation: Landscape.
