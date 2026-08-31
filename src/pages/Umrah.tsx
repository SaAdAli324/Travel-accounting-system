import { Plus, Users, CalendarDays, Map } from 'lucide-react';

export default function Umrah() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Umrah & Hajj Packages</h2>
          <p className="text-slate-500 text-sm mt-1">Manage group packages, transport, hotels, and pilgrims.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all hover:shadow">
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mock Group Card 1 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="h-2 bg-emerald-500 w-full"></div>
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Rabi-ul-Awal Special</h3>
                <p className="text-slate-500 text-sm">Group ID: GRP-2026-14</p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Active
              </span>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-slate-600">
                <CalendarDays className="w-4 h-4 mr-2 text-slate-400" />
                12 Oct 2026 - 26 Oct 2026 (14 Days)
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Users className="w-4 h-4 mr-2 text-slate-400" />
                45/50 Pilgrims Booked
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Map className="w-4 h-4 mr-2 text-slate-400" />
                Makkah (7N) / Madinah (7N)
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Starting from</p>
                <p className="font-bold text-slate-900">Rs. 240,000 <span className="font-normal text-xs text-slate-500">/ pax</span></p>
              </div>
              <button className="text-blue-600 font-medium text-sm hover:text-blue-700">Manage &rarr;</button>
            </div>
          </div>
        </div>

        {/* Mock Group Card 2 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="h-2 bg-amber-500 w-full"></div>
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Premium Safar</h3>
                <p className="text-slate-500 text-sm">Group ID: GRP-2026-15</p>
              </div>
              <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
                Booking Open
              </span>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-slate-600">
                <CalendarDays className="w-4 h-4 mr-2 text-slate-400" />
                01 Nov 2026 - 21 Nov 2026 (21 Days)
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Users className="w-4 h-4 mr-2 text-slate-400" />
                12/40 Pilgrims Booked
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Map className="w-4 h-4 mr-2 text-slate-400" />
                Makkah (12N) / Madinah (9N)
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Starting from</p>
                <p className="font-bold text-slate-900">Rs. 310,000 <span className="font-normal text-xs text-slate-500">/ pax</span></p>
              </div>
              <button className="text-blue-600 font-medium text-sm hover:text-blue-700">Manage &rarr;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
