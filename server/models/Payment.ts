import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  invoice_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  party_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Party', required: true },
  date: { type: String, required: true },
  amount: { type: Number, required: true },
  payment_method: { type: String, enum: ['Cash', 'Bank Transfer', 'Cheque', 'Other'], default: 'Cash' },
  reference: { type: String },
  notes: { type: String },
  journal_entry_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JournalEntry' },
}, { timestamps: true });

// After saving a payment, update the corresponding invoice's amount_received
PaymentSchema.post('save', async function(doc) {
  const Invoice = mongoose.model('Invoice');
  const invoice: any = await Invoice.findById(doc.invoice_id);
  if (invoice) {
    invoice.amount_received += doc.amount;
    await invoice.save();
  }
});

export const Payment = mongoose.model('Payment', PaymentSchema);
