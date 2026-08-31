import mongoose from 'mongoose';

const InvoiceSectionSchema = new mongoose.Schema({
  description: { type: String, default: '' },
  vendor_amount: { type: Number, required: true, default: 0 },
  selling_amount: { type: Number, required: true, default: 0 },
});

const InvoiceSchema = new mongoose.Schema({
  invoice_number: { type: String, required: true, unique: true },
  party_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['Draft', 'Sent', 'Partial', 'Paid'], default: 'Draft' },
  
  // Sections
  hotel: [InvoiceSectionSchema],
  tickets: [InvoiceSectionSchema],
  visa: [InvoiceSectionSchema],
  other: [InvoiceSectionSchema],
  
  // Totals
  total_vendor_amount: { type: Number, default: 0 },
  total_selling_amount: { type: Number, default: 0 },
  total_profit: { type: Number, default: 0 },
  amount_received: { type: Number, default: 0 },
  journal_entry_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
}, { timestamps: true });

// Pre-save hook to calculate totals
InvoiceSchema.pre('save', function() {
  let vendorTotal = 0;
  let sellingTotal = 0;

  const sections = ['hotel', 'tickets', 'visa', 'other'];
  
  sections.forEach(section => {
    // @ts-ignore
    if (this[section] && this[section].length > 0) {
      // @ts-ignore
      this[section].forEach((item: any) => {
        vendorTotal += (item.vendor_amount || 0);
        sellingTotal += (item.selling_amount || 0);
      });
    }
  });

  this.total_vendor_amount = vendorTotal;
  this.total_selling_amount = sellingTotal;
  this.total_profit = sellingTotal - vendorTotal;

  // Update status based on payment
  if (this.amount_received >= this.total_selling_amount && this.total_selling_amount > 0) {
    this.status = 'Paid';
  } else if (this.amount_received > 0) {
    this.status = 'Partial';
  }
});

export const Invoice = mongoose.model('Invoice', InvoiceSchema);
