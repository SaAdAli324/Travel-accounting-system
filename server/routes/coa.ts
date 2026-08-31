import express, { Request, Response } from 'express';
import { COA } from '../models/COA.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const accounts = await COA.find().sort({ account_code: 1 });
    res.json(accounts.map((acc: any) => ({ ...acc.toObject(), id: acc._id.toString() })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch COA' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const newAccount = new COA(req.body);
    await newAccount.save();
    res.json({ ...newAccount.toObject(), id: newAccount._id.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create COA' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const existing = await COA.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (existing.is_system && req.body.account_type && req.body.account_type !== existing.account_type) {
      return res.status(403).json({ error: 'Cannot change the account type of a system account' });
    }
    const updated = await COA.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json({ ...updated.toObject(), id: updated._id.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update COA' });
  }
});

router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<any> => {
  try {
    const account = await COA.findById(req.params.id);
    if (!account) return res.status(404).json({ error: 'Not found' });
    if (account.is_system) {
      return res.status(403).json({ error: 'Cannot delete a system account' });
    }
    await COA.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete COA' });
  }
});

export default router;
