import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Filter, Edit, Trash2, X, Loader2, DollarSign, Edit2 } from 'lucide-react';
import { api } from '../services/api';
import type { Invoice, Party, InvoiceSection } from '../types';
import { DialogModal, type DialogType } from '../components/ui/DialogModal';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Create Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  
  const [hotelSections, setHotelSections] = useState<InvoiceSection[]>([]);
  const [ticketSections, setTicketSections] = useState<InvoiceSection[]>([]);
  const [visaSections, setVisaSections] = useState<InvoiceSection[]>([]);
  const [otherSections, setOtherSections] = useState<InvoiceSection[]>([]);
  const [amountReceived, setAmountReceived] = useState<number>(0);

  // Loaders & Dialogs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [dialog, setDialog] = useState<{isOpen: boolean, type: DialogType, message: string, title?: string}>({ isOpen: false, type: 'success', message: '' });

  // Payment Form State
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const fetchInitialData = async () => {
    try {
      const [invData, custData] = await Promise.all([
        api.getInvoices(),
        api.getParties('customer')
      ]);
      setInvoices(invData);
      setCustomers(custData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleAddSection = (type: 'hotel' | 'tickets' | 'visa' | 'other') => {
    const newSection = { description: '', vendor_amount: 0, selling_amount: 0 };
    if (type === 'hotel') setHotelSections([...hotelSections, newSection]);
    if (type === 'tickets') setTicketSections([...ticketSections, newSection]);
    if (type === 'visa') setVisaSections([...visaSections, newSection]);
    if (type === 'other') setOtherSections([...otherSections, newSection]);
  };

  const handleUpdateSection = (type: string, index: number, field: string, value: any) => {
    const updateArray = (arr: any[]) => {
      const newArr = [...arr];
      newArr[index] = { ...newArr[index], [field]: value };
      return newArr;
    };
    if (type === 'hotel') setHotelSections(updateArray(hotelSections));
    if (type === 'tickets') setTicketSections(updateArray(ticketSections));
    if (type === 'visa') setVisaSections(updateArray(visaSections));
    if (type === 'other') setOtherSections(updateArray(otherSections));
  };

  const handleSubmitInvoice = async () => {
    if (!selectedCustomerId) {
      setDialog({ isOpen: true, type: 'error', message: 'Please select a customer' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const data = {
        party_id: selectedCustomerId,
        date: new Date().toISOString().split('T')[0],
        hotel: hotelSections,
        tickets: ticketSections,
        visa: visaSections,
        other: otherSections,
        amount_received: amountReceived
      };
      
      if (editingInvoiceId) {
        await api.updateInvoice(editingInvoiceId, data);
      } else {
        await api.createInvoice(data);
      }
      
      setShowCreateForm(false);
      setEditingInvoiceId(null);
      setHotelSections([]);
      setTicketSections([]);
      setVisaSections([]);
      setOtherSections([]);
      setAmountReceived(0);
      fetchInitialData();
      setDialog({ isOpen: true, type: 'success', message: `Invoice ${editingInvoiceId ? 'updated' : 'created'} successfully!` });
    } catch (err: any) {
      console.error(err);
      setDialog({ isOpen: true, type: 'error', message: err.message || (editingInvoiceId ? "Failed to update invoice" : "Failed to create invoice") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditInvoice = (inv: Invoice) => {
    if (inv.status === 'Paid') {
      setDialog({ isOpen: true, type: 'error', message: 'Paid invoices cannot be edited.' });
      return;
    }
    setEditingInvoiceId(inv.id!);
    setSelectedCustomerId(typeof inv.party_id === 'object' ? (inv.party_id as any)._id || (inv.party_id as any).id : inv.party_id);
    setHotelSections(inv.hotel || []);
    setTicketSections(inv.tickets || []);
    setVisaSections(inv.visa || []);
    setOtherSections(inv.other || []);
    setAmountReceived(inv.amount_received || 0);
    setShowCreateForm(true);
  };

  const handleDeleteClick = (id: string) => {
    const invoice = invoices.find(i => i.id === id);
    if (invoice?.status === 'Paid') {
      setDialog({ isOpen: true, type: 'error', message: 'Paid invoices cannot be deleted.' });
      return;
    }
    setPendingDeleteId(id);
    setDialog({ isOpen: true, type: 'confirm', title: 'Confirm Deletion', message: 'Are you sure you want to delete this invoice?' });
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeletingId(pendingDeleteId);
    setDialog(prev => ({ ...prev, isProcessing: true } as any));
    
    try {
      await api.deleteInvoice(pendingDeleteId);
      fetchInitialData();
      setDialog({ isOpen: true, type: 'success', message: 'Invoice deleted successfully!' });
    } catch (err: any) {
      console.error(err);
      setDialog({ isOpen: true, type: 'error', message: err.message || "Failed to delete invoice" });
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
    setPendingDeleteId(null);
  };

  const handleReceivePayment = async () => {
    if (!paymentInvoiceId || paymentAmount <= 0) return;
    const invoice = invoices.find(i => i.id === paymentInvoiceId);
    if (!invoice) return;

    setIsRecordingPayment(true);
    try {
      await api.createPayment({
        invoice_id: paymentInvoiceId,
        party_id: typeof invoice.party_id === 'object' ? (invoice.party_id as any)._id || (invoice.party_id as any).id : invoice.party_id,
        date: new Date().toISOString().split('T')[0],
        amount: paymentAmount,
        payment_method: 'Cash'
      });
      setPaymentInvoiceId(null);
      setPaymentAmount(0);
      fetchInitialData();
      setDialog({ isOpen: true, type: 'success', message: 'Payment recorded successfully!' });
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, type: 'error', message: 'Failed to record payment' });
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const renderSectionInputs = (title: string, type: string, sections: InvoiceSection[]) => (
    <div className="mb-4 p-4 border border-slate-200 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">{title}</h3>
        <button onClick={() => handleAddSection(type as any)} className="text-blue-600 text-sm hover:underline flex items-center">
          <Plus className="w-3 h-3 mr-1" /> Add {title}
        </button>
      </div>
      {sections.map((sec, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input 
            type="text" placeholder="Description" 
            className="flex-1 border p-2 rounded text-sm"
            value={sec.description} onChange={e => handleUpdateSection(type, i, 'description', e.target.value)} 
          />
          <input 
            type="number" placeholder="Vendor Cost" 
            className="w-32 border p-2 rounded text-sm"
            value={sec.vendor_amount || ''} onChange={e => handleUpdateSection(type, i, 'vendor_amount', Number(e.target.value))} 
          />
          <input 
            type="number" placeholder="Selling Price" 
            className="w-32 border p-2 rounded text-sm"
            value={sec.selling_amount || ''} onChange={e => handleUpdateSection(type, i, 'selling_amount', Number(e.target.value))} 
          />
        </div>
      ))}
    </div>
  );

  const filteredInvoices = invoices.filter(inv => {
    let matchesSearch = true;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const customerName = ((inv.party_id as any)?.name || '').toLowerCase();
      matchesSearch = 
        (inv.invoice_number && inv.invoice_number.toLowerCase().includes(lowerQuery)) ||
        customerName.includes(lowerQuery);
    }
    
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(inv.date) >= new Date(startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && new Date(inv.date) <= new Date(endDate);
    }
    
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
          <p className="text-slate-500">Manage client invoices and track received payments.</p>
        </div>
        {!showCreateForm && (
          <button 
            onClick={() => {
              setEditingInvoiceId(null);
              setSelectedCustomerId('');
              setHotelSections([]);
              setTicketSections([]);
              setVisaSections([]);
              setOtherSections([]);
              setAmountReceived(0);
              setShowCreateForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        )}
      </div>

      {!showCreateForm && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-end gap-4">
          <div className="w-40">
            <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div className="flex-1 min-w-[200px] relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search invoice # or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-slate-300 rounded-lg pl-9 p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
              />
            </div>
          </div>
          <button 
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setSearchQuery('');
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors h-10"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      )}

      {showCreateForm ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-4">{editingInvoiceId ? 'Edit Invoice' : 'New Invoice'}</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Customer</label>
            <select 
              className="w-full border p-2 rounded"
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
            >
              <option value="">-- Select Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.customer_code} - {c.name}</option>
              ))}
            </select>
          </div>

          {renderSectionInputs('Hotels', 'hotel', hotelSections)}
          {renderSectionInputs('Tickets', 'tickets', ticketSections)}
          {renderSectionInputs('Visa', 'visa', visaSections)}
          {renderSectionInputs('Other', 'other', otherSections)}
          
          <div className="mb-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
            <h3 className="font-semibold mb-2 text-slate-700">Payment Details (Optional)</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm text-slate-600 mb-1">Amount Received So Far</label>
                <input 
                  type="number" 
                  className="w-full border p-2 rounded text-sm bg-white"
                  value={amountReceived === 0 ? '' : amountReceived}
                  onChange={e => setAmountReceived(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" disabled={isSubmitting} onClick={() => { setShowCreateForm(false); setEditingInvoiceId(null); }} className="px-4 py-2 text-slate-600 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">Cancel</button>
            <button onClick={handleSubmitInvoice} disabled={isSubmitting} className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingInvoiceId ? 'Update Invoice' : 'Save Invoice'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Vendor Total</th>
                  <th className="px-6 py-4 text-right">Selling Total</th>
                  <th className="px-6 py-4 text-right">Profit</th>
                  <th className="px-6 py-4 text-right">Received</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={9} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr><td colSpan={9} className="px-6 py-8 text-center text-slate-500">No invoices found for this filter.</td></tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-900">{inv.invoice_number}</td>
                      <td className="px-6 py-3">{(inv.party_id as any)?.name || 'Unknown'}</td>
                      <td className="px-6 py-3">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-right">Rs. {inv.total_vendor_amount.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right font-medium text-blue-600">Rs. {inv.total_selling_amount.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-emerald-600 font-semibold">Rs. {inv.total_profit.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right font-medium">Rs. {inv.amount_received.toLocaleString()}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'Partial' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex items-center justify-center gap-3">
                          {inv.status !== 'Paid' ? (
                            <>
                              <button 
                                onClick={() => setPaymentInvoiceId(inv.id!)}
                                className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-full transition-colors"
                                title="Receive Payment"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEditInvoice(inv)}
                                className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-full transition-colors"
                                title="Edit Invoice"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(inv.id!)}
                                disabled={deletingId === inv.id}
                                className="text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-full transition-colors disabled:opacity-50"
                                title="Delete Invoice"
                              >
                                {deletingId === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic bg-slate-50 px-2 py-1 rounded">Locked</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentInvoiceId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Receive Payment</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs.)</label>
              <input 
                type="number" 
                className="w-full border p-2 rounded"
                value={paymentAmount || ''}
                onChange={e => setPaymentAmount(Number(e.target.value))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button disabled={isRecordingPayment} onClick={() => setPaymentInvoiceId(null)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">Cancel</button>
              <button disabled={isRecordingPayment} onClick={handleReceivePayment} className="px-4 py-2 text-white bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
                {isRecordingPayment && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Payment
              </button>
            </div>
          </div>
        </div>
      )}

      <DialogModal 
        isOpen={dialog.isOpen} 
        type={dialog.type} 
        title={dialog.title}
        message={dialog.message} 
        onClose={closeDialog}
        onConfirm={confirmDelete}
        isProcessing={deletingId !== null}
      />
    </div>
  );
}
