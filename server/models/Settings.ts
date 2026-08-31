import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  company_name: { type: String, default: 'Al-Madina Travel & Tours' },
  contact_number: { type: String, default: '+92 300 1234567' },
  address: { type: String, default: 'Suite 45, Commercial Area, Lahore, Pakistan' },
  default_sales_tax: { type: Number, default: 5 },
  default_wht: { type: Number, default: 1 },
  ntn_number: { type: String, default: '1234567-8' },
  base_currency: { type: String, default: 'PKR' },
  show_on_reports: { type: Boolean, default: true },
}, { timestamps: true });

export const Settings = mongoose.model('Settings', settingsSchema);
