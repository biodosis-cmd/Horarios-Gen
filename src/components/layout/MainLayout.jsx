import React, { useState } from 'react';
import { Menu, X, Calendar, User, LogOut } from 'lucide-react';

const MainLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#0f1221] text-slate-100 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden bg-slate-900/50 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-2 rounded-lg">
                        <Calendar size={20} className="text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">Horarios Gen</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar / Navigation */}
            <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/95 border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block backdrop-blur-xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="p-6 h-full flex flex-col">
                    <div className="hidden md:flex items-center gap-3 mb-8">
                        <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                            <Calendar size={24} className="text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">Horarios Gen</span>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <a href="#" className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-600/20">
                            <Calendar size={20} />
                            <span className="font-medium">Mis Horarios</span>
                        </a>
                        {/* Add more links here if needed */}
                    </nav>

                    <div className="border-t border-slate-800 pt-6 mt-6">
                        <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl cursor-pointer transition-colors">
                            <User size={20} />
                            <span className="font-medium">Admin User</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Content Area */}
            <main className="flex-1 overflow-x-hidden">
                <div className="max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
};
export default MainLayout;
