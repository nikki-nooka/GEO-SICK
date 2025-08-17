

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeftIcon, BrainCircuitIcon, SendIcon } from './icons';
import { analyzeMentalHealth } from '../services/geminiService';
import { addHistoryEvent } from '../services/historyService';
import type { MentalHealthResult, User } from '../types';
import { MentalHealthReport } from './MentalHealthReport';
import { LoadingSpinner } from './LoadingSpinner';

interface MentalHealthPageProps {
  user: User;
  onBack: () => void;
}

// Expanded question bank for variety
const QUESTION_BANK = [
    { id: 'q1', text: 'Over the last two weeks, how often have you felt little interest or pleasure in doing things?' },
    { id: 'q2', text: 'How often have you been feeling down, depressed, or hopeless recently?' },
    { id: 'q3', text: 'Have you had trouble falling or staying asleep, or been sleeping too much?' },
    { id: 'q4', text: 'In the past two weeks, how often have you felt tired or had little energy?' },
    { id: 'q5', text: 'How often have you felt nervous, anxious, or on edge lately?' },
    { id: 'q6', text: 'Have you been unable to stop or control worrying?' },
    { id: 'q7', text: 'How often have you felt confident and capable in your daily life?' },
    { id: 'q8', text: 'Have you felt particularly irritable or easily annoyed in the past two weeks?' },
    { id: 'q9', text: 'How connected have you felt to other people recently?' },
    { id: 'q10', text: 'Have you been able to relax and unwind when you have the chance?' },
    { id: 'q11', text: 'How has your appetite been over the last two weeks? (e.g., poor appetite or overeating)' },
    { id: 'q12', text: 'How often have you felt that things were piling up so high that you could not overcome them?' },
];

const options = [
    'Not at all',
    'Several days',
    'More than half the days',
    'Nearly every day'
];

const NUM_QUESTIONS_TO_ASK = 6;

type Answers = Record<string, string>;
type Status = 'intro' | 'answering' | 'submitting' | 'loading' | 'success' | 'error';

const LoadingMessages = [
    "Reflecting on your responses...",
    "Gathering some helpful thoughts...",
    "Analyzing patterns with care...",
    "Just a moment more...",
];

export const MentalHealthPage: React.FC<MentalHealthPageProps> = ({ user, onBack }) => {
    const [answers, setAnswers] = useState<Answers>({});
    const [status, setStatus] = useState<Status>('intro');
    const [result, setResult] = useState<MentalHealthResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState(LoadingMessages[0]);
    
    // Randomize questions on mount
    const questions = useMemo(() => {
        return [...QUESTION_BANK].sort(() => 0.5 - Math.random()).slice(0, NUM_QUESTIONS_TO_ASK);
    }, []);
    
    useEffect(() => {
        if (status === 'loading') {
            const interval = setInterval(() => {
                setCurrentLoadingMessage(prev => {
                    const currentIndex = LoadingMessages.indexOf(prev);
                    return LoadingMessages[(currentIndex + 1) % LoadingMessages.length];
                });
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [status]);


    const handleAnswerSelect = (questionId: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
        
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setStatus('submitting');
        }
    };

    const handleSubmit = async () => {
        setStatus('loading');
        setError(null);
        setResult(null);

        const fullQuestionsAnswers: Record<string, string> = {};
        questions.forEach(q => {
            if (answers[q.id]) {
                fullQuestionsAnswers[q.text] = answers[q.id];
            }
        });

        try {
            const analysisResult = await analyzeMentalHealth(fullQuestionsAnswers);
            setResult(analysisResult);
            addHistoryEvent(user.nickname, 'mental_health_check', { result: analysisResult });
            setStatus('success');
        } catch (err) {
            console.error(err);
            setError('Failed to get your wellness analysis. The AI model may be busy. Please try again.');
            setStatus('error');
        }
    };

    const progress = status === 'answering' || status === 'submitting' 
        ? ((currentQuestionIndex + 1) / questions.length) * 100
        : 0;
        
    const currentQuestion = questions[currentQuestionIndex];
    
    const renderContent = () => {
        switch (status) {
            case 'intro':
                return (
                    <div className="text-center bg-white p-8 sm:p-12 rounded-lg shadow-lg animate-fade-in-up">
                        <BrainCircuitIcon className="w-16 h-16 mx-auto text-indigo-500 mb-4" />
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">A Moment for You</h2>
                        <p className="mt-3 text-slate-600 max-w-prose mx-auto">
                            Let's take a brief, confidential moment to check in with your well-being. Answer a few questions to receive a gentle, AI-powered reflection.
                        </p>
                        <button
                            onClick={() => setStatus('answering')}
                            className="mt-8 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            Begin Check-in
                        </button>
                    </div>
                );
            case 'answering':
            case 'submitting':
                return (
                     <div className="bg-white w-full p-6 sm:p-8 rounded-lg shadow-lg animate-fade-in relative overflow-hidden">
                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 h-1.5 bg-indigo-200 w-full">
                            <div 
                                className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        <div className="text-center mt-4">
                            <p className="text-sm font-semibold text-indigo-500">QUESTION {currentQuestionIndex + 1} OF {questions.length}</p>
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mt-2 min-h-[6rem] flex items-center justify-center">
                                {currentQuestion.text}
                            </h3>
                        </div>
                        
                        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {options.map(opt => (
                                <button 
                                    key={opt} 
                                    onClick={() => handleAnswerSelect(currentQuestion.id, opt)}
                                    className="text-left font-medium p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 bg-slate-50 border-slate-200"
                                >
                                    {opt}
                                </button>
                             ))}
                        </div>
                        
                        {status === 'submitting' && (
                            <div className="mt-8 pt-6 border-t border-slate-200 text-center animate-fade-in">
                                <h3 className="text-xl font-bold text-slate-800">Check-in Complete!</h3>
                                <p className="text-slate-600 mt-2">You're all set. Ready to see your wellness reflection?</p>
                                <button
                                    onClick={handleSubmit}
                                    className="w-full sm:w-auto mt-6 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-8 rounded-full flex items-center justify-center transition-all duration-200 mx-auto"
                                >
                                    <SendIcon className="w-5 h-5 mr-2" />
                                    Get My Reflection
                                </button>
                            </div>
                        )}
                    </div>
                );
            case 'loading':
                return (
                    <div className="text-center bg-white p-8 sm:p-12 rounded-lg shadow-lg animate-fade-in-up">
                        <LoadingSpinner />
                        <p className="mt-4 font-semibold text-slate-700 animate-fade-in">{currentLoadingMessage}</p>
                    </div>
                );
            case 'success':
                 return result ? <MentalHealthReport result={result} /> : null;
            case 'error':
                 return (
                     <div className="mt-6 bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md" role="alert">
                        <p className="font-bold">Analysis Error</p>
                        <p>{error}</p>
                        <button onClick={() => { setStatus('intro'); setCurrentQuestionIndex(0); setAnswers({}); }} className="mt-3 font-semibold hover:underline">Start Over</button>
                    </div>
                 );
            default:
                return null;
        }
    }


    return (
        <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col items-center animate-fade-in bg-indigo-50">
             <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>

            <div className="w-full flex justify-between items-center max-w-4xl mx-auto relative z-10">
                 <div className="flex items-center gap-3">
                    <BrainCircuitIcon className="w-8 h-8 text-indigo-500" />
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight hidden sm:block">
                        Mental Wellness Check-in
                    </h1>
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
            
            <main className="w-full max-w-2xl mx-auto mt-8 flex-grow flex items-center justify-center">
               {renderContent()}
            </main>
        </div>
    );
};
