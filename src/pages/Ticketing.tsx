import { Plus, Search, Plane } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Ticketing() {
  const handleExport = () => {
    const mockData = [
      { PNR: 'XT49KL', 'Passenger Name': 'Muhammad Ali', Airline: 'Emirates', Sector: 'LHE - DXB', Date: '12 Oct 2026', 'Amount (Rs)': 125000, Status: 'Confirmed' },
      { PNR: 'B78PQ9', 'Passenger Name': 'Aisha Khan', Airline: 'Qatar Airways', Sector: 'ISB - DOH - LHR', Date: '15 Oct 2026', 'Amount (Rs)': 210000, Status: 'Confirmed' },
      { PNR: 'ZN22WX', 'Passenger Name': 'Ahmed Hassan', Airline: 'PIA', Sector: 'KHI - JED', Date: '18 Oct 2026', 'Amount (Rs)': 95000, Status: 'On Hold' }
    ];
    const ws = XLSX.utils.json_to_sheet(mockData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ticketing");
    XLSX.writeFile(wb, "Air_Ticketing.xlsx");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Air Ticketing</h2>
          <p className="text-slate-500 text-sm mt-1">Manage flight bookings, PNRs, and issue new tickets.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all hover:shadow">
          <Plus className="w-4 h-4" />
          Issue New Ticket
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search PNR or passenger..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Filter
            </button>
            <button onClick={handleExport} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Export
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">PNR</th>
                <th className="px-6 py-4">Passenger Name</th>
                <th className="px-6 py-4">Airline</th>
                <th className="px-6 py-4">Sector</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount (Rs)</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Mock Data */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-mono font-medium text-blue-600">XT49KL</td>
                <td className="px-6 py-4 font-medium text-slate-900">Muhammad Ali</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-slate-400" />
                    Emirates
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">LHE - DXB</td>
                <td className="px-6 py-4">12 Oct 2026</td>
                <td className="px-6 py-4 text-right font-medium">125,000</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Confirmed
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-mono font-medium text-blue-600">B78PQ9</td>
                <td className="px-6 py-4 font-medium text-slate-900">Aisha Khan</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-slate-400" />
                    Qatar Airways
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">ISB - DOH - LHR</td>
                <td className="px-6 py-4">15 Oct 2026</td>
                <td className="px-6 py-4 text-right font-medium">210,000</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Confirmed
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-mono font-medium text-blue-600">ZN22WX</td>
                <td className="px-6 py-4 font-medium text-slate-900">Ahmed Hassan</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-slate-400" />
                    PIA
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">KHI - JED</td>
                <td className="px-6 py-4">18 Oct 2026</td>
                <td className="px-6 py-4 text-right font-medium">95,000</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                    On Hold
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
