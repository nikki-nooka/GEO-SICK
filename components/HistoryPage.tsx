
import React, { useState, useEffect, useMemo } from 'react';
import { getHistory, clearHistory, getAllUsersHistory, clearAllHistory, AdminHistoryEvent } from '../services/historyService';
import type { User, HistoryEvent, HistoryEventType } from '../types';
import { 
    ArrowLeftIcon, HistoryIcon, LoginIcon, ScanIcon, GlobeIcon, ClipboardListIcon, 
    StethoscopeIcon, BrainCircuitIcon, CloseIcon, HazardIcon, UserIcon 
} from './icons';
import { LoadingSpinner } from './LoadingSpinner';
import { AnalysisReport } from './AnalysisReport';
import { LocationReport } from './LocationReport';
import { PrescriptionReport } from './PrescriptionReport';
import { SymptomAnalysisReport } from './SymptomAnalysisReport';
import { MentalHealthReport } from './MentalHealthReport';

interface HistoryPageProps {
  user: User;
  onBack: () => void;
}

const getEventUIData = (type: HistoryEventType) => {
    switch (type) {
        case 'login': return { Icon: UserIcon, title: 'Logged In', color: 'text-slate-500' };
        case 'image_analysis': return { Icon: ScanIcon, title: 'Image Analysis', color: 'text-blue-500' };
        case 'location_analysis': return { Icon: GlobeIcon, title: 'Location Analysis', color: 'text-emerald-500' };
        case 'prescription_analysis': return { Icon: ClipboardListIcon, title: 'Prescription Scan', color: 'text-green-500' };
        case 'symptom_check': return { Icon: StethoscopeIcon, title: 'Symptom Check', color: 'text-teal-500' };
        case 'mental_health_check': return { Icon: BrainCircuitIcon, title: 'Mental Wellness Check', color: 'text-indigo-500' };
        default: return { Icon: HistoryIcon, title: 'Activity', color: 'text-gray-500' };
    }
};

const EventDetailsModal: React.FC<{ event: HistoryEvent, onClose: () => void }> = ({ event, onClose }) => {
    const { title, Icon, color } = getEventUIData(event.type);

    const renderDetails = () => {
        switch (event.type) {
            case 'image_analysis':
                return <AnalysisReport result={event.payload.result} imageUrl={null} />;
            case 'location_analysis':
                return <LocationReport result={event.payload.result} imageUrl={null} coords={event.payload.coords} />;
            case 'prescription_analysis':
                return <PrescriptionReport result={event.payload.result} imageUrl={""} />;
            case 'symptom_check':
                return <SymptomAnalysisReport result={event.payload.result} />;
            case 'mental_health_check':
                return <MentalHealthReport result={event.payload.result} />;
            default:
                return <p className="text-slate-600">No further details for this event type.</p>;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">
                <header className="flex justify-between items-center p-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${color}`} />
                        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200" aria-label="Close details">
                        <CloseIcon className="w-6 h-6 text-slate-500" />
                    </button>
                </header>
                <div className="p-6 overflow-y-auto">
                    {renderDetails()}
                </div>
            </div>
        </div>
    );
};


export const HistoryPage: React.FC<HistoryPageProps> = ({ user, onBack }) => {
    const [history, setHistory] = useState<(HistoryEvent | AdminHistoryEvent)[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);

    useEffect(() => {
        if (user.isAdmin) {
            setHistory(getAllUsersHistory());
        } else {
            setHistory(getHistory(user.nickname));
        }
        setLoading(false);
    }, [user.nickname, user.isAdmin]);

    const handleClearMyHistory = () => {
        if (window.confirm('Are you sure you want to delete your own activity history?')) {
            clearHistory(user.nickname);
            if (user.isAdmin) {
                // Refetch all history to show the change
                setHistory(getAllUsersHistory());
            } else {
                setHistory([]);
            }
        }
    };

    const handleClearAllHistory = () => {
        if (window.confirm('DANGER: Are you sure you want to permanently delete the activity history for ALL users? This action cannot be undone.')) {
            clearAllHistory();
            setHistory([]);
        }
    };

    const EventItem: React.FC<{ event: HistoryEvent | AdminHistoryEvent }> = ({ event }) => {
        const { Icon, title, color } = getEventUIData(event.type);
        const isActionable = event.type !== 'login';
        
        let summaryText = `Activity recorded on ${new Date(event.timestamp).toLocaleDateString()}`;
        if (event.type === 'location_analysis') {
            summaryText = event.payload.result.locationName;
        } else if (event.type === 'symptom_check') {
             summaryText = `Symptoms checked: "${event.payload.symptoms.substring(0, 50)}..."`;
        }
        
        const isAdminView = 'userNickname' in event;

        return (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 ${color}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="font-semibold text-slate-800 truncate">{title}</p>
                        <div className="flex items-center gap-2">
                             {isAdminView && (
                                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                                    <UserIcon className="w-3 h-3"/>
                                    <span>{(event as AdminHistoryEvent).userNickname}</span>
                                </div>
                            )}
                            <p className="text-sm text-slate-500 truncate">{summaryText}</p>
                        </div>
                    </div>
                </div>
                {isActionable && (
                    <button onClick={() => setSelectedEvent(event)} className="font-semibold text-sm text-blue-500 hover:underline flex-shrink-0">
                        View Details
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col items-center animate-fade-in bg-slate-50">
            {selectedEvent && <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
            
            <header className="w-full max-w-4xl mx-auto flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <HistoryIcon className="w-10 h-10 text-slate-500" />
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
                            {user.isAdmin ? 'Admin - All User Activity' : 'Activity History'}
                        </h1>
                        <p className="text-slate-500">
                             {user.isAdmin ? 'A log of all user interactions.' : 'A log of your scans and interactions.'}
                        </p>
                    </div>
                </div>
                <button 
                    onClick={onBack}
                    className="bg-white/80 backdrop-blur-md text-slate-700 font-semibold py-2 px-4 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl hover:bg-white"
                >
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back
                </button>
            </header>

            <main className="w-full max-w-2xl mx-auto">
                {loading ? (
                    <div className="flex justify-center mt-8"><LoadingSpinner /></div>
                ) : history.length === 0 ? (
                    <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-slate-200/80">
                        <h2 className="text-xl font-bold text-slate-700">No History Yet</h2>
                        <p className="text-slate-500 mt-2">
                            {user.isAdmin ? "No users have performed any actions yet." : "Your activities will be logged here as you use the app."}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-end mb-4 gap-4">
                             <button onClick={handleClearMyHistory} className="text-sm font-semibold text-slate-500 hover:text-slate-700 hover:underline">
                                Clear My History
                            </button>
                            {user.isAdmin && (
                                <button onClick={handleClearAllHistory} className="text-sm font-semibold text-red-500 hover:text-red-700 hover:underline">
                                    Clear All User History
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            {history.map(event => <EventItem key={`${event.id}-${(event as AdminHistoryEvent).userNickname || ''}`} event={event} />)}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};