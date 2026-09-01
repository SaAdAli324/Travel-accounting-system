import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import type { Party } from '../types';
import { DialogModal, type DialogType } from '../components/ui/DialogModal';

export default function Vendors() {
  const [vendors, setVendors] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    contact_person: '',
    opening_balance: 0
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{isOpen: boolean, type: DialogType, message: string, title?: string}>({ isOpen: false, type: 'success', message: '' });

  const fetchVendors = async () => {
    try {
      const data = await api.getParties('vendor');
      setVendors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    // Validation Rules
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email address';
    if (formData.phone && !/^[\d\s+\-()]+$/.test(formData.phone)) errors.phone = 'Phone can only contain numbers and basic symbols (+ - ( ))';
    if (isNaN(formData.opening_balance)) errors.opening_balance = 'Opening balance must be a valid number';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (editingVendorId) {
        await api.updateParty(editingVendorId, {
          party_type: 'vendor',
          ...formData
        });
      } else {
        await api.createParty({
          party_type: 'vendor',
          ...formData
        });
      }
      setIsModalOpen(false);
      setEditingVendorId(null);
      setFormData({ name: '', phone: '', email: '', contact_person: '', opening_balance: 0 });
      setFormErrors({});
      fetchVendors();
      setDialog({ isOpen: true, type: 'success', message: `Vendor ${editingVendorId ? 'updated' : 'created'} successfully!` });
    } catch (err: any) {
      console.error(err);
      setDialog({ isOpen: true, type: 'error', message: err.message || (editingVendorId ? 'Failed to update vendor' : 'Failed to create vendor') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVendor = (vendor: Party) => {
    setEditingVendorId(vendor.id!);
    setFormData({
      name: vendor.name || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      contact_person: vendor.contact_person || '',
      opening_balance: vendor.opening_balance || 0
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id);
    setDialog({ isOpen: true, type: 'confirm', title: 'Confirm Deletion', message: 'Are you sure you want to delete this vendor?' });
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeletingId(pendingDeleteId);
    setDialog(prev => ({ ...prev, isProcessing: true } as any));
    
    try {
      await api.deleteParty(pendingDeleteId);
      fetchVendors();
      setDialog({ isOpen: true, type: 'success', message: 'Vendor deleted successfully!' });
    } catch (err: any) {
      console.error(err);
      setDialog({ isOpen: true, type: 'error', message: err.message || 'Failed to delete vendor' });
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
          <h2 className="text-2xl font-bold tracking-tight">Vendors</h2>
          <p className="text-slate-500">Manage your vendor accounts.</p>
        </div>
        <button 
          onClick={() => {
            setEditingVendorId(null);
            setFormData({ name: '', phone: '', email: '', contact_person: '', opening_balance: 0 });
            setFormErrors({});
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Contact Person</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Opening Balance</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No vendors found.</td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900">{vendor.name}</td>
                    <td className="px-6 py-3 text-slate-600">{vendor.contact_person || '-'}</td>
                    <td className="px-6 py-3 text-slate-600">{vendor.email || '-'}</td>
                    <td className="px-6 py-3">{vendor.phone || '-'}</td>
                    <td className="px-6 py-3">Rs. {(vendor.opening_balance || 0).toLocaleString()}</td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleEditVendor(vendor)}
                          className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-full transition-colors"
                          title="Edit Vendor"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(vendor.id!)}
                          disabled={deletingId === vendor.id}
                          className="text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded-full transition-colors disabled:opacity-50"
                          title="Delete Vendor"
                        >
                          {deletingId === vendor.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold">{editingVendorId ? 'Edit Vendor' : 'Add New Vendor'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vendor Name *</label>
                <input type="text" className={`w-full border p-2 rounded-lg ${formErrors.name ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} value={formData.name} onChange={e => { setFormData({...formData, name: e.target.value}); setFormErrors(prev => ({...prev, name: ''})) }} />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                <input type="text" className="w-full border border-slate-300 p-2 rounded-lg" value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input type="text" className={`w-full border p-2 rounded-lg ${formErrors.phone ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} value={formData.phone} onChange={e => { setFormData({...formData, phone: e.target.value}); setFormErrors(prev => ({...prev, phone: ''})) }} />
                {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" className={`w-full border p-2 rounded-lg ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} value={formData.email} onChange={e => { setFormData({...formData, email: e.target.value}); setFormErrors(prev => ({...prev, email: ''})) }} />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Opening Balance (Rs.)</label>
                <input type="number" className={`w-full border p-2 rounded-lg ${formErrors.opening_balance ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} value={formData.opening_balance === 0 ? '' : formData.opening_balance} onChange={e => { setFormData({...formData, opening_balance: Number(e.target.value)}); setFormErrors(prev => ({...prev, opening_balance: ''})) }} />
                {formErrors.opening_balance && <p className="text-red-500 text-xs mt-1">{formErrors.opening_balance}</p>}
              </div>
              
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" disabled={isSubmitting} onClick={() => { setIsModalOpen(false); setEditingVendorId(null); }} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingVendorId ? 'Update Vendor' : 'Save Vendor'}
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
