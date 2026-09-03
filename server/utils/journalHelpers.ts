import { COA } from '../models/COA.js';
import { JournalEntry } from '../models/Journal.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';

export async function syncInvoiceJournalEntry(invoice: any) {
  const arAccount = await COA.findOne({ account_code: '1200' });
  const apAccount = await COA.findOne({ account_code: '2000' });
  const cogsAccount = await COA.findOne({ account_code: '5000' });
  
  const ticketRev = await COA.findOne({ account_code: '4010' });
  const hotelRev = await COA.findOne({ account_code: '4020' });
  const visaRev = await COA.findOne({ account_code: '4030' });
  const toursRev = await COA.findOne({ account_code: '4040' });
  const transportRev = await COA.findOne({ account_code: '4050' });
  const otherRev = await COA.findOne({ account_code: '4090' });

  if (!arAccount) return; 

  const lines = [];
  
  if (invoice.total_selling_amount > 0) {
    lines.push({ account_id: arAccount._id, party_id: invoice.party_id, debit: invoice.total_selling_amount, credit: 0 });
  }

  const calcRev = (section: any[]) => section?.reduce((sum: number, item: any) => sum + (item.selling_amount || 0), 0) || 0;
  
  const ticketTotal = calcRev(invoice.tickets);
  const hotelTotal = calcRev(invoice.hotel);
  const visaTotal = calcRev(invoice.visa);
  const toursTotal = calcRev(invoice.tours);
  const transportTotal = calcRev(invoice.transport);
  const otherTotal = calcRev(invoice.other);

  if (ticketTotal > 0 && ticketRev) lines.push({ account_id: ticketRev._id, party_id: invoice.party_id, debit: 0, credit: ticketTotal });
  if (hotelTotal > 0 && hotelRev) lines.push({ account_id: hotelRev._id, party_id: invoice.party_id, debit: 0, credit: hotelTotal });
  if (visaTotal > 0 && visaRev) lines.push({ account_id: visaRev._id, party_id: invoice.party_id, debit: 0, credit: visaTotal });
  if (toursTotal > 0 && toursRev) lines.push({ account_id: toursRev._id, party_id: invoice.party_id, debit: 0, credit: toursTotal });
  if (transportTotal > 0 && transportRev) lines.push({ account_id: transportRev._id, party_id: invoice.party_id, debit: 0, credit: transportTotal });
  if (otherTotal > 0 && otherRev) lines.push({ account_id: otherRev._id, party_id: invoice.party_id, debit: 0, credit: otherTotal });

  const vendorTotals = new Map<string, number>();
  let totalCogs = 0;

  const processSectionForVendors = (section: any[]) => {
    if (!section) return;
    section.forEach((item: any) => {
      if (item.vendor_id && item.vendor_amount > 0) {
        const vid = item.vendor_id.toString();
        vendorTotals.set(vid, (vendorTotals.get(vid) || 0) + item.vendor_amount);
        totalCogs += item.vendor_amount;
      }
    });
  };

  processSectionForVendors(invoice.tickets);
  processSectionForVendors(invoice.hotel);
  processSectionForVendors(invoice.visa);
  processSectionForVendors(invoice.tours);
  processSectionForVendors(invoice.transport);
  processSectionForVendors(invoice.other);

  if (totalCogs > 0 && cogsAccount) {
    lines.push({ account_id: cogsAccount._id, party_id: null, debit: totalCogs, credit: 0 });
  }

  if (vendorTotals.size > 0 && apAccount) {
    vendorTotals.forEach((amount, vendorId) => {
      lines.push({ account_id: apAccount._id, party_id: vendorId, debit: 0, credit: amount });
    });
  }

  if (lines.length < 2) return;

  const entryData = {
    date: invoice.date,
    reference: invoice.invoice_number,
    narration: `Invoice ${invoice.invoice_number}`,
    is_automated: true,
    lines
  };

  if (invoice.journal_entry_id) {
    const je = await JournalEntry.findById(invoice.journal_entry_id);
    if (je) {
      je.set(entryData);
      await je.save();
    }
  } else {
    const newJe = new JournalEntry(entryData);
    await newJe.save();
    await Invoice.findByIdAndUpdate(invoice._id, { journal_entry_id: newJe._id });
  }
}

export async function syncPaymentJournalEntry(payment: any) {
  const cashAccount = await COA.findOne({ account_code: '1010' });
  if (!cashAccount || !payment.amount) return;

  const mongoose = await import('mongoose');
  const Party = mongoose.model('Party');
  const party = await Party.findById(payment.party_id);
  const partyName = party ? (party as any).name : 'Customer/Vendor';
  const isVendor = party && (party as any).party_type.toLowerCase() === 'vendor';

  const controlAccountCode = isVendor ? '2000' : '1200';
  const controlAccount = await COA.findOne({ account_code: controlAccountCode });
  
  if (!controlAccount) return;

  const isRefund = payment.amount < 0;
  const absAmount = Math.abs(payment.amount);

  let lines = [];

  if (isVendor) {
    // Payment to Vendor (normal): Debit AP, Credit Cash
    // Refund from Vendor (negative): Debit Cash, Credit AP
    lines = isRefund
      ? [
          { account_id: cashAccount._id, party_id: payment.party_id, debit: absAmount, credit: 0 },
          { account_id: controlAccount._id, party_id: payment.party_id, debit: 0, credit: absAmount }
        ]
      : [
          { account_id: controlAccount._id, party_id: payment.party_id, debit: absAmount, credit: 0 },
          { account_id: cashAccount._id, party_id: payment.party_id, debit: 0, credit: absAmount }
        ];
  } else {
    // Payment from Customer (normal): Debit Cash, Credit AR
    // Refund to Customer (negative): Debit AR, Credit Cash
    lines = isRefund
      ? [
          { account_id: cashAccount._id, party_id: payment.party_id, debit: 0, credit: absAmount },
          { account_id: controlAccount._id, party_id: payment.party_id, debit: absAmount, credit: 0 }
        ]
      : [
          { account_id: cashAccount._id, party_id: payment.party_id, debit: absAmount, credit: 0 },
          { account_id: controlAccount._id, party_id: payment.party_id, debit: 0, credit: absAmount }
        ];
  }

  const invoice = await Invoice.findById(payment.invoice_id);
  const invNumber = invoice ? invoice.invoice_number : 'Unknown';
  
  let narration = '';
  if (isVendor) {
    narration = isRefund
      ? `✅ Refund of Rs. ${absAmount.toLocaleString()} received from Vendor ${partyName} for Invoice ${invNumber}`
      : `❌ Payment of Rs. ${absAmount.toLocaleString()} issued to Vendor ${partyName} for Invoice ${invNumber}`;
  } else {
    narration = isRefund
      ? `❌ Cash Refund of Rs. ${absAmount.toLocaleString()} issued to Customer ${partyName} for Invoice ${invNumber}`
      : `✅ Payment of Rs. ${absAmount.toLocaleString()} received from Customer ${partyName} for Invoice ${invNumber}`;
  }

  const entryData = {
    date: payment.date,
    reference: payment.reference || invNumber,
    narration,
    is_automated: true,
    lines
  };

  if (payment.journal_entry_id) {
    const je = await JournalEntry.findById(payment.journal_entry_id);
    if (je) {
      je.set(entryData);
      await je.save();
    }
  } else {
    const newJe = new JournalEntry(entryData);
    await newJe.save();
    await Payment.findByIdAndUpdate(payment._id, { journal_entry_id: newJe._id });
  }
}
