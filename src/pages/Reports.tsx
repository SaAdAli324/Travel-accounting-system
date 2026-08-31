import { useEffect, useState } from 'react';
import { FileText, Download, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import type { Invoice } from '../types';
import * as XLSX from 'xlsx';

export default function Reports() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await api.getInvoices();
        setInvoices(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const totalSales = invoices.reduce((sum, inv) => sum + (inv.total_selling_amount || 0), 0);
  const totalCost = invoices.reduce((sum, inv) => sum + (inv.total_vendor_amount || 0), 0);
  const totalProfit = invoices.reduce((sum, inv) => sum + (inv.total_profit || 0), 0);
  const totalReceived = invoices.reduce((sum, inv) => sum + (inv.amount_received || 0), 0);
  const totalOutstanding = totalSales - totalReceived;

  const handleExportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(invoices.map(inv => ({
      'Invoice #': inv.invoice_number,
      'Customer': (inv.party_id as any)?.name || 'Unknown',
      'Date': new Date(inv.date).toLocaleDateString(),
      'Sales (Rs)': inv.total_selling_amount,
      'Cost (Rs)': inv.total_vendor_amount,
      'Profit (Rs)': inv.total_profit
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Profit_Report");
    XLSX.writeFile(wb, "Profit_Report.csv");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Profit Calculator & Reports</h2>
        <p className="text-slate-500 text-sm mt-1">Overview of your financial performance based on invoices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600"><TrendingUp className="w-5 h-5" /></div>
            <h3 className="font-semibold text-slate-700">Total Sales</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">Rs. {totalSales.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-lg bg-rose-50 text-rose-600"><FileText className="w-5 h-5" /></div>
            <h3 className="font-semibold text-slate-700">Total Cost (Vendor)</h3>
          </div>
          <p className="text-2xl font-bold text-slate-900">Rs. {totalCost.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600"><PieChart className="w-5 h-5" /></div>
            <h3 className="font-semibold text-slate-700">Net Profit</h3>
          </div>
          <p className="text-2xl font-bold text-emerald-600">Rs. {totalProfit.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600"><DollarSign className="w-5 h-5" /></div>
            <h3 className="font-semibold text-slate-700">Outstanding</h3>
          </div>
          <p className="text-2xl font-bold text-amber-600">Rs. {totalOutstanding.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-lg">Profit by Invoice</h3>
          <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium px-4 py-2 rounded-lg border border-slate-200 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Sales</th>
                <th className="px-6 py-4 text-right">Cost</th>
                <th className="px-6 py-4 text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No data found.</td></tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-slate-900">{inv.invoice_number}</td>
                    <td className="px-6 py-3">{(inv.party_id as any)?.name || 'Unknown'}</td>
                    <td className="px-6 py-3">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-right">Rs. {inv.total_selling_amount.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right">Rs. {inv.total_vendor_amount.toLocaleString()}</td>
                    <td className="px-6 py-3 text-right font-medium text-emerald-600">Rs. {inv.total_profit.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
