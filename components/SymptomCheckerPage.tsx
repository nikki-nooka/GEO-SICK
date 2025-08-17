

import React, { useState } from 'react';
import { ArrowLeftIcon, StethoscopeIcon, SendIcon, HazardIcon } from './icons';
import { analyzeSymptoms } from '../services/geminiService';
import { addHistoryEvent } from '../services/historyService';
import type { SymptomAnalysisResult, User } from '../types';
import { SymptomAnalysisReport } from './SymptomAnalysisReport';
import { SymptomReportSkeleton } from './SymptomReportSkeleton';

interface SymptomCheckerPageProps {
  user: User;
  onBack: () => void;
}

export const SymptomCheckerPage: React.FC<SymptomCheckerPageProps> = ({ user, onBack }) => {
    const [symptoms, setSymptoms] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [result, setResult] = useState<SymptomAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (symptoms.trim().length < 10) {
            setError("Please provide a more detailed description of your symptoms (at least 10 characters).");
            return;
        }
        
        setStatus('loading');
        setError(null);
        setResult(null);

        try {
            const analysisResult = await analyzeSymptoms(symptoms);
            setResult(analysisResult);
            addHistoryEvent(user.nickname, 'symptom_check', { result: analysisResult, symptoms });
            setStatus('success');
        } catch (err) {
            console.error(err);
            setError('Failed to get your symptom analysis. The AI model may be busy or the request was blocked. Please try again.');
            setStatus('error');
        }
    };

    return (
         <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col items-center animate-fade-in bg-slate-50">
            <div className="w-full flex justify-between items-center max-w-5xl mx-auto">
                 <div className="flex items-center gap-3">
                    <StethoscopeIcon className="w-10 h-10 text-teal-500" />
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
                            AI Symptom Checker
                        </h1>
                    </div>
                </div>
                <button 
                    onClick={onBack}
                    className="bg-white/80 backdrop-blur-md text-slate-700 font-semibold py-2 px-4 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:bg-white"
                    aria-label="Back to Welcome Page"
                >
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back
                </button>
            </div>
            
            <main className="w-full max-w-3xl mx-auto mt-8">
                 <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 mb-6 rounded-r-lg" role="alert">
                    <div className="flex items-center">
                        <HazardIcon className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0"/>
                        <div>
                            <p className="font-bold">For Informational Purposes Only</p>
                            <p className="text-sm">This is not a medical diagnosis. Always consult a healthcare professional for advice.</p>
                        </div>
                    </div>
                </div>

                {status !== 'success' && (
                     <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200/80">
                        <label htmlFor="symptoms" className="block text-lg font-semibold text-slate-700">
                            Describe your symptoms
                        </label>
                        <p className="text-sm text-slate-500 mt-1 mb-4">Be as detailed as possible. Include when they started and how you feel.</p>
                        <textarea
                            id="symptoms"
                            rows={6}
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                            placeholder="e.g., 'I have a sore throat, headache, and have been feeling tired for 3 days...'"
                            disabled={status === 'loading'}
                        />
                         {error && status === 'idle' && <p className="text-sm text-red-600 mt-2">{error}</p>}
                        <button
                            type="submit"
                            disabled={status === 'loading' || symptoms.trim().length < 10}
                            className="w-full mt-4 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl"
                        >
                            <SendIcon className="w-5 h-5 mr-2" />
                            {status === 'loading' ? 'Analyzing...' : 'Analyze My Symptoms'}
                        </button>
                    </form>
                )}
                
                <div className="mt-8">
                     {status === 'loading' && <SymptomReportSkeleton />}
                     {status === 'error' && !result && (
                         <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md" role="alert">
                            <p className="font-bold">Analysis Error</p>
                            <p>{error}</p>
                        </div>
                     )}
                     {status === 'success' && result && (
                         <div>
                            <SymptomAnalysisReport result={result} />
                             <button
                                onClick={() => { setStatus('idle'); setSymptoms(''); setResult(null); }}
                                className="w-full mt-6 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-200"
                            >
                                <StethoscopeIcon className="w-5 h-5 mr-2" />
                                Start a New Analysis
                            </button>
                         </div>
                     )}
                </div>

            </main>
         </div>
    );
};
