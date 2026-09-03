import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Search, Download, X } from 'lucide-react';
import type { COA } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logoBase64 } from '../assets/logoBase64';

export default function VendorLedger() {
  const [coa, setCoa] = useState<COA[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [journalDetails, setJournalDetails] = useState<any>(null);
  const [loadingJournal, setLoadingJournal] = useState<boolean>(false);

  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    accountId: '',
    reference: '',
    narration: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    api.getCOA().then(setCoa).catch(console.error);
    api.getParties('vendor').then(setVendors).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedVendor) {
      setLoading(true);
      api.getPartyLedger(selectedVendor)
        .then(setEntries)
        .catch(console.error)
        .finally(() => setLoading(false));
      return;
    }

    setEntries([]); // Clear entries when no vendor is selected
  }, [selectedVendor]);

  useEffect(() => {
    if (!selectedJournalId) {
      setJournalDetails(null);
      return;
    }
    setLoadingJournal(true);
    api.getJournal(selectedJournalId)
      .then(setJournalDetails)
      .catch(console.error)
      .finally(() => setLoadingJournal(false));
  }, [selectedJournalId]);

  const currentBalance = entries.length > 0 ? entries[0].balance : 0;
  const vendorControlAccount = coa.find(c => c.account_code === '2000');
  const paymentAccounts = coa.filter(c => ['asset', 'bank', 'cash'].includes(c.account_type.toLowerCase()));

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorControlAccount) {
      alert("Vendor Control Account (2000) not found. Please ensure your Chart of Accounts is configured properly.");
      return;
    }
    setSubmittingPayment(true);
    try {
      const journalData = {
        entry: {
          date: paymentForm.date,
          reference: paymentForm.reference,
          narration: paymentForm.narration || 'Payment to vendor',
        },
        lines: [
          {
            account_id: vendorControlAccount.id,
            party_id: selectedVendor,
            debit: Number(paymentForm.amount),
            credit: 0
          },
          {
            account_id: paymentForm.accountId,
            debit: 0,
            credit: Number(paymentForm.amount)
          }
        ]
      };
      await api.createJournal(journalData);
      setShowPaymentModal(false);
      setPaymentForm({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        accountId: '',
        reference: '',
        narration: ''
      });
      // Refresh ledger
      setLoading(true);
      api.getPartyLedger(selectedVendor)
        .then(setEntries)
        .catch(console.error)
        .finally(() => setLoading(false));
    } catch (error) {
      console.error(error);
      alert("Failed to record payment");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const filteredEntries = entries.filter(entry => {
    let matchesSearch = true;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      matchesSearch = 
        (entry.reference && entry.reference.toLowerCase().includes(lowerQuery)) ||
        (entry.narration && entry.narration.toLowerCase().includes(lowerQuery));
    }
    
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(entry.date) >= new Date(startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && new Date(entry.date) <= new Date(endDate);
    }
    
    return matchesSearch && matchesDate;
  });

  const handleExportPDF = async () => {
    let settings = null;
    try {
      settings = await api.getSettings();
    } catch (err) {
      console.error("Failed to load settings for PDF export", err);
    }

    const doc = new jsPDF();
    
    // Add Logo
    try {
      doc.addImage(logoBase64, 'JPEG', 14, 5, 45, 45);
    } catch (e) {
      console.error("Failed to add logo", e);
    }

    let startY = 45;

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
        yOffset += 7;
      }
      
      doc.setFontSize(14);
      doc.text("Vendor Ledger", 14, yOffset);
      doc.setFontSize(10);
      startY = yOffset + 5;
    } else {
      startY += 10;
      doc.setFontSize(14);
      doc.text("Vendor Ledger", 14, startY);
      doc.setFontSize(10);
      startY += 5;
    }

    const selectedVendorName = vendors.find(v => v.id === selectedVendor)?.name || '';
    if (selectedVendorName) {
        doc.setFontSize(11);
        doc.text(`Vendor: ${selectedVendorName}`, 14, startY);
        
        const cb = entries.length > 0 ? entries[0].balance : 0;
        const statusText = cb <= 0 ? "Status: Paid Off" : `Status: Owes Rs. ${cb.toLocaleString()}`;
        doc.text(statusText, 14, startY + 6);
        
        startY += 14;
    }
    
    const tableColumn = ["Date", "Reference", "Narration", "Account", "Debit", "Credit", "Balance"];
    
    const tableRows: any[] = [];

    filteredEntries.forEach(entry => {
      const acc = coa.find(c => c.id === entry.account_id);
      
      const entryData = [
        new Date(entry.date).toLocaleDateString(),
        entry.reference,
        entry.narration,
        acc ? `${acc.account_code} - ${acc.account_name}` : 'Unknown',
        entry.debit > 0 ? entry.debit.toLocaleString() : '-',
        entry.credit > 0 ? entry.credit.toLocaleString() : '-',
        entry.balance.toLocaleString()
      ];

      tableRows.push(entryData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: startY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`Vendor_Ledger_${selectedVendorName.replace(/\s+/g, '_') || 'Report'}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vendor Ledger</h2>
          <p className="text-slate-500">View detailed transactions and balances for your vendors.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (currentBalance > 0) {
                setPaymentForm(prev => ({ ...prev, amount: currentBalance.toString() }));
              }
              setShowPaymentModal(true);
            }}
            disabled={!selectedVendor}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Record Payment
          </button>
          <button 
            onClick={handleExportPDF} 
            disabled={!selectedVendor || filteredEntries.length === 0}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {selectedVendor && !loading && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {vendors.find(v => v.id === selectedVendor)?.name}
            </h3>
            <p className="text-sm text-slate-500">Current Balance</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">Rs. {currentBalance.toLocaleString()}</div>
            {currentBalance <= 0 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Paid Off
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Owes Rs. {currentBalance.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[250px] max-w-md">
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Vendor</label>
          <select 
            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
          >
            <option value="">Select a vendor...</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>
                {v.name} {v.company ? `(${v.company})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="w-36">
          <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
        <div className="w-36">
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
              placeholder="Search reference or narration..."
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

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Narration</th>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4 text-right">Debit</th>
                <th className="px-6 py-4 text-right">Credit</th>
                <th className="px-6 py-4 text-right bg-slate-100">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Loading vendor ledger...
                  </td>
                </tr>
              ) : !selectedVendor ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Please select a vendor to view their ledger.
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No transactions found for this filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const acc = coa.find(c => c.id === entry.account_id);
                  return (
                    <tr 
                      key={entry.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedJournalId(entry.journal_entry_id)}
                    >
                      <td className="px-6 py-3">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-blue-600">{entry.reference}</td>
                      <td className="px-6 py-3 truncate max-w-xs">{entry.narration}</td>
                      <td className="px-6 py-3 text-slate-700">
                        {acc ? `${acc.account_code} - ${acc.account_name}` : 'Unknown'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {entry.debit > 0 ? `Rs. ${entry.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {entry.credit > 0 ? `Rs. ${entry.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-3 text-right font-medium bg-slate-50">
                        Rs. {entry.balance.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Journal Details Modal */}
      {(selectedJournalId || loadingJournal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-800">Journal Entry Details</h3>
              <button 
                onClick={() => setSelectedJournalId(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {loadingJournal ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : journalDetails ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Date</p>
                      <p className="text-sm font-medium text-slate-900">{new Date(journalDetails.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Reference</p>
                      <p className="text-sm font-medium text-slate-900">{journalDetails.reference}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-medium text-slate-500 mb-1">Narration</p>
                      <p className="text-sm text-slate-700">{journalDetails.narration}</p>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                        <tr>
                          <th className="px-4 py-3">Account</th>
                          <th className="px-4 py-3 text-right">Debit</th>
                          <th className="px-4 py-3 text-right">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {journalDetails.lines.map((line: any, idx: number) => {
                          const acc = coa.find(c => c.id === line.account_id);
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-700">
                                <div>{acc ? `${acc.account_code} - ${acc.account_name}` : 'Unknown Account'}</div>
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {line.debit > 0 ? `Rs. ${line.debit.toLocaleString()}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-700">
                                {line.credit > 0 ? `Rs. ${line.credit.toLocaleString()}` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-50 font-medium">
                          <td className="px-4 py-3 text-right text-slate-700">Total</td>
                          <td className="px-4 py-3 text-right text-slate-900">Rs. {journalDetails.total_debit.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-slate-900">Rs. {journalDetails.total_credit.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">Failed to load details.</div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedJournalId(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-800">Record Vendor Payment</h3>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input 
                  type="date" 
                  required
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs.)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Account</label>
                <select 
                  required
                  value={paymentForm.accountId}
                  onChange={(e) => setPaymentForm({...paymentForm, accountId: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select account...</option>
                  {paymentAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.account_code} - {acc.account_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Cheque No. or Transaction ID"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  required
                  placeholder="What is this payment for?"
                  value={paymentForm.narration}
                  onChange={(e) => setPaymentForm({...paymentForm, narration: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
                  rows={3}
                ></textarea>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {submittingPayment ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
