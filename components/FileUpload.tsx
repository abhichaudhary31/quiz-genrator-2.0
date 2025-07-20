import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { FocusIcon } from './icons/FocusIcon';
import { type QuizMode } from '../types';

interface FileUploadProps {
  onProcess: (file: File, mode: QuizMode, startPage: number, endPage: number) => void;
  error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onProcess, error }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [totalPages, setTotalPages] = useState(0);
  const [startPage, setStartPage] = useState('1');
  const [endPage, setEndPage] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);
  const [isReadingPdf, setIsReadingPdf] = useState(false);

  const handleResetFile = () => {
      setFile(null);
      setTotalPages(0);
      setStartPage('1');
      setEndPage('');
      setPageError(null);
      setIsReadingPdf(false);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  const processSelectedFile = async (selectedFile: File | null | undefined) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
        alert("Please upload a PDF file.");
        return;
    }
    
    setIsReadingPdf(true);
    setFile(selectedFile);
    setPageError(null);

    try {
        const { PDFDocument } = await import('pdf-lib');
        const fileBytes = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(fileBytes);
        const pages = pdfDoc.getPageCount();
        setTotalPages(pages);
        setStartPage('1');
        setEndPage(String(pages));
    } catch (e) {
        console.error("Failed to read PDF info", e);
        setPageError("Could not read PDF information. The file might be corrupted.");
        handleResetFile();
    } finally {
        setIsReadingPdf(false);
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processSelectedFile(e.target.files?.[0]);
  };

  const handleDragEvents = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    if (!file) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if(fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
      }
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (mode: QuizMode) => {
    if (!file) return;

    const start = parseInt(startPage, 10);
    const end = parseInt(endPage, 10);

    if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
        setPageError("Please enter a valid page range (e.g., Start: 1, End: 10).");
        return;
    }
    setPageError(null);
    onProcess(file, mode, start, end);
  };

  const renderInitialState = () => (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
      {/* Left Panel: PDF Document */}
      <div 
        className={`w-full md:w-1/2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-300 relative overflow-hidden bg-yellow-100/50 ${isDragging ? 'border-blue-500 bg-blue-100/50' : 'border-yellow-400 hover:border-blue-400'}`}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragEvents}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="application/pdf"
          onChange={handleFileChange}
        />
        <h3 className="text-lg font-semibold text-yellow-800 mb-4">PDF Document</h3>
        <div className="space-y-2">
          <div className="text-line w-full bg-yellow-300/80"></div>
          <div className="text-line w-5/6 bg-yellow-300/80"></div>
          <div className="text-line w-full bg-yellow-300/80"></div>
          <div className="text-line w-3/4 bg-yellow-300/80"></div>
          <div className="text-line w-4/6 bg-yellow-300/80"></div>
        </div>
        <div className="absolute inset-0 bg-yellow-50/80 flex flex-col items-center justify-center text-yellow-700 opacity-0 hover:opacity-100 transition-opacity duration-300">
           <UploadIcon className="w-10 h-10 mb-2" />
           <span className="font-semibold">Click or Drag PDF</span>
        </div>
      </div>

      {/* Arrow */}
      <div className="hidden md:block text-slate-400">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
        </svg>
      </div>
       <div className="block md:hidden text-slate-400">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.25V3m0 14.25L8.25 13.5M12 17.25l3.75-3.75" />
        </svg>
      </div>

      {/* Right Panel: Placeholder */}
      <div className="w-full md:w-1/2 text-center p-6 bg-green-400 rounded-lg shadow-2xl shadow-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Interactive Quiz</h3>
        <p className="text-sm text-green-800">Upload a PDF to get started...</p>
      </div>
    </div>
  );
  
  const renderFileSelectedState = () => (
      <div className="text-center animate-fade-in">
        <p className="text-lg font-semibold text-slate-700 mb-2">
            File: <span className="font-bold text-blue-600">{file?.name}</span>
        </p>
        
        {isReadingPdf ? (
            <div className="flex items-center justify-center gap-2 text-slate-500 my-4">
                <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-blue-500"></div>
                <span>Reading PDF info...</span>
            </div>
        ) : totalPages > 0 && (
            <div className="my-6 animate-fade-in-down">
                <p className="text-slate-600 mb-4">
                    This document has <span className="font-semibold text-slate-400">{totalPages}</span> pages.
                    <br/>
                    Specify a range to generate the quiz from.
                </p>
                <div className="flex justify-center items-center gap-4">
                    <div>
                        <label htmlFor="start-page" className="block text-sm font-medium text-slate-700">Start Page</label>
                        <input
                            type="number"
                            id="start-page"
                            value={startPage}
                            onChange={(e) => setStartPage(e.target.value)}
                            className="mt-1 block w-24 text-center rounded-md border-slate-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-700 text-white"
                            min="1"
                            max={totalPages}
                        />
                    </div>
                    <span className="text-slate-500 mt-6">—</span>
                     <div>
                        <label htmlFor="end-page" className="block text-sm font-medium text-slate-700">End Page</label>
                        <input
                            type="number"
                            id="end-page"
                            value={endPage}
                            onChange={(e) => setEndPage(e.target.value)}
                            className="mt-1 block w-24 text-center rounded-md border-slate-500 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-slate-700 text-white"
                            min="1"
                            max={totalPages}
                        />
                    </div>
                </div>
                {pageError && <p className="mt-2 text-red-500 text-sm animate-shake">{pageError}</p>}
            </div>
        )}

        <button onClick={handleResetFile} className="text-sm text-red-500 hover:underline mb-6">
            Choose a different file
        </button>

        <div className="mt-4 flex flex-col md:flex-row gap-4 justify-center items-center flex-wrap">
             <button
                onClick={() => handleSubmit('quiz')}
                disabled={isReadingPdf || totalPages === 0}
                className="w-full max-w-xs inline-flex gap-2 justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                <MagicWandIcon className="w-5 h-5" />
                Start Quiz Mode
              </button>
              
               <button
                onClick={() => handleSubmit('learn')}
                disabled={isReadingPdf || totalPages === 0}
                className="w-full max-w-xs inline-flex gap-2 justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                <BookOpenIcon className="w-5 h-5" />
                Start Learn Mode
              </button>
              
              <button
                onClick={() => handleSubmit('focus')}
                disabled={isReadingPdf || totalPages === 0}
                className="w-full max-w-xs inline-flex gap-2 justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                <FocusIcon className="w-5 h-5" />
                Start Focus Mode
              </button>
        </div>
      </div>
  );

  return (
    <div className="p-6 md:p-8">
      {!file ? renderInitialState() : renderFileSelectedState()}
      {error && <p className="mt-6 text-center text-red-500 animate-fade-in">{error}</p>}
    </div>
  );
};