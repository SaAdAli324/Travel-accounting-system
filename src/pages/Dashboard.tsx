import { useEffect, useState } from 'react';
import { TrendingUp, Users, CreditCard, DollarSign } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import type { Invoice, Party } from '../types';

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Party[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invData, custData] = await Promise.all([
          api.getInvoices(),
          api.getParties('customer')
        ]);
        setInvoices(invData);
        setCustomers(custData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7); // "YYYY-MM"

  let todaysRevenue = 0;
  let thisMonthProfit = 0;
  let totalReceivables = 0;

  // For Chart
  const chartDataMap: Record<string, { name: string, Revenue: number, Expenses: number }> = {};

  invoices.forEach(inv => {
    if (inv.date === today) {
      todaysRevenue += (inv.total_selling_amount || 0);
    }
    if (inv.date.startsWith(currentMonth)) {
      thisMonthProfit += (inv.total_profit || 0);
    }
    totalReceivables += (inv.total_selling_amount || 0) - (inv.amount_received || 0);

    // Chart Data Aggregation
    const d = new Date(inv.date);
    const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!chartDataMap[dateKey]) {
      chartDataMap[dateKey] = { name: dateKey, Revenue: 0, Expenses: 0 };
    }
    chartDataMap[dateKey].Revenue += (inv.total_selling_amount || 0);
    chartDataMap[dateKey].Expenses += (inv.total_vendor_amount || 0);
  });

  // Since we use object keys it might be out of order, so let's just reverse the original array or sort.
  // Actually, Object.values won't maintain order reliably. Let's rebuild it from a sorted invoice list.
  const sortedInvoices = [...invoices].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const finalChartDataMap: Record<string, { name: string, Revenue: number, Expenses: number }> = {};
  sortedInvoices.forEach(inv => {
    const d = new Date(inv.date);
    const dateKey = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!finalChartDataMap[dateKey]) {
      finalChartDataMap[dateKey] = { name: dateKey, Revenue: 0, Expenses: 0 };
    }
    finalChartDataMap[dateKey].Revenue += (inv.total_selling_amount || 0);
    finalChartDataMap[dateKey].Expenses += (inv.total_vendor_amount || 0);
  });

  // Take the last 7 active days for the chart
  const finalChartData = Object.values(finalChartDataMap).slice(-7);

  const activeCustomers = customers.length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-slate-500">Welcome to TravelSys. Here is the daily overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 rounded-full bg-blue-50 text-blue-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Today's Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900">Rs. {todaysRevenue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 rounded-full bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Profit (This Month)</p>
            <h3 className="text-2xl font-bold text-slate-900">Rs. {thisMonthProfit.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 rounded-full bg-orange-50 text-orange-600">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Receivables</p>
            <h3 className="text-2xl font-bold text-slate-900">Rs. {totalReceivables.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 rounded-full bg-indigo-50 text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Customers</p>
            <h3 className="text-2xl font-bold text-slate-900">{activeCustomers}</h3>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold mb-6">Revenue vs Expenses (Last 7 Active Days)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={finalChartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b' }}
                tickFormatter={(value) => `Rs. ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`Rs. ${Number(value).toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
