const API_URL = '/api';

let authToken = '';

const authFetch = async (url: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers || {});
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  return fetch(url, { ...options, headers, credentials: 'include' });
};

export const api = {
  setToken: (token: string) => {
    authToken = token;
  },
  login: async (credentials: any) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },
  logout: async () => {
    const res = await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    return res.json().catch(() => ({}));
  },
  verifyToken: async () => {
    const res = await authFetch(`${API_URL}/auth/verify`);
    if (!res.ok) throw new Error('Token invalid');
    return res.json();
  },

  // COA
  getCOA: async () => {
    const res = await authFetch(`${API_URL}/coa`);
    if (!res.ok) throw new Error('Failed to fetch COA');
    return res.json();
  },
  createCOA: async (data: any) => {
    const res = await authFetch(`${API_URL}/coa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create COA');
    return res.json();
  },
  updateCOA: async (data: any) => {
    const res = await authFetch(`${API_URL}/coa/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update COA');
    return res.json();
  },
  deleteCOA: async (id: string | number) => {
    const res = await authFetch(`${API_URL}/coa/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete COA');
    return res.json();
  },

  // Journals
  getJournals: async () => {
    const res = await authFetch(`${API_URL}/journals`);
    if (!res.ok) throw new Error('Failed to fetch journals');
    return res.json();
  },
  getJournal: async (id: string) => {
    const res = await authFetch(`${API_URL}/journals/${id}`);
    if (!res.ok) throw new Error('Failed to fetch journal');
    return res.json();
  },
  createJournal: async (data: any) => {
    const res = await authFetch(`${API_URL}/journals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create journal');
    return res.json();
  },
  updateJournal: async (id: string, data: any) => {
    const res = await authFetch(`${API_URL}/journals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update journal');
    return res.json();
  },
  deleteJournal: async (id: string) => {
    const res = await authFetch(`${API_URL}/journals/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete journal');
    return res.json();
  },

  // Ledger
  getLedger: async (accountId: string) => {
    const res = await authFetch(`${API_URL}/ledger/${accountId}`);
    if (!res.ok) throw new Error('Failed to fetch ledger');
    return res.json();
  },

  // Invoices
  getInvoices: async () => {
    const res = await authFetch(`${API_URL}/invoices`);
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return res.json();
  },
  createInvoice: async (data: any) => {
    const res = await authFetch(`${API_URL}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create invoice');
    return res.json();
  },
  updateInvoice: async (id: string, data: any) => {
    const res = await authFetch(`${API_URL}/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update invoice');
    }
    return res.json();
  },
  deleteInvoice: async (id: string) => {
    const res = await authFetch(`${API_URL}/invoices/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete invoice');
    }
    return res.json();
  },

  // Payments
  getPayments: async (invoiceId: string) => {
    const res = await authFetch(`${API_URL}/payments/${invoiceId}`);
    if (!res.ok) throw new Error('Failed to fetch payments');
    return res.json();
  },
  createPayment: async (data: any) => {
    const res = await authFetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create payment');
    return res.json();
  },

  // Parties (Customers, Vendors, Staff)
  getParties: async (type?: string) => {
    const res = await authFetch(`${API_URL}/parties${type ? `?type=${type}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch parties');
    return res.json();
  },
  createParty: async (data: any) => {
    const res = await authFetch(`${API_URL}/parties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create party');
    return res.json();
  },
  updateParty: async (id: string, data: any) => {
    const res = await authFetch(`${API_URL}/parties/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update party');
    return res.json();
  },
  deleteParty: async (id: string) => {
    const res = await authFetch(`${API_URL}/parties/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete party');
    }
    return res.json();
  },
  // Settings
  getSettings: async () => {
    const res = await authFetch(`${API_URL}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },
  updateSettings: async (data: any) => {
    const res = await authFetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  }
};
