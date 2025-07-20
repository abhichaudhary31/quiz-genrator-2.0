
import React, { useState, useCallback, useEffect } from 'react';
import { type PDFDocument } from 'pdf-lib';
import { FileUpload } from './components/FileUpload';
import { Quiz } from './components/Quiz';
import { QuizResult } from './components/QuizResult';
import { Loader } from './components/Loader';
import { generateQuizFromText } from './services/geminiService';
import { type QuizQuestion, type IncorrectQuizQuestion, type QuizMode } from './types';
import { QuizIcon } from './components/icons/QuizIcon';

enum AppState {
  IDLE,
  LOADING,
  QUIZ,
  RESULTS,
}

const CHUNK_SIZE = 3; // Process 3 pages at a time

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [allQuestions, setAllQuestions] = useState<QuizQuestion[]>([]);
  const [incorrectQuestions, setIncorrectQuestions] = useState<IncorrectQuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [currentMode, setCurrentMode] = useState<QuizMode>('quiz');
  
  // PDF Processing State
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [processingPageIndex, setProcessingPageIndex] = useState(0); // Tracks the next page to be processed
  const [pageRange, setPageRange] = useState<{start: number, end: number} | null>(null);
  const [processingMessage, setProcessingMessage] = useState('');
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [flaggedQuestionIndices, setFlaggedQuestionIndices] = useState<number[]>([]);
  const [isPreloading, setIsPreloading] = useState(false);

  // Regeneration State
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [lastChunkInfo, setLastChunkInfo] = useState<{ startPage: number, endPage: number, questionStartIndex: number } | null>(null);

  // Navigation State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const processPagesToQuestions = useCallback(async (pageIndices: number[]): Promise<QuizQuestion[]> => {
      if (!pdfDoc) throw new Error("PDF Document is not loaded.");
      if (pageIndices.length === 0) return [];

      const { PDFDocument } = await import('pdf-lib');
      
      const subDocForGemini = await PDFDocument.create();
      const copiedPagesForGemini = await subDocForGemini.copyPages(pdfDoc, pageIndices);
      copiedPagesForGemini.forEach(page => subDocForGemini.addPage(page));
      const base64ChunkPdf = await subDocForGemini.saveAsBase64();
      
      const pageDataPromises = pageIndices.map(async (globalIndex) => {
          const singlePageDoc = await PDFDocument.create();
          const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [globalIndex]);
          singlePageDoc.addPage(copiedPage);
          return singlePageDoc.saveAsBase64({ dataUri: true });
      });
      const pageDataUris = await Promise.all(pageDataPromises);

      const generatedQuiz = await generateQuizFromText(base64ChunkPdf, 'application/pdf');

      return generatedQuiz.map(q => {
          if (q.hasImage && q.pageIndex !== undefined && q.pageIndex < pageDataUris.length) {
              return { ...q, pageData: pageDataUris[q.pageIndex] };
          }
          return q;
      });
  }, [pdfDoc]);


  const processNextChunk = useCallback(async () => {
    if (!pdfDoc || isProcessingComplete || isPreloading || !pageRange) return;

    if (processingPageIndex >= pageRange.end) {
      setIsProcessingComplete(true);
      if (allQuestions.length === 0 && appState === AppState.LOADING) {
        setError("No scorable questions could be extracted from the selected pages. Please try a different range or file.");
        setAppState(AppState.IDLE);
      }
      return;
    }

    setIsPreloading(true);
    
    const pagesInChunk = Math.min(CHUNK_SIZE, pageRange.end - processingPageIndex);
    const startPageForChunk = processingPageIndex + 1;
    const endPageForChunk = processingPageIndex + pagesInChunk;

    if (appState === AppState.LOADING) {
       setProcessingMessage(`Processing pages ${startPageForChunk}–${endPageForChunk}...`);
    }

    try {
      const pageIndices = Array.from({ length: pagesInChunk }, (_, i) => processingPageIndex + i);
      const newQuestions = await processPagesToQuestions(pageIndices);

      if (newQuestions.length > 0) {
        setLastChunkInfo({
            startPage: startPageForChunk,
            endPage: endPageForChunk,
            questionStartIndex: allQuestions.length,
        });
        setAllQuestions(prev => [...prev, ...newQuestions]);
        
        if (appState !== AppState.QUIZ) {
          setAppState(AppState.QUIZ);
        }
      }
      
      setProcessingPageIndex(prev => prev + pagesInChunk);

    } catch (e: any) {
      console.error(e);
      setError(`An error occurred while processing: ${e.message}`);
      setAppState(AppState.IDLE);
    } finally {
        setIsPreloading(false);
    }
  }, [pdfDoc, processingPageIndex, isProcessingComplete, isPreloading, appState, allQuestions.length, pageRange, processPagesToQuestions]);

  const handleRegenerateLastChunk = useCallback(async () => {
    if (!lastChunkInfo || isRegenerating || isPreloading) return;

    setIsRegenerating(true);

    try {
      const pageIndices = Array.from({ length: lastChunkInfo.endPage - lastChunkInfo.startPage + 1 }, (_, i) => (lastChunkInfo.startPage - 1) + i);
      const newQuestions = await processPagesToQuestions(pageIndices);
      
      setAllQuestions(prev => {
        const questionsBefore = prev.slice(0, lastChunkInfo.questionStartIndex);
        return [...questionsBefore, ...newQuestions];
      });

      setCurrentQuestionIndex(lastChunkInfo.questionStartIndex);
      setProcessingPageIndex(lastChunkInfo.endPage);
      setIsProcessingComplete(lastChunkInfo.endPage >= (pageRange?.end || 0));

    } catch (e: any) {
      console.error("Regeneration failed:", e);
      setError(`Failed to regenerate questions: ${e.message}`);
    } finally {
      setIsRegenerating(false);
    }
  }, [processPagesToQuestions, lastChunkInfo, isRegenerating, isPreloading, pageRange]);

  useEffect(() => {
    if (appState === AppState.LOADING && pdfDoc && pageRange && processingPageIndex === pageRange.start - 1) {
        processNextChunk();
    }
  }, [appState, pdfDoc, processingPageIndex, processNextChunk, pageRange]);


  const handleFileProcess = useCallback(async (file: File, mode: QuizMode, startPage: number, endPage: number) => {
    handleRetry();
    setAppState(AppState.LOADING);
    setProcessingMessage("Loading PDF...");
    setCurrentMode(mode);
    setPageRange({ start: startPage, end: endPage });

    try {
      const { PDFDocument } = await import('pdf-lib');
      const fileReader = new FileReader();

      fileReader.onload = async (event) => {
        if (!event.target?.result) {
          setError('Failed to read the PDF file.');
          setAppState(AppState.IDLE);
          return;
        }
        try {
          const typedArray = new Uint8Array(event.target.result as ArrayBuffer);
          const doc = await PDFDocument.load(typedArray);
          
          setPdfDoc(doc);
          setPdfPageCount(doc.getPageCount());
          setProcessingPageIndex(startPage - 1); 
        } catch (e: any) {
           setError(`Could not load the PDF. It might be corrupted or protected. Error: ${e.message}`);
           setAppState(AppState.IDLE);
        }
      };
      
      fileReader.onerror = () => {
        setError('Error reading the PDF file.');
        setAppState(AppState.IDLE);
      };

      fileReader.readAsArrayBuffer(file);

    } catch (e: any) {
      console.error(e);
      setError(`An error occurred: ${e.message}`);
      setAppState(AppState.IDLE);
    }
  }, []);
  
  const handleQuizComplete = useCallback((score: number, incorrect: IncorrectQuizQuestion[]) => {
    setFinalScore(score);
    setIncorrectQuestions(incorrect);
    setAppState(AppState.RESULTS);
  }, []);
  
  const handleFlagQuestion = useCallback((questionIndex: number) => {
    setFlaggedQuestionIndices(prev => 
      prev.includes(questionIndex) 
        ? prev.filter(i => i !== questionIndex) 
        : [...prev, questionIndex]
    );
  }, []);

  const handleRequiz = useCallback(() => {
    if (incorrectQuestions.length > 0) {
      const questionsToRequiz = incorrectQuestions.map(({userAnswers, ...rest}) => rest);
      setAllQuestions(questionsToRequiz);
      setIncorrectQuestions([]);
      setFinalScore(0);
      setError(null);
      setFlaggedQuestionIndices([]);
      setCurrentQuestionIndex(0);
      setIsProcessingComplete(true);
      setAppState(AppState.QUIZ);
    }
  }, [incorrectQuestions]);

  const handleRetry = useCallback(() => {
    setAppState(AppState.IDLE);
    setAllQuestions([]);
    setIncorrectQuestions([]);
    setFlaggedQuestionIndices([]);
    setCurrentQuestionIndex(0);
    setFinalScore(0);
    setError(null);
    setPdfDoc(null);
    setPdfPageCount(0);
    setProcessingPageIndex(0);
    setPageRange(null);
    setIsProcessingComplete(false);
    setProcessingMessage('');
    setIsPreloading(false);
    setIsRegenerating(false);
    setLastChunkInfo(null);
  }, []);

  const renderContent = () => {
    const canRegenerate = !isRegenerating && !isPreloading && lastChunkInfo !== null && currentQuestionIndex >= lastChunkInfo.questionStartIndex;
    
    switch (appState) {
      case AppState.LOADING:
        return <Loader message={processingMessage} />;
      case AppState.QUIZ:
        return <Quiz 
                  questions={allQuestions} 
                  onComplete={handleQuizComplete} 
                  mode={currentMode} 
                  isProcessingComplete={isProcessingComplete}
                  onFlagQuestion={handleFlagQuestion}
                  flaggedIndices={flaggedQuestionIndices}
                  onPreloadRequired={processNextChunk}
                  currentQuestionIndex={currentQuestionIndex}
                  onNavigate={setCurrentQuestionIndex}
                  onRegenerate={handleRegenerateLastChunk}
                  isRegenerating={isRegenerating}
                  canRegenerate={canRegenerate}
               />;
      case AppState.RESULTS:
        const scorableQuestionsCount = allQuestions.filter(q => q.answer.length > 0).length;
        const flaggedQuestions = allQuestions.filter((_, index) => flaggedQuestionIndices.includes(index));
        return (
          <QuizResult 
            score={finalScore} 
            totalQuestions={allQuestions.length}
            scorableQuestionsCount={scorableQuestionsCount}
            incorrectQuestions={incorrectQuestions}
            flaggedQuestions={flaggedQuestions}
            onRetry={handleRetry}
            onRequiz={handleRequiz}
          />
        );
      case AppState.IDLE:
      default:
        return <FileUpload onProcess={handleFileProcess} error={error} />;
    }
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col items-center justify-center p-4 transition-colors duration-500 relative">
      <div className="w-full max-w-4xl mx-auto z-10">
        <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-3">
              <QuizIcon className="w-10 h-10 text-blue-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-slate-800 [text-shadow:0_1px_2px_rgb(0_0_0_/_0.1)]">
                CCNP Quiz Taker 😊
              </h1>
            </div>
        </header>
        <main className="bg-white rounded-2xl shadow-2xl shadow-sky-200/50">
          {renderContent()}
        </main>
        <footer className="text-center mt-8 text-sm text-slate-600">
          <p>Made by Ladoo 😁 for Paddu ❤️</p>
        </footer>
      </div>
    </div>
  );
}
