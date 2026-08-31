export interface COA {
  id: string;
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  is_system: boolean | number;
}

export interface Party {
  id: string;
  party_type: 'customer' | 'vendor';
  customer_code?: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  cnic?: string;
  ntn?: string;
  strn?: string;
  opening_balance?: number;
}

export interface JournalEntry {
  id?: string;
  date: string;
  reference?: string;
  narration?: string;
  currency?: string;
  exchange_rate?: number;
  created_by?: number;
  total_debit?: number;
  total_credit?: number;
  is_automated?: boolean;
}

export interface JournalLine {
  id?: string;
  journal_entry_id?: string;
  account_id: string;
  party_id?: string;
  debit: number;
  credit: number;
}

export interface InvoiceSection {
  description: string;
  vendor_amount: number;
  selling_amount: number;
}

export interface Invoice {
  id?: string;
  invoice_number: string;
  party_id: string | Party;
  date: string;
  status: 'Draft' | 'Sent' | 'Partial' | 'Paid';
  hotel: InvoiceSection[];
  tickets: InvoiceSection[];
  visa: InvoiceSection[];
  other: InvoiceSection[];
  total_vendor_amount: number;
  total_selling_amount: number;
  total_profit: number;
  amount_received: number;
  createdAt?: string;
}

export interface Payment {
  id?: string;
  invoice_id: string;
  party_id: string;
  date: string;
  amount: number;
  payment_method: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Other';
  reference?: string;
  notes?: string;
  createdAt?: string;
}

