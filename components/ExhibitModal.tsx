
import React from 'react';
import { XIcon } from './icons/XIcon';
import { ImageIcon } from './icons/ImageIcon';

interface ExhibitModalProps {
  isOpen: boolean;
  pageData?: string;
  onClose: () => void;
}

export const ExhibitModal: React.FC<ExhibitModalProps> = ({ isOpen, pageData, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in p-4" 
        aria-modal="true" 
        role="dialog"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
                <ImageIcon className="w-6 h-6 text-sky-600"/>
                <h2 className="text-xl font-bold text-slate-800">Exhibit</h2>
            </div>
            <button 
                onClick={onClose} 
                className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                aria-label="Close exhibit"
            >
                <XIcon className="w-6 h-6 text-slate-600"/>
            </button>
        </header>
        <main className="flex-grow p-4 bg-slate-50">
            {pageData ? (
                <embed
                    src={pageData}
                    type="application/pdf"
                    className="w-full h-full border rounded-lg"
                    aria-label="PDF Exhibit"
                />
            ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                    <p>No exhibit available for this question.</p>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};