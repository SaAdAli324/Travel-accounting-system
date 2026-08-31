import React from 'react';
import { Loader2 } from 'lucide-react';

export type DialogType = 'success' | 'error' | 'warning' | 'confirm';

interface DialogModalProps {
  isOpen: boolean;
  type: DialogType;
  title?: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  isProcessing?: boolean;
}

export function DialogModal({ isOpen, type, title, message, onClose, onConfirm, isProcessing }: DialogModalProps) {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
        <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 
          ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
            type === 'error' ? 'bg-red-100 text-red-600' : 
            'bg-amber-100 text-amber-600'}`}
        >
          {type === 'success' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
          {type === 'error' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>}
          {(type === 'warning' || type === 'confirm') && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
        </div>
        
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {title || (type.charAt(0).toUpperCase() + type.slice(1))}
        </h3>
        
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        
        <div className={`flex gap-3 ${isConfirm ? 'justify-between' : 'justify-center'}`}>
          {isConfirm && (
            <button 
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button 
            onClick={isConfirm ? onConfirm : onClose}
            disabled={isProcessing}
            className={`flex-1 py-2 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2
              ${type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                type === 'error' ? 'bg-red-600 hover:bg-red-700' : 
                'bg-amber-600 hover:bg-amber-700'}`}
          >
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isConfirm ? 'Confirm' : 'Okay'}
          </button>
        </div>
      </div>
    </div>
  );
}
