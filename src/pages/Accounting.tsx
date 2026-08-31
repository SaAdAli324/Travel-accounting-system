import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Plus, Trash2, Edit2, Loader2 } from 'lucide-react';
import type { COA } from '../types';
import { DialogModal, type DialogType } from '../components/ui/DialogModal';

export default function Accounting() {
  const [coa, setCoa] = useState<COA[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{isOpen: boolean, type: DialogType, message: string, title?: string}>({ isOpen: false, type: 'success', message: '' });

  const [formData, setFormData] = useState({
    account_code: '',
    account_name: '',
    account_type: 'asset'
  });

  const fetchCOA = async () => {
    try {
      const data = await api.getCOA();
      setCoa(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCOA();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_code || !formData.account_name) {
      setDialog({ isOpen: true, type: 'error', message: 'Code and Name are required' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingAccountId) {
        await api.updateCOA({ id: editingAccountId, ...formData });
      } else {
        await api.createCOA(formData);
      }
      setIsModalOpen(false);
      setEditingAccountId(null);
      setFormData({ account_code: '', account_name: '', account_type: 'asset' });
      fetchCOA();
      setDialog({ isOpen: true, type: 'success', message: `Account ${editingAccountId ? 'updated' : 'created'} successfully!` });
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, type: 'error', message: editingAccountId ? 'Failed to update account' : 'Failed to create account' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAccount = (account: COA) => {
    setEditingAccountId(account.id!);
    setFormData({
      account_code: account.account_code || '',
      account_name: account.account_name || '',
      account_type: account.account_type || 'asset'
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id);
    setDialog({ isOpen: true, type: 'confirm', title: 'Confirm Deletion', message: 'Are you sure you want to delete this account?' });
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeletingId(pendingDeleteId);
    
    // We can show loader in the dialog
    setDialog(prev => ({ ...prev, isProcessing: true } as any));
    
    try {
      await api.deleteCOA(pendingDeleteId);
      fetchCOA();
      setDialog({ isOpen: true, type: 'success', message: 'Account deleted successfully!' });
    } catch (err) {
      console.error(err);
      setDialog({ isOpen: true, type: 'error', message: 'Failed to delete account' });
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
    setPendingDeleteId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Chart of Accounts</h2>
          <p className="text-slate-500">Manage your accounting ledger accounts.</p>
        </div>
        <button 
          onClick={() => {
            setEditingAccountId(null);
            setFormData({ account_code: '', account_name: '', account_type: 'asset' });
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Account Code</th>
                <th className="px-6 py-4">Account Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : coa.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No accounts found.
                  </td>
                </tr>
              ) : (
                coa.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900">{account.account_code}</td>
                    <td className="px-6 py-3">{account.account_name}</td>
                    <td className="px-6 py-3 capitalize">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        account.account_type === 'asset' ? 'bg-emerald-100 text-emerald-800' :
                        account.account_type === 'liability' ? 'bg-orange-100 text-orange-800' :
                        account.account_type === 'revenue' ? 'bg-blue-100 text-blue-800' :
                        account.account_type === 'expense' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {account.account_type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {!account.is_system ? (
                          <>
                            <button 
                              onClick={() => handleEditAccount(account)}
                              className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-full transition-colors" 
                              title="Edit Account"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(account.id!)}
                              disabled={deletingId === account.id}
                              className="text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-full transition-colors disabled:opacity-50" 
                              title="Delete Account"
                            >
                              {deletingId === account.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold">{editingAccountId ? 'Edit Account' : 'Add New Account'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Code *</label>
                <input required type="text" className="w-full border border-slate-300 p-2 rounded-lg" value={formData.account_code} onChange={e => setFormData({...formData, account_code: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Name *</label>
                <input required type="text" className="w-full border border-slate-300 p-2 rounded-lg" value={formData.account_name} onChange={e => setFormData({...formData, account_name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Account Type *</label>
                <select 
                  className={`w-full border border-slate-300 p-2 rounded-lg ${editingAccountId && coa.find(c => c.id === editingAccountId)?.is_system ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                  value={formData.account_type} 
                  onChange={e => setFormData({...formData, account_type: e.target.value})}
                  disabled={!!(editingAccountId && coa.find(c => c.id === editingAccountId)?.is_system)}
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                </select>
                {editingAccountId && coa.find(c => c.id === editingAccountId)?.is_system && (
                  <p className="text-xs text-orange-600 mt-1">System account types cannot be changed.</p>
                )}
              </div>
              
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" disabled={isSubmitting} onClick={() => { setIsModalOpen(false); setEditingAccountId(null); }} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingAccountId ? 'Update Account' : 'Save Account'}
                </button>
              </div>
            </form>
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
