import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, X, Loader2, DollarSign, Edit2, Printer, RotateCcw } from 'lucide-react';
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
  const [vendors, setVendors] = useState<Party[]>([]);
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

  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');

  // Refund Form State
  const [refundInvoiceId, setRefundInvoiceId] = useState<string | null>(null);
  const [refundDescription, setRefundDescription] = useState<string>('');
  const [refundVendorAmount, setRefundVendorAmount] = useState<number>(0);
  const [refundSellingAmount, setRefundSellingAmount] = useState<number>(0);
  const [isRecordingRefund, setIsRecordingRefund] = useState(false);

  const fetchInitialData = async () => {
    try {
      const [invData, custData, vendorData] = await Promise.all([
        api.getInvoices(),
        api.getParties('customer'),
        api.getParties('vendor')
      ]);
      setInvoices(invData);
      setCustomers(custData);
      setVendors(vendorData);
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
    let payments: any[] = [];
    try {
      settings = await api.getSettings();
      payments = await api.getPayments(inv.id!);
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
    
    let y = Math.max(startY, 50) + 10;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text("Bill To:", 14, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    if (party) {
      doc.text(party.name, 14, y + 5);
      if (party.phone) doc.text(party.phone, 14, y + 10);
    } else {
      doc.text("Unknown Customer", 14, y + 5);
    }
    
    y += 20;

    let currentY = y;

    if (inv.hotel && inv.hotel.length > 0) {
      const hotelRows = inv.hotel.filter((i: any) => i.selling_amount > 0 || i.description).map((i: any) => [
        i.description || '-',
        i.check_in || '-',
        i.check_out || '-',
        i.room_type || '-',
        i.meal_plan || '-',
        i.selling_amount > 0 ? `Rs. ${i.selling_amount.toLocaleString()}` : '-'
      ]);
      if (hotelRows.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text("Hotel Details", 14, currentY);
        currentY += 5;
        autoTable(doc, {
          head: [["Description", "Check In", "Check Out", "Room", "Meal", "Amount"]],
          body: hotelRows,
          startY: currentY,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [59, 130, 246] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    if (inv.tickets && inv.tickets.length > 0) {
      const ticketRows = inv.tickets.filter((i: any) => i.selling_amount > 0 || i.description).map((i: any) => [
        i.description || '-',
        i.airline_name || '-',
        i.travel_date || '-',
        i.sectors || '-',
        i.selling_amount > 0 ? `Rs. ${i.selling_amount.toLocaleString()}` : '-'
      ]);
      if (ticketRows.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text("Ticketing Details", 14, currentY);
        currentY += 5;
        autoTable(doc, {
          head: [["Description", "Airline", "Date", "Sectors", "Amount"]],
          body: ticketRows,
          startY: currentY,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [59, 130, 246] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    if (inv.visa && inv.visa.length > 0) {
      const visaRows = inv.visa.filter((i: any) => i.selling_amount > 0 || i.description).map((i: any) => [
        i.description || '-',
        i.visa_type || '-',
        i.visa_country || '-',
        i.selling_amount > 0 ? `Rs. ${i.selling_amount.toLocaleString()}` : '-'
      ]);
      if (visaRows.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text("Visa Details", 14, currentY);
        currentY += 5;
        autoTable(doc, {
          head: [["Description", "Type", "Country", "Amount"]],
          body: visaRows,
          startY: currentY,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [59, 130, 246] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    const simpleSections = [
      { name: 'Tours', data: inv.tours || [] },
      { name: 'Transport', data: inv.transport || [] },
      { name: 'Other Services', data: inv.other || [] },
    ];

    simpleSections.forEach(sec => {
      if (sec.data.length > 0) {
        const rows = sec.data.filter((i: any) => i.selling_amount > 0 || i.description).map((i: any) => [
          i.description || '-',
          i.selling_amount > 0 ? `Rs. ${i.selling_amount.toLocaleString()}` : '-'
        ]);
        if (rows.length > 0) {
          doc.setFont(undefined, 'bold');
          doc.setFontSize(11);
          doc.text(sec.name, 14, currentY);
          currentY += 5;
          autoTable(doc, {
            head: [["Description", "Amount"]],
            body: rows,
            startY: currentY,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [59, 130, 246] }
          });
          currentY = (doc as any).lastAutoTable.finalY + 10;
        }
      }
    });

    if (inv.refunds && inv.refunds.length > 0) {
      const refundRows = inv.refunds.filter((r: any) => r.selling_amount > 0 || r.description).map((r: any) => [
        r.description || '-',
        `- Rs. ${(r.selling_amount || 0).toLocaleString()}`
      ]);
      if (refundRows.length > 0) {
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text("Refunds", 14, currentY);
        currentY += 5;
        autoTable(doc, {
          head: [["Description", "Amount"]],
          body: refundRows,
          startY: currentY,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [239, 68, 68] } // red-500
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    if ((doc as any).lastAutoTable) {
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    if (payments && payments.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text("Payment History", 14, currentY);
      currentY += 5;

      const paymentRows = payments.map(p => {
        const pDate = new Date(p.date).toLocaleDateString();
        const pAmount = `Rs. ${p.amount.toLocaleString()}`;
        const pRemarks = p.notes ? p.notes : '-';
        return [pDate, pAmount, pRemarks];
      });

      autoTable(doc, {
        head: [["Date", "Amount Paid", "Remarks"]],
        body: paymentRows,
        startY: currentY,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [100, 116, 139] }, // slate-500
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 40 },
          2: { cellWidth: 'auto' }
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Check if we need a new page for totals
    const pageHeight = doc.internal.pageSize.getHeight();
    if (currentY + 20 > pageHeight - 10) {
      doc.addPage();
      currentY = 20;
    }

    // Totals block at the very bottom
    currentY += 5;
    autoTable(doc, {
      body: [
        ["Total Amount", `Rs. ${(inv.total_selling_amount || 0).toLocaleString()}`],
        ["Amount Received", `Rs. ${(inv.amount_received || 0).toLocaleString()}`],
        ["Balance Due", `Rs. ${((inv.total_selling_amount || 0) - (inv.amount_received || 0)).toLocaleString()}`]
      ],
      startY: currentY,
      margin: { left: 65, right: 65 },
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 4, textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.1 },
      columnStyles: {
        0: { fontStyle: 'bold', halign: 'left', fillColor: [248, 250, 252] },
        1: { fontStyle: 'bold', halign: 'right', fillColor: [255, 255, 255] }
      },
      didParseCell: function (data) {
        if (data.row.index === 2) {
          data.cell.styles.fillColor = [226, 232, 240]; // slightly darker slate for balance row
        }
      }
    });

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
        notes: paymentNotes,
        payment_method: 'Cash'
      });
      setPaymentInvoiceId(null);
      setPaymentAmount(0);
      setPaymentNotes('');
      fetchInitialData();
      setDialog({ isOpen: true, type: 'success', message: 'Payment recorded successfully!' });
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, type: 'error', message: 'Failed to record payment' });
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleIssueRefund = async () => {
    if (!refundInvoiceId || !refundDescription) return;
    
    setIsRecordingRefund(true);
    try {
      await api.refundInvoice(refundInvoiceId, {
        description: refundDescription,
        vendor_amount: refundVendorAmount,
        selling_amount: refundSellingAmount
      });
      setRefundInvoiceId(null);
      setRefundDescription('');
      setRefundVendorAmount(0);
      setRefundSellingAmount(0);
      fetchInitialData();
      setDialog({ isOpen: true, type: 'success', message: 'Refund recorded successfully!' });
    } catch (err: any) {
      console.error(err);
      setDialog({ isOpen: true, type: 'error', message: err.message || 'Failed to record refund' });
    } finally {
      setIsRecordingRefund(false);
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
          vendors={vendors}
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
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPaymentInvoiceId(inv.id!); }}
                              className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-full transition-colors"
                              title="Receive Payment"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          ) : null}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setRefundInvoiceId(inv.id!); }}
                            className="text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 p-1.5 rounded-full transition-colors"
                            title="Issue Refund"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          {inv.status !== 'Paid' ? (
                            <>
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
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={paymentAmount || ''}
                onChange={e => setPaymentAmount(Number(e.target.value))}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Remarks / Notes</label>
              <textarea 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={paymentNotes}
                onChange={e => setPaymentNotes(e.target.value)}
                placeholder="e.g., received in bank from TerraTrekTours"
                rows={2}
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

      {/* Refund Modal */}
      {refundInvoiceId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Issue Refund</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Description *</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-amber-500 outline-none"
                value={refundDescription}
                onChange={e => setRefundDescription(e.target.value)}
                placeholder="e.g. Cancelled Flight Ticket"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Refund Amount (Rs.)</label>
              <input 
                type="number" 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-amber-500 outline-none"
                value={refundVendorAmount || ''}
                onChange={e => setRefundVendorAmount(Number(e.target.value))}
                placeholder="Cost returned by supplier"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer Refund Amount (Rs.)</label>
              <input 
                type="number" 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-amber-500 outline-none"
                value={refundSellingAmount || ''}
                onChange={e => setRefundSellingAmount(Number(e.target.value))}
                placeholder="Amount returning to customer"
              />
            </div>
            <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded-lg mb-4">
              <strong>Note:</strong> Refunding a customer will automatically reduce the invoice total. If this invoice is already paid, a negative cash payment will be recorded to balance your books.
            </div>
            <div className="flex justify-end gap-2">
              <button disabled={isRecordingRefund} onClick={() => setRefundInvoiceId(null)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">Cancel</button>
              <button disabled={isRecordingRefund} onClick={handleIssueRefund} className="px-4 py-2 text-white bg-amber-600 rounded hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2">
                {isRecordingRefund && <Loader2 className="w-4 h-4 animate-spin" />}
                Submit Refund
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
          vendors={vendors}
          onClose={() => setPreviewInvoice(null)}
          onPrint={handlePrintInvoice}
        />
      )}
    </div>
  );
}
