import { Plus, Search } from 'lucide-react';

export default function Visa() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Visa Processing</h2>
          <p className="text-slate-500 text-sm mt-1">Track visa applications, submissions, and approvals.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-all hover:shadow">
          <Plus className="w-4 h-4" />
          New Application
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-slate-500 text-sm font-medium">In Process</span>
          <span className="text-3xl font-bold text-slate-900 mt-2">24</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-slate-500 text-sm font-medium">Approved (This Month)</span>
          <span className="text-3xl font-bold text-emerald-600 mt-2">142</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-slate-500 text-sm font-medium">Rejected</span>
          <span className="text-3xl font-bold text-red-600 mt-2">3</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search passport or applicant..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Applicant Name</th>
                <th className="px-6 py-4">Passport No.</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Visa Type</th>
                <th className="px-6 py-4">Submission Date</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Mock Data */}
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">Tariq Mahmood</td>
                <td className="px-6 py-4 font-mono text-slate-600">AG4598212</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <div className="w-6 h-4 bg-green-700 rounded-sm overflow-hidden flex">
                     {/* Saudi Flag Mock */}
                     <span className="text-[6px] text-white w-full text-center mt-0.5">KSA</span>
                  </div>
                  Saudi Arabia
                </td>
                <td className="px-6 py-4 text-slate-500">Umrah E-Visa</td>
                <td className="px-6 py-4">02 Sep 2026</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Approved
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">Fatima Bibi</td>
                <td className="px-6 py-4 font-mono text-slate-600">CD9012345</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <div className="w-6 h-4 bg-blue-800 rounded-sm overflow-hidden relative">
                    <span className="text-[6px] text-white absolute left-0.5 top-0.5">UAE</span>
                  </div>
                  UAE
                </td>
                <td className="px-6 py-4 text-slate-500">30 Days Tourist</td>
                <td className="px-6 py-4">08 Sep 2026</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    Submitted
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">Zain Ali</td>
                <td className="px-6 py-4 font-mono text-slate-600">EF6789012</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <div className="w-6 h-4 bg-red-600 rounded-sm overflow-hidden"></div>
                  Turkey
                </td>
                <td className="px-6 py-4 text-slate-500">Visit Visa</td>
                <td className="px-6 py-4">10 Sep 2026</td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                    Draft
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
