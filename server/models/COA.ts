import mongoose from 'mongoose';

const COASchema = new mongoose.Schema({
  account_code: { type: String, required: true, unique: true },
  account_name: { type: String, required: true },
  account_type: { type: String, required: true },
  is_system: { type: Boolean, default: false }
}, { timestamps: true });

export const COA = mongoose.model('COA', COASchema);
