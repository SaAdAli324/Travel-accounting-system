import express, { Request, Response } from 'express';
import { Invoice } from '../models/Invoice.js';
import { JournalEntry } from '../models/Journal.js';
import { Payment } from '../models/Payment.js';
import { syncInvoiceJournalEntry, syncPaymentJournalEntry } from '../utils/journalHelpers.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find().populate('party_id').sort({ createdAt: -1 });
    res.json(invoices.map((inv: any) => ({ ...inv.toObject(), id: inv._id.toString() })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const year = new Date().getFullYear();
    const lastInvoice = await Invoice.findOne({ invoice_number: new RegExp(`^INV-${year}-`) }).sort({ createdAt: -1 });
    let nextNum = 1001;
    if (lastInvoice && lastInvoice.invoice_number) {
      const parts = lastInvoice.invoice_number.split('-');
      if (parts.length === 3) {
        nextNum = parseInt(parts[2], 10) + 1;
      }
    }
    const invoice_number = `INV-${year}-${nextNum}`;
    
    const newInvoice = new Invoice({
      ...req.body,
      invoice_number
    });
    
    await newInvoice.save();
    await syncInvoiceJournalEntry(newInvoice);
    res.json({ ...newInvoice.toObject(), id: newInvoice._id.toString() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

router.post('/:id/refund', async (req: Request, res: Response): Promise<any> => {
  try {
    let invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Not found' });
    
    const refundData = {
      date: new Date().toISOString().split('T')[0],
      description: req.body.description,
      vendor_amount: Number(req.body.vendor_amount) || 0,
      selling_amount: Number(req.body.selling_amount) || 0,
    };
    
    // Add refund to invoice and save FIRST to avoid VersionError
    invoice.refunds = invoice.refunds || [];
    invoice.refunds.push(refundData);
    await invoice.save(); // This will recalculate totals via pre-save hook
    await syncInvoiceJournalEntry(invoice);
    
    // Check if we need to issue a cash refund (negative payment)
    if (invoice.amount_received > 0 && refundData.selling_amount > 0) {
      const cashRefund = Math.min(invoice.amount_received, refundData.selling_amount);
      
      const refundPayment = new Payment({
        invoice_id: invoice._id,
        party_id: invoice.party_id,
        date: refundData.date,
        amount: -cashRefund, // Negative amount for cash out
        payment_method: 'Cash',
        notes: `Refund: ${refundData.description}`
      });
      // The Payment schema's post('save') hook will automatically update invoice.amount_received
      await refundPayment.save();
      await syncPaymentJournalEntry(refundPayment);
    }
    
    // Re-fetch to return the final state
    invoice = await Invoice.findById(req.params.id);
    res.json({ ...invoice!.toObject(), id: invoice!._id.toString() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Not found' });
    if (invoice.status === 'Paid') {
      return res.status(403).json({ error: 'Paid invoices cannot be edited' });
    }
    
    invoice.set(req.body);
    await invoice.save();
    await syncInvoiceJournalEntry(invoice);
    
    res.json({ ...invoice.toObject(), id: invoice._id.toString() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<any> => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Not found' });
    if (invoice.status === 'Paid') {
      return res.status(403).json({ error: 'Paid invoices cannot be deleted' });
    }
    
    await Invoice.findByIdAndDelete(req.params.id);
    if (invoice.journal_entry_id) {
      await JournalEntry.findByIdAndDelete(invoice.journal_entry_id);
    }
    
    const payments = await Payment.find({ invoice_id: req.params.id });
    for (const p of payments) {
      if (p.journal_entry_id) await JournalEntry.findByIdAndDelete(p.journal_entry_id);
    }
    await Payment.deleteMany({ invoice_id: req.params.id });
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

export default router;
