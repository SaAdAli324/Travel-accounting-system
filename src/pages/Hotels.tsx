import { Plus, Search, MapPin } from 'lucide-react';

export default function Hotels() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Hotel Bookings</h2>
          <p className="text-slate-500 text-sm mt-1">Manage local and international hotel reservations.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all hover:shadow">
          <Plus className="w-4 h-4" />
          New Booking
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search guest or hotel..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Guest Name</th>
                <th className="px-6 py-4">Hotel</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Nights/Rooms</th>
                <th className="px-6 py-4 text-right">Cost (Rs)</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">Salman Qureshi</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">Swissôtel Makkah</div>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <MapPin className="w-3 h-3 mr-1" /> Makkah, KSA
                  </div>
                </td>
                <td className="px-6 py-4">22 Sep 2026</td>
                <td className="px-6 py-4">28 Sep 2026</td>
                <td className="px-6 py-4 text-slate-500">6 Nights / 2 Double</td>
                <td className="px-6 py-4 text-right font-medium">180,000</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Confirmed
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">Imran Family</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">Pearl Continental</div>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <MapPin className="w-3 h-3 mr-1" /> Lahore, PK
                  </div>
                </td>
                <td className="px-6 py-4">05 Oct 2026</td>
                <td className="px-6 py-4">07 Oct 2026</td>
                <td className="px-6 py-4 text-slate-500">2 Nights / 1 Family</td>
                <td className="px-6 py-4 text-right font-medium">45,000</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    Requested
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
