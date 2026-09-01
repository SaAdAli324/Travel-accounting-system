import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import type { Party, InvoiceSection, Invoice } from '../../types';

interface InvoiceFormProps {
  mode: 'create' | 'edit';
  initialData?: Invoice | null;
  customers: Party[];
  vendors: Party[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function InvoiceForm({ mode, initialData, customers, vendors, onSave, onCancel }: InvoiceFormProps) {
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [hotelSections, setHotelSections] = useState<InvoiceSection[]>([]);
  const [ticketSections, setTicketSections] = useState<InvoiceSection[]>([]);
  const [visaSections, setVisaSections] = useState<InvoiceSection[]>([]);
  const [toursSections, setToursSections] = useState<InvoiceSection[]>([]);
  const [transportSections, setTransportSections] = useState<InvoiceSection[]>([]);
  const [otherSections, setOtherSections] = useState<InvoiceSection[]>([]);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setInvoiceDate(initialData.date || new Date().toISOString().split('T')[0]);
      setSelectedPartyId(typeof initialData.party_id === 'string' ? initialData.party_id : (initialData.party_id as any)._id || (initialData.party_id as any).id);
      setHotelSections(initialData.hotel || []);
      setTicketSections(initialData.tickets || []);
      setVisaSections(initialData.visa || []);
      setToursSections(initialData.tours || []);
      setTransportSections(initialData.transport || []);
      setOtherSections(initialData.other || []);
      setAmountReceived(initialData.amount_received || 0);
    }
  }, [mode, initialData]);

  const handleAddSection = (type: 'hotel' | 'tickets' | 'visa' | 'tours' | 'transport' | 'other') => {
    const newSection = { description: '', vendor_id: '', vendor_amount: 0, selling_amount: 0, check_in: '', check_out: '', room_type: '', meal_plan: '', visa_type: '', visa_country: '', airline_name: '', travel_date: '', sectors: '' };
    if (type === 'hotel') setHotelSections([...hotelSections, newSection]);
    if (type === 'tickets') setTicketSections([...ticketSections, newSection]);
    if (type === 'visa') setVisaSections([...visaSections, newSection]);
    if (type === 'tours') setToursSections([...toursSections, newSection]);
    if (type === 'transport') setTransportSections([...transportSections, newSection]);
    if (type === 'other') setOtherSections([...otherSections, newSection]);
  };

  const handleUpdateSection = (type: string, index: number, field: string, value: any) => {
    let sections: InvoiceSection[] = [];
    let setSections: any;
    if (type === 'hotel') { sections = [...hotelSections]; setSections = setHotelSections; }
    if (type === 'tickets') { sections = [...ticketSections]; setSections = setTicketSections; }
    if (type === 'visa') { sections = [...visaSections]; setSections = setVisaSections; }
    if (type === 'tours') { sections = [...toursSections]; setSections = setToursSections; }
    if (type === 'transport') { sections = [...transportSections]; setSections = setTransportSections; }
    if (type === 'other') { sections = [...otherSections]; setSections = setOtherSections; }
    
    (sections[index] as any)[field] = value;
    setSections(sections);
  };

  const renderSectionInputs = (title: string, type: string, sections: InvoiceSection[]) => (
    <div className="mb-4 p-4 border border-slate-200 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <button type="button" onClick={() => handleAddSection(type as any)} className="text-blue-600 text-sm hover:underline flex items-center">
          <Plus className="w-3 h-3 mr-1" /> Add {title}
        </button>
      </div>
      {sections.map((sec, i) => (
        <div key={i} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
          <div className="flex gap-2 mb-2">
            <input 
              type="text" placeholder="Description" 
              className="flex-1 border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={sec.description} onChange={e => handleUpdateSection(type, i, 'description', e.target.value)} 
            />
            <select
              className="w-40 border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={sec.vendor_id || ''} 
              onChange={e => handleUpdateSection(type, i, 'vendor_id', e.target.value)}
            >
              <option value="">Select Vendor...</option>
              {vendors.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <input 
              type="number" placeholder="Vendor Cost" 
              className="w-32 border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={sec.vendor_amount || ''} onChange={e => handleUpdateSection(type, i, 'vendor_amount', Number(e.target.value))} 
            />
            <input 
              type="number" placeholder="Selling Price" 
              className="w-32 border border-slate-300 p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={sec.selling_amount || ''} onChange={e => handleUpdateSection(type, i, 'selling_amount', Number(e.target.value))} 
            />
          </div>
          {type === 'hotel' && (
            <div className="flex gap-2 flex-wrap mt-2">
              <div className="flex-1 flex gap-2 items-center min-w-[140px]">
                 <span className="text-xs text-slate-500 w-16">Check In</span>
                 <input type="date" className="flex-1 border border-slate-300 p-2 rounded text-sm text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" value={sec.check_in || ''} onChange={e => handleUpdateSection(type, i, 'check_in', e.target.value)} />
              </div>
              <div className="flex-1 flex gap-2 items-center min-w-[140px]">
                 <span className="text-xs text-slate-500 w-16">Check Out</span>
                 <input type="date" className="flex-1 border border-slate-300 p-2 rounded text-sm text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none" value={sec.check_out || ''} onChange={e => handleUpdateSection(type, i, 'check_out', e.target.value)} />
              </div>
              <input type="text" placeholder="Room Type (e.g. Quad)" className="flex-1 border border-slate-300 p-2 rounded text-sm min-w-[120px] focus:ring-2 focus:ring-blue-500 outline-none" value={sec.room_type || ''} onChange={e => handleUpdateSection(type, i, 'room_type', e.target.value)} />
              <input type="text" placeholder="Meal Plan (e.g. FB, BB)" className="flex-1 border border-slate-300 p-2 rounded text-sm min-w-[120px] focus:ring-2 focus:ring-blue-500 outline-none" value={sec.meal_plan || ''} onChange={e => handleUpdateSection(type, i, 'meal_plan', e.target.value)} />
            </div>
          )}
          {type === 'tickets' && (
            <div className="flex gap-2 flex-wrap mt-2">
              <input type="text" placeholder="Airline Name (e.g. Emirates)" className="flex-1 border border-slate-300 p-2 rounded text-sm min-w-[150px] focus:ring-2 focus:ring-blue-500 outline-none" value={sec.airline_name || ''} onChange={e => handleUpdateSection(type, i, 'airline_name', e.target.value)} />
              <input type="date" className="flex-1 border border-slate-300 p-2 rounded text-sm text-slate-600 min-w-[150px] focus:ring-2 focus:ring-blue-500 outline-none" value={sec.travel_date || ''} onChange={e => handleUpdateSection(type, i, 'travel_date', e.target.value)} />
              <input type="text" placeholder="Sectors (e.g. KHI-DXB-KHI)" className="flex-1 border border-slate-300 p-2 rounded text-sm min-w-[150px] focus:ring-2 focus:ring-blue-500 outline-none" value={sec.sectors || ''} onChange={e => handleUpdateSection(type, i, 'sectors', e.target.value)} />
            </div>
          )}
          {type === 'visa' && (
            <div className="flex gap-2 flex-wrap mt-2">
              <input type="text" placeholder="Visa Type (e.g. Tourist, Business)" className="flex-1 border border-slate-300 p-2 rounded text-sm min-w-[150px] focus:ring-2 focus:ring-blue-500 outline-none" value={sec.visa_type || ''} onChange={e => handleUpdateSection(type, i, 'visa_type', e.target.value)} />
              <input type="text" placeholder="Country (e.g. UAE, UK)" className="flex-1 border border-slate-300 p-2 rounded text-sm min-w-[150px] focus:ring-2 focus:ring-blue-500 outline-none" value={sec.visa_country || ''} onChange={e => handleUpdateSection(type, i, 'visa_country', e.target.value)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const handleSubmit = async () => {
    if (!selectedPartyId || !invoiceDate) {
      alert('Customer and Date are required');
      return;
    }
    const data = {
      party_id: selectedPartyId,
      date: invoiceDate,
      hotel: hotelSections,
      tickets: ticketSections,
      visa: visaSections,
      tours: toursSections,
      transport: transportSections,
      other: otherSections,
      amount_received: amountReceived
    };
    setIsSubmitting(true);
    try {
      await onSave(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateTotal = (sections: InvoiceSection[]) => sections.reduce((sum, item) => sum + (item.selling_amount || 0), 0);
  const totalAmount = calculateTotal(hotelSections) + calculateTotal(ticketSections) + calculateTotal(visaSections) + calculateTotal(toursSections) + calculateTotal(transportSections) + calculateTotal(otherSections);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <h3 className="text-lg font-semibold text-slate-800">{mode === 'create' ? 'Create New Invoice' : 'Edit Invoice'}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer <span className="text-red-500">*</span></label>
              <select 
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(e.target.value)}
              >
                <option value="">Select a customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Date <span className="text-red-500">*</span></label>
              <input 
                type="date" 
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            {renderSectionInputs('Hotels', 'hotel', hotelSections)}
            {renderSectionInputs('Tickets', 'tickets', ticketSections)}
            {renderSectionInputs('Visa', 'visa', visaSections)}
            {renderSectionInputs('Tours', 'tours', toursSections)}
            {renderSectionInputs('Transport', 'transport', transportSections)}
            {renderSectionInputs('Other', 'other', otherSections)}
          </div>

          <div className="mt-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
            <h3 className="font-semibold mb-2 text-slate-700">Payment Details (Optional)</h3>
            <div className="flex gap-2">
              <div className="flex-1 max-w-xs">
                <label className="block text-sm text-slate-600 mb-1">Amount Received So Far</label>
                <input 
                  type="number" 
                  className="w-full border border-slate-300 p-2 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={amountReceived === 0 ? '' : amountReceived}
                  onChange={e => setAmountReceived(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center rounded-b-xl">
          <div className="text-lg font-semibold text-slate-800">
            Total Invoice Amount: <span className="text-blue-600">Rs. {totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50" disabled={isSubmitting}>Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create Invoice' : 'Save Changes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
