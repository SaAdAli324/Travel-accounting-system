import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Plus, Trash2, Edit2, Search, X, Loader2 } from 'lucide-react';
import type { JournalEntry, COA, JournalLine } from '../types';
import { DialogModal, type DialogType } from '../components/ui/DialogModal';

export default function Journals() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [coaList, setCoaList] = useState<COA[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{isOpen: boolean, type: DialogType, message: string, title?: string}>({ isOpen: false, type: 'success', message: '' });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [narration, setNarration] = useState('');
  const [lines, setLines] = useState<Partial<JournalLine>[]>([
    { account_id: '', debit: 0, credit: 0 },
    { account_id: '', debit: 0, credit: 0 }
  ]);

  const fetchData = async () => {
    try {
      const [jData, cData] = await Promise.all([
        api.getJournals(),
        api.getCOA()
      ]);
      setJournals(jData);
      setCoaList(cData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddLine = () => {
    setLines([...lines, { account_id: '', debit: 0, credit: 0 }]);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleUpdateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narration) {
      setDialog({ isOpen: true, type: 'error', message: 'Narration is required' });
      return;
    }
    if (totalDebit !== totalCredit) {
      setDialog({ isOpen: true, type: 'error', message: 'Total Debits must equal Total Credits' });
      return;
    }
    if (totalDebit === 0) {
      setDialog({ isOpen: true, type: 'error', message: 'Entry must have a non-zero value' });
      return;
    }
    
    // Ensure all lines have accounts
    for (const line of lines) {
      if (!line.account_id) {
        setDialog({ isOpen: true, type: 'error', message: 'All lines must have an account selected' });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (editingJournalId) {
        await api.updateJournal(editingJournalId, {
          entry: { date, reference, narration },
          lines: lines
        });
      } else {
        await api.createJournal({
          entry: { date, reference, narration },
          lines: lines
        });
      }
      setIsModalOpen(false);
      setEditingJournalId(null);
      setReference('');
      setNarration('');
      setLines([
        { account_id: '', debit: 0, credit: 0 },
        { account_id: '', debit: 0, credit: 0 }
      ]);
      fetchData();
      setDialog({ isOpen: true, type: 'success', message: `Journal entry ${editingJournalId ? 'updated' : 'created'} successfully!` });
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, type: 'error', message: editingJournalId ? 'Failed to update journal entry' : 'Failed to create journal entry' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditJournal = (journal: JournalEntry) => {
    setEditingJournalId(journal.id!);
    setDate(new Date(journal.date).toISOString().split('T')[0]);
    setReference(journal.reference || '');
    setNarration(journal.narration || '');
    setLines(journal.lines.map((l: any) => ({
      account_id: l.account_id,
      debit: l.debit || 0,
      credit: l.credit || 0
    })));
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id);
    setDialog({ isOpen: true, type: 'confirm', title: 'Confirm Deletion', message: 'Are you sure you want to delete this journal entry?' });
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeletingId(pendingDeleteId);
    setDialog(prev => ({ ...prev, isProcessing: true } as any));
    
    try {
      await api.deleteJournal(pendingDeleteId);
      fetchData();
      setDialog({ isOpen: true, type: 'success', message: 'Journal entry deleted successfully!' });
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, type: 'error', message: 'Failed to delete journal entry' });
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
    setPendingDeleteId(null);
  };

  const filteredJournals = journals.filter(journal => {
    let matchesSearch = true;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      matchesSearch = 
        (journal.reference && journal.reference.toLowerCase().includes(lowerQuery)) ||
        (journal.narration && journal.narration.toLowerCase().includes(lowerQuery));
    }
    
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(journal.date) >= new Date(startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && new Date(journal.date) <= new Date(endDate);
    }
    
    return matchesSearch && matchesDate;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Journal Entries</h2>
          <p className="text-slate-500">Read-only view of your general ledger journal entries.</p>
        </div>
      </div>

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
                <th className="px-6 py-4 text-right">Debit</th>
                <th className="px-6 py-4 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : filteredJournals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No journal entries found for this filter.</td>
                </tr>
              ) : (
                filteredJournals.map((journal) => (
                  <tr key={journal.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900">{new Date(journal.date).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-blue-600">{journal.reference || '-'}</td>
                    <td className="px-6 py-3 truncate max-w-xs">{journal.narration}</td>
                    <td className="px-6 py-3 text-right font-medium text-slate-700">
                      Rs. {journal.total_debit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-slate-700">
                      Rs. {journal.total_credit?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
