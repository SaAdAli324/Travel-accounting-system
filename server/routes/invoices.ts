import express, { Request, Response } from 'express';
import { Invoice } from '../models/Invoice.js';
import { JournalEntry } from '../models/Journal.js';
import { Payment } from '../models/Payment.js';
import { syncInvoiceJournalEntry } from '../utils/journalHelpers.js';
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
    const count = await Invoice.countDocuments();
    const invoice_number = `INV-${new Date().getFullYear()}-${1000 + count + 1}`;
    
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
