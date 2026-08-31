import mongoose from 'mongoose';

const JournalLineSchema = new mongoose.Schema({
  account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'COA', required: true },
  party_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Party' },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 }
});

const JournalEntrySchema = new mongoose.Schema({
  date: { type: String, required: true },
  reference: { type: String },
  narration: { type: String },
  currency: { type: String, default: 'PKR' },
  exchange_rate: { type: Number, default: 1.0 },
  created_by: { type: String },
  is_automated: { type: Boolean, default: false },
  lines: [JournalLineSchema]
}, { timestamps: true });

export const JournalEntry = mongoose.model('JournalEntry', JournalEntrySchema);
