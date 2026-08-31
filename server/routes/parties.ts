import express, { Request, Response } from 'express';
import { Party } from '../models/Party.js';
import { Invoice } from '../models/Invoice.js';
import { JournalEntry } from '../models/Journal.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string;
    const filter = type ? { party_type: type } : {};
    const parties = await Party.find(filter).sort({ name: 1 });
    res.json(parties.map((p: any) => ({ ...p.toObject(), id: p._id.toString() })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch parties' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (data.party_type === 'customer' && !data.customer_code) {
      const lastCustomer = await Party.findOne({ party_type: 'customer' }).sort({ createdAt: -1 });
      let nextNum = 1001;
      if (lastCustomer && lastCustomer.customer_code) {
        const parts = lastCustomer.customer_code.split('-');
        if (parts.length === 2 && !isNaN(Number(parts[1]))) {
          nextNum = parseInt(parts[1]) + 1;
        }
      }
      data.customer_code = `CUST-${nextNum}`;
    }
    const newParty = new Party(data);
    await newParty.save();
    res.json({ ...newParty.toObject(), id: newParty._id.toString() });
  } catch (error: any) {
    console.error('Party Create Error:', error);
    res.status(500).json({ error: error.message || 'Failed to create party' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const updated = await Party.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ ...updated.toObject(), id: updated._id.toString() });
  } catch (error: any) {
    console.error('Party Update Error:', error);
    res.status(500).json({ error: error.message || 'Failed to update party' });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<any> => {
  try {
    const partyId = req.params.id;
    const invoiceInUse = await Invoice.findOne({ party_id: partyId });
    const journalInUse = await JournalEntry.findOne({ 'lines.party_id': partyId });
    if (invoiceInUse || journalInUse) {
      return res.status(403).json({ error: 'Cannot delete party because it is used in existing transactions' });
    }
    await Party.findByIdAndDelete(partyId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete party' });
  }
});

export default router;
