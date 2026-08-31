import mongoose from 'mongoose';

const PartySchema = new mongoose.Schema({
  party_type: { type: String, required: true },
  customer_code: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  contact_person: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
  cnic: { type: String },
  ntn: { type: String },
  strn: { type: String },
  opening_balance: { type: Number, default: 0 }
}, { timestamps: true });

export const Party = mongoose.model('Party', PartySchema);
