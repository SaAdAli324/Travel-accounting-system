import express, { Request, Response } from 'express';
import { COA } from '../models/COA.js';
import { JournalEntry } from '../models/Journal.js';
import { Party } from '../models/Party.js';

const router = express.Router();

router.get('/:accountId', async (req: Request, res: Response): Promise<any> => {
  try {
    const accountId = req.params.accountId;
    const account = await COA.findById(accountId);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const entries = await JournalEntry.find({ 'lines.account_id': accountId }).sort({ date: 1, createdAt: 1 }).lean();
    
    let runningBalance = 0;
    const ledgerLines: any[] = [];
    
    for (const entry of entries) {
      for (const line of (entry as any).lines) {
        if (line.account_id.toString() === accountId) {
          const debit = line.debit || 0;
          const credit = line.credit || 0;
          
          if (['asset', 'expense'].includes(account.account_type.toLowerCase())) {
            runningBalance += debit - credit;
          } else {
            runningBalance += credit - debit;
          }
          
          ledgerLines.push({
            id: line._id?.toString() || Math.random().toString(),
            journal_entry_id: (entry as any)._id.toString(),
            date: (entry as any).date,
            reference: (entry as any).reference,
            narration: (entry as any).narration,
            party_id: line.party_id,
            debit,
            credit,
            balance: runningBalance
          });
        }
      }
    }
    
    res.json(ledgerLines.reverse());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch ledger' });
  }
});

router.get('/party/:partyId', async (req: Request, res: Response): Promise<any> => {
  try {
    const partyId = req.params.partyId;
    const party = await Party.findById(partyId);
    if (!party) return res.status(404).json({ error: 'Party not found' });

    const arAccount = await COA.findOne({ account_code: '1200' });
    if (!arAccount) return res.status(404).json({ error: 'AR Account not found' });
    
    const accountId = arAccount._id.toString();

    const entries = await JournalEntry.find({ 'lines.party_id': partyId, 'lines.account_id': accountId }).sort({ date: 1, createdAt: 1 }).lean();
    
    let runningBalance = 0;
    const ledgerLines: any[] = [];
    
    for (const entry of entries) {
      for (const line of (entry as any).lines) {
        if (line.party_id?.toString() === partyId && line.account_id.toString() === accountId) {
          const debit = line.debit || 0;
          const credit = line.credit || 0;
          
          runningBalance += debit - credit;
          
          ledgerLines.push({
            id: line._id?.toString() || Math.random().toString(),
            journal_entry_id: (entry as any)._id.toString(),
            date: (entry as any).date,
            reference: (entry as any).reference,
            narration: (entry as any).narration,
            account_id: line.account_id,
            party_id: line.party_id,
            debit,
            credit,
            balance: runningBalance
          });
        }
      }
    }
    
    res.json(ledgerLines.reverse());
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch party ledger' });
  }
});

export default router;
