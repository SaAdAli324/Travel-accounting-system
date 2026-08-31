import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Search, Download, Printer, X } from 'lucide-react';
import type { COA } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Ledger() {
  const [coa, setCoa] = useState<COA[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [journalDetails, setJournalDetails] = useState<any>(null);
  const [loadingJournal, setLoadingJournal] = useState<boolean>(false);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    api.getCOA().then(setCoa).catch(console.error);
    api.getParties().then(setParties).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedAccount) {
      setLoading(true);
      api.getJournals()
        .then(data => {
          const lines: any[] = [];
          data.forEach((j: any) => {
            j.lines.forEach((l: any) => {
              lines.push({
                id: Math.random().toString(),
                journal_entry_id: j.id || j._id,
                date: j.date,
                reference: j.reference,
                narration: j.narration,
                account_id: l.account_id,
                party_id: l.party_id,
                debit: l.debit || 0,
                credit: l.credit || 0,
                balance: 0
              });
            });
          });
          lines.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setEntries(lines);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
      return;
    }
    setLoading(true);
    api.getLedger(selectedAccount)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedAccount]);

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
    
    // Add Company Info
    if (settings && settings.company_name && settings.show_on_reports !== false) {
      doc.setFontSize(16);
      doc.text(settings.company_name, 14, 15);
      doc.setFontSize(10);
      let yOffset = 22;
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
      doc.text("General Ledger", 14, yOffset);
      doc.setFontSize(10);
    } else {
      doc.setFontSize(14);
      doc.text("General Ledger", 14, 15);
      doc.setFontSize(10);
    }
    
    
    const tableColumn = ["Date", "Reference", "Narration", "Account", "Party", "Debit", "Credit"];
    if (selectedAccount) tableColumn.push("Balance");
    
    const tableRows: any[] = [];

    filteredEntries.forEach(entry => {
      const acc = coa.find(c => c.id === entry.account_id);
      const party = parties.find(p => p.id === entry.party_id);
      
      const entryData = [
        new Date(entry.date).toLocaleDateString(),
        entry.reference,
        entry.narration,
        !selectedAccount ? (acc ? `${acc.account_code} - ${acc.account_name}` : 'Unknown') : '',
        party ? party.name : '-',
        entry.debit > 0 ? entry.debit : '-',
        entry.credit > 0 ? entry.credit : '-',
      ];
      if (!selectedAccount) {
         // keep account
      } else {
         // remove account column data and put balance at end
         entryData.splice(3, 1);
         entryData.push(entry.balance);
      }
      tableRows.push(entryData);
    });

    if (!selectedAccount) {
        tableColumn.splice(3, 1, "Account");
    } else {
        tableColumn.splice(3, 1); // remove account column header
    }

    const startY = (settings && settings.company_name && settings.show_on_reports !== false) ? (settings.contact_number || settings.address ? 42 : 35) : 20;

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: startY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save("Ledger_Report.pdf");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">General Ledger</h2>
          <p className="text-slate-500">View detailed transactions for specific accounts.</p>
        </div>
        <button onClick={handleExportPDF} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <label className="block text-sm font-medium text-slate-700 mb-1">Account</label>
          <select 
            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            <option value="">Select an account...</option>
            {coa.map(account => (
              <option key={account.id} value={account.id}>
                {account.account_code} - {account.account_name}
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
                {!selectedAccount && <th className="px-6 py-4">Account</th>}
                <th className="px-6 py-4">Party</th>
                <th className="px-6 py-4 text-right">Debit</th>
                <th className="px-6 py-4 text-right">Credit</th>
                {selectedAccount && <th className="px-6 py-4 text-right bg-slate-100">Balance</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Loading ledger data...
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={selectedAccount ? 6 : 6} className="px-6 py-12 text-center text-slate-500">
                    No transactions found for this filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const acc = coa.find(c => c.id === entry.account_id);
                  const party = parties.find(p => p.id === entry.party_id);
                  return (
                    <tr 
                      key={entry.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedJournalId(entry.journal_entry_id)}
                    >
                      <td className="px-6 py-3">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-blue-600">{entry.reference}</td>
                      <td className="px-6 py-3 truncate max-w-xs">{entry.narration}</td>
                      {!selectedAccount && (
                        <td className="px-6 py-3 text-slate-700">
                          {acc ? `${acc.account_code} - ${acc.account_name}` : 'Unknown'}
                        </td>
                      )}
                      <td className="px-6 py-3 text-slate-700">
                        {party ? party.name : '-'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {entry.debit > 0 ? `Rs. ${entry.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {entry.credit > 0 ? `Rs. ${entry.credit.toLocaleString()}` : '-'}
                      </td>
                      {selectedAccount && (
                        <td className="px-6 py-3 text-right font-medium bg-slate-50">
                          Rs. {entry.balance.toLocaleString()}
                        </td>
                      )}
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
                          const party = parties.find(p => p.id === line.party_id);
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-700">
                                <div>{acc ? `${acc.account_code} - ${acc.account_name}` : 'Unknown Account'}</div>
                                {party && <div className="text-xs text-slate-500 mt-0.5">Party: {party.name}</div>}
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
    </div>
  );
}
