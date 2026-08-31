import { Save, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DialogModal, type DialogType } from '../components/ui/DialogModal';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{isOpen: boolean, message: string, type: DialogType}>({ isOpen: false, message: '', type: 'success' });
  const [settings, setSettings] = useState({
    company_name: '',
    contact_number: '',
    address: '',
    default_sales_tax: 0,
    default_wht: 0,
    ntn_number: '',
    base_currency: 'PKR',
    show_on_reports: true,
  });

  useEffect(() => {
    api.getSettings()
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setDialog({ isOpen: true, message: 'Settings saved successfully!', type: 'success' });
    } catch (error) {
      console.error(error);
      setDialog({ isOpen: true, message: 'Failed to save settings. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Configure your agency details and taxation rules.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Company Profile</h3>
          <p className="text-sm text-slate-500 mb-4">This information will appear on your invoices and reports.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
              <input type="text" name="company_name" value={settings.company_name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
              <input type="text" name="contact_number" value={settings.contact_number} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <input type="text" name="address" value={settings.address} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Taxation & Finance (Pakistan)</h3>
          <p className="text-sm text-slate-500 mb-4">Configure default FBR/PRA tax rates for invoices.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Sales Tax (%)</label>
              <input type="number" name="default_sales_tax" value={settings.default_sales_tax} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default WHT (%)</label>
              <input type="number" name="default_wht" value={settings.default_wht} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">NTN Number</label>
              <input type="text" name="ntn_number" value={settings.ntn_number} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Base Currency</label>
              <input type="text" disabled value={settings.base_currency} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500" />
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Preferences</h3>
          <p className="text-sm text-slate-500 mb-4">Manage how your details are displayed.</p>
          
          <div className="flex items-center">
            <input 
              type="checkbox" 
              name="show_on_reports" 
              checked={settings.show_on_reports} 
              onChange={handleChange} 
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-slate-900">
              Show company details (Name, Address, Contact) on exported reports (e.g. Ledger PDFs)
            </label>
          </div>
        </div>

        <div className="p-6 bg-slate-50 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      <DialogModal 
        isOpen={dialog.isOpen} 
        type={dialog.type} 
        message={dialog.message} 
        onClose={() => setDialog({ ...dialog, isOpen: false })} 
      />
    </div>
  );
}
