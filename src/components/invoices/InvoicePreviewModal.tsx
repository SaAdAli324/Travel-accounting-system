import React from 'react';
import { X, Printer } from 'lucide-react';
import type { Invoice, Party, InvoiceSection } from '../../types';

interface InvoicePreviewModalProps {
  invoice: Invoice;
  party: Party | undefined;
  onClose: () => void;
  onPrint: (inv: Invoice) => void;
}

export function InvoicePreviewModal({ invoice, party, onClose, onPrint }: InvoicePreviewModalProps) {
  
  const renderSection = (title: string, sections: InvoiceSection[], isHotel = false) => {
    if (!sections || sections.length === 0) return null;
    return (
      <div className="mb-6">
        <h4 className="font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-3">{title}</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2">Description</th>
                {isHotel && <th className="px-3 py-2">Check In/Out</th>}
                {isHotel && <th className="px-3 py-2">Room/Meal</th>}
                <th className="px-3 py-2 text-right">Vendor Price</th>
                <th className="px-3 py-2 text-right">Selling Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sections.map((sec, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-3 py-2">{sec.description || '-'}</td>
                  {isHotel && (
                    <td className="px-3 py-2">
                      <div className="text-xs text-slate-500">In: {sec.check_in || '-'}</div>
                      <div className="text-xs text-slate-500">Out: {sec.check_out || '-'}</div>
                    </td>
                  )}
                  {isHotel && (
                    <td className="px-3 py-2">
                      <div className="text-xs text-slate-500">{sec.room_type || '-'}</div>
                      <div className="text-xs text-slate-500">{sec.meal_plan || '-'}</div>
                    </td>
                  )}
                  <td className="px-3 py-2 text-right">Rs. {(sec.vendor_amount || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900">Rs. {(sec.selling_amount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Invoice Preview: {invoice.invoice_number}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2
              ${invoice.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 
                invoice.status === 'Partial' ? 'bg-amber-100 text-amber-800' : 
                invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800' : 
                'bg-slate-100 text-slate-800'}`}
            >
              {invoice.status}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onPrint(invoice)}
              className="flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bill To</p>
              {party ? (
                <>
                  <p className="font-bold text-slate-900 text-lg">{party.name}</p>
                  {party.phone && <p className="text-slate-600 text-sm mt-1">{party.phone}</p>}
                  {party.email && <p className="text-slate-600 text-sm">{party.email}</p>}
                </>
              ) : (
                <p className="font-medium text-slate-700">Unknown Customer</p>
              )}
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-right">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Invoice Details</p>
              <p className="font-medium text-slate-900">Date: {new Date(invoice.date).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="space-y-2">
            {renderSection('Hotel Details', invoice.hotel || [], true)}
            {renderSection('Ticketing Details', invoice.tickets || [])}
            {renderSection('Visa Details', invoice.visa || [])}
            {renderSection('Other Services', invoice.other || [])}
          </div>
        </div>

        {/* Footer (Totals) */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col items-end rounded-b-xl">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Total Selling Amount:</span>
              <span className="font-medium">Rs. {(invoice.total_selling_amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Amount Received:</span>
              <span className="font-medium text-emerald-600">Rs. {(invoice.amount_received || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-200 pt-3">
              <span>Balance Due:</span>
              <span>Rs. {((invoice.total_selling_amount || 0) - (invoice.amount_received || 0)).toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
