import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, X, Loader2, DollarSign, Edit2, Printer } from 'lucide-react';
import { api } from '../services/api';
import type { Invoice, Party } from '../types';
import { DialogModal, type DialogType } from '../components/ui/DialogModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import { InvoicePreviewModal } from '../components/invoices/InvoicePreviewModal';
import { logoBase64 } from '../assets/logoBase64';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Create Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  // Preview State
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);

  // Loaders & Dialogs
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

  const handleSaveInvoice = async (data: any) => {
    try {
      if (editingInvoice) {
        await api.updateInvoice(editingInvoice.id!, data);
      } else {
        await api.createInvoice(data);
      }
      setShowCreateForm(false);
      setEditingInvoice(null);
      fetchInitialData();
      setDialog({ isOpen: true, type: 'success', message: `Invoice ${editingInvoice ? 'updated' : 'created'} successfully!` });
    } catch (err: any) {
      console.error(err);
      setDialog({ isOpen: true, type: 'error', message: err.message || (editingInvoice ? "Failed to update invoice" : "Failed to create invoice") });
    }
  };

  const handleEditInvoice = (inv: Invoice) => {
    if (inv.status === 'Paid') {
      setDialog({ isOpen: true, type: 'error', message: 'Paid invoices cannot be edited.' });
      return;
    }
    setEditingInvoice(inv);
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

  const handlePrintInvoice = async (inv: Invoice) => {
    let settings: any = null;
    try {
      settings = await api.getSettings();
    } catch (err) {
      console.error(err);
    }
    const party = customers.find(c => c.id === (typeof inv.party_id === 'object' ? (inv.party_id as any).id || (inv.party_id as any)._id : inv.party_id));

    const doc = new jsPDF();
    
    // Add Logo
    try {
      // The uploaded logo is a square, so we use equal width and height (40x40) to prevent stretching
      doc.addImage(logoBase64, 'JPEG', 14, 5, 45, 45);
    } catch (e) {
      console.error("Failed to add logo", e);
    }

    let startY = 45; // Start address below the logo text

    // Add Company Info
    if (settings && settings.show_on_reports !== false) {
      doc.setFontSize(10);
      let yOffset = startY;
      if (settings.address) {
        doc.text(settings.address, 14, yOffset);
        yOffset += 5;
      }
      if (settings.contact_number || settings.ntn_number) {
        const contactLine = [
          settings.contact_number ? `Contact: ${settings.contact_number}` : '',
          settings.ntn_number ? `NTN: ${settings.ntn_number}` : ''
        ].filter(Boolean).join(' | ');
        doc.text(contactLine, 14, yOffset);
      }
      startY = yOffset + 5;
    } else {
      startY += 10;
    }
    
    doc.setFontSize(14);
    doc.text("INVOICE", 140, 20);
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${inv.invoice_number}`, 140, 27);
    doc.text(`Date: ${new Date(inv.date).toLocaleDateString()}`, 140, 32);
    doc.text(`Status: ${inv.status}`, 140, 37);
    
    let y = Math.max(startY, 45);
    
    doc.setFontSize(11);
    doc.text("Bill To:", 14, y);
    doc.setFontSize(10);
    if (party) {
      doc.text(party.name, 14, y + 5);
      if (party.phone) doc.text(party.phone, 14, y + 10);
    } else {
      doc.text("Unknown Customer", 14, y + 5);
    }
    
    y += 20;

    const tableRows: any[] = [];
    
    const sections = [
      { name: 'Hotel', data: inv.hotel || [] },
      { name: 'Tickets', data: inv.tickets || [] },
      { name: 'Visa', data: inv.visa || [] },
      { name: 'Other', data: inv.other || [] },
    ];
    
    sections.forEach(sec => {
      sec.data.forEach((item: any) => {
        if (item.selling_amount > 0 || item.description) {
           let desc = `${sec.name}: ${item.description}`;
           if (sec.name === 'Hotel' && (item.check_in || item.check_out || item.room_type || item.meal_plan)) {
             const details = [];
             if (item.check_in) details.push(`In: ${item.check_in}`);
             if (item.check_out) details.push(`Out: ${item.check_out}`);
             if (item.room_type) details.push(item.room_type);
             if (item.meal_plan) details.push(item.meal_plan);
             desc += `\n(${details.join(' | ')})`;
           }
           tableRows.push([desc, `Rs. ${item.selling_amount.toLocaleString()}`]);
        }
      });
    });

    autoTable(doc, {
      head: [["Description", "Amount"]],
      body: tableRows,
      startY: y,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.text(`Total Amount: Rs. ${(inv.total_selling_amount || 0).toLocaleString()}`, 130, finalY);
    doc.text(`Amount Received: Rs. ${(inv.amount_received || 0).toLocaleString()}`, 130, finalY + 7);
    doc.setFont(undefined, 'bold');
    doc.text(`Balance Due: Rs. ${((inv.total_selling_amount || 0) - (inv.amount_received || 0)).toLocaleString()}`, 130, finalY + 14);

    doc.save(`Invoice_${inv.invoice_number}.pdf`);
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
              setEditingInvoice(null);
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
        <InvoiceForm
          mode={editingInvoice ? 'edit' : 'create'}
          initialData={editingInvoice}
          customers={customers}
          onSave={handleSaveInvoice}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingInvoice(null);
          }}
        />
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
                    <tr 
                      key={inv.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setPreviewInvoice(inv)}
                    >
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
                      <td className="px-6 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handlePrintInvoice(inv); }}
                            className="text-slate-600 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {inv.status !== 'Paid' ? (
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setPaymentInvoiceId(inv.id!); }}
                                className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-full transition-colors"
                                title="Receive Payment"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEditInvoice(inv); }}
                                className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-full transition-colors"
                                title="Edit Invoice"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(inv.id!); }}
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
      
      {previewInvoice && (
        <InvoicePreviewModal
          invoice={previewInvoice}
          party={customers.find(c => c.id === (typeof previewInvoice.party_id === 'object' ? (previewInvoice.party_id as any).id || (previewInvoice.party_id as any)._id : previewInvoice.party_id))}
          onClose={() => setPreviewInvoice(null)}
          onPrint={handlePrintInvoice}
        />
      )}
    </div>
  );
}
