import React, { createContext, useContext, useState } from 'react';
import { getWeekNumber } from '@/utils/dateUtils';
const UIContext = createContext();
export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within a UIProvider');
    return context;
};
export const UIProvider = ({ children }) => {
    const [view, setView] = useState('home');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(new Date()));
    const value = {
        view, isLoading, selectedYear, selectedWeek,
        actions: {
            setView, setIsLoading, setSelectedYear, setSelectedWeek
        }
    };
    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
