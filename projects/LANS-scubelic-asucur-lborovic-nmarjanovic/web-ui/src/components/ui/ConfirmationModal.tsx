import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  theme: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  theme,
  variant = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getVariantColors = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-rose-500 bg-rose-500/10',
          button: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
        };
      case 'warning':
        return {
          icon: 'text-amber-500 bg-amber-500/10',
          button: 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
        };
      default:
        return {
          icon: 'text-primary-500 bg-primary-500/10',
          button: 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20'
        };
    }
  };

  const colors = getVariantColors();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`relative w-full max-w-md transform overflow-hidden rounded-2xl border p-6 text-left align-middle shadow-2xl transition-all ${
          theme === 'dark' 
            ? 'bg-navy-900 border-navy-700' 
            : 'bg-white border-gray-200'
        } animate-scale-in`}
      >
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 p-3 rounded-full ${colors.icon}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold leading-6 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {title}
            </h3>
            <div className="mt-2">
              <p className={`text-sm ${
                theme === 'dark' ? 'text-navy-300' : 'text-gray-500'
              }`}>
                {message}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'text-navy-400 hover:bg-navy-800 hover:text-white' 
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className={`inline-flex justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-navy-800 text-white hover:bg-navy-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
            }`}
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`inline-flex justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${colors.button}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
