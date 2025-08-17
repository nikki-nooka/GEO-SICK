
import type { User, HistoryEvent, HistoryEventType } from '../types';

export type AdminHistoryEvent = HistoryEvent & { userNickname: string };

const getHistoryKey = (nickname: string) => `geosick_history_${nickname}`;
const ALL_USERS_KEY = 'geosick_all_users';

export const getHistory = (nickname: string): HistoryEvent[] => {
    if (!nickname) return [];
    try {
        const storedHistory = localStorage.getItem(getHistoryKey(nickname));
        return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (error) {
        console.error("Failed to parse history from localStorage", error);
        localStorage.removeItem(getHistoryKey(nickname)); // Clear corrupted data
        return [];
    }
};

export const getAllUsersHistory = (): AdminHistoryEvent[] => {
    let allHistory: AdminHistoryEvent[] = [];
    try {
        const allUsersJSON = localStorage.getItem(ALL_USERS_KEY);
        const allUsers: string[] = allUsersJSON ? JSON.parse(allUsersJSON) : [];
        
        for (const nickname of allUsers) {
            const userHistory = getHistory(nickname);
            const augmentedHistory = userHistory.map(event => ({
                ...event,
                userNickname: nickname,
            }));
            allHistory.push(...augmentedHistory);
        }

        // Sort all events by timestamp, newest first
        allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
        console.error("Failed to get all users' history", error);
    }
    return allHistory;
};

export const addHistoryEvent = <T extends HistoryEventType>(
    nickname: string,
    type: T,
    payload: Extract<HistoryEvent, { type: T }>['payload']
): void => {
    if (!nickname) return;

    const newEvent = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        type,
        payload,
    };

    const currentHistory = getHistory(nickname);
    // Prepend the new event to keep the list sorted by most recent
    const updatedHistory = [newEvent as HistoryEvent, ...currentHistory];

    // Limit history size to prevent localStorage from exceeding its quota
    if (updatedHistory.length > 50) {
        updatedHistory.pop();
    }

    try {
        localStorage.setItem(getHistoryKey(nickname), JSON.stringify(updatedHistory));
    } catch (error) {
        console.error("Failed to save history to localStorage", error);
    }
};

export const clearHistory = (nickname: string): void => {
    if (!nickname) return;
    try {
        localStorage.removeItem(getHistoryKey(nickname));
    } catch (error) {
        console.error("Failed to clear history from localStorage", error);
    }
};

export const clearAllHistory = (): void => {
    try {
        const allUsersJSON = localStorage.getItem(ALL_USERS_KEY);
        const allUsers: string[] = allUsersJSON ? JSON.parse(allUsersJSON) : [];
        for (const nickname of allUsers) {
            localStorage.removeItem(getHistoryKey(nickname));
        }
    } catch (error) {
        console.error("Failed to clear all user history", error);
    }
};