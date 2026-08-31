import express, { Request, Response } from 'express';
import { Payment } from '../models/Payment.js';
import { syncPaymentJournalEntry } from '../utils/journalHelpers.js';

const router = express.Router();

router.get('/:invoiceId', async (req: Request, res: Response) => {
  try {
    const payments = await Payment.find({ invoice_id: req.params.invoiceId }).sort({ createdAt: -1 });
    res.json(payments.map((p: any) => ({ ...p.toObject(), id: p._id.toString() })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const newPayment = new Payment(req.body);
    await newPayment.save();
    await syncPaymentJournalEntry(newPayment);
    res.json({ ...newPayment.toObject(), id: newPayment._id.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

export default router;
