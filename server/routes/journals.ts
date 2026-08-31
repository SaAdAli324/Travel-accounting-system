import express, { Request, Response } from 'express';
import { JournalEntry } from '../models/Journal.js';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const journals = await JournalEntry.find().sort({ date: -1, _id: -1 }).lean();
    
    const journalsWithTotals = journals.map(je => {
      let total_debit = 0;
      let total_credit = 0;
      (je as any).lines.forEach((line: any) => {
        total_debit += (line.debit || 0);
        total_credit += (line.credit || 0);
      });
      return {
        ...je,
        id: (je as any)._id.toString(),
        total_debit,
        total_credit
      };
    });
    
    res.json(journalsWithTotals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch journals' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const journal = await JournalEntry.findById(req.params.id).lean();
    if (!journal) return res.status(404).json({ error: 'Not found' });
    
    let total_debit = 0;
    let total_credit = 0;
    (journal as any).lines.forEach((line: any) => {
      total_debit += (line.debit || 0);
      total_credit += (line.credit || 0);
    });
    
    res.json({
      ...journal,
      id: (journal as any)._id.toString(),
      total_debit,
      total_credit
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch journal' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { entry, lines } = req.body;
    const newJournal = new JournalEntry({
      ...entry,
      lines: lines
    });
    await newJournal.save();
    res.json({ id: newJournal._id.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create journal' });
  }
});

export default router;
