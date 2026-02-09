import React from 'react';
import { X } from 'lucide-react';
import { DIAS_SEMANA, CURSO_COLORES } from '@/constants';

const ScheduleGrid = ({ startHour = 8, endHour = 18, pixelsPerMinute = 0.9, flatBlocks = [], canEdit = false, onRemoveBlock }) => {
    const totalHeight = (endHour - startHour) * 60 * pixelsPerMinute + 80;

    const getColorForCourse = (courseName) => {
        if (!courseName) return 'bg-slate-600';
        if (CURSO_COLORES[courseName]) return CURSO_COLORES[courseName];

        // Try to match base course name if there's a letter suffix
        const parts = courseName.split(' ');
        if (parts.length >= 2 && parts[parts.length - 1].length === 1) {
            const baseName = parts.slice(0, -1).join(' ');
            if (CURSO_COLORES[baseName]) return CURSO_COLORES[baseName];
        }
        return 'bg-slate-600';
    };

    // Helper to format course name for the card (e.g. "1ro Básico A" -> { main: "1A", sub: "Básico" })
    const formatCourseForCard = (courseName) => {
        if (!courseName) return { main: '?', sub: '' };

        const parts = courseName.split(' ');
        let letter = '';
        // Find the letter part. Iterate from end to start to find the last single letter.
        for (let i = parts.length - 1; i >= 0; i--) {
            if (parts[i].length === 1 && /^[A-Z]$/i.test(parts[i])) {
                letter = parts[i];
                break;
            }
        }

        // Special cases
        if (courseName.startsWith('NT1') || courseName.toLowerCase().includes('nt1')) {
            return { main: letter ? `NT1 ${letter}` : 'NT1', sub: 'Pre-K' };
        }
        if (courseName.startsWith('NT2') || courseName.toLowerCase().includes('nt2')) {
            return { main: letter ? `NT2 ${letter}` : 'NT2', sub: 'Kinder' };
        }
        if (courseName.toLowerCase().includes('kinder')) { // Generic Kinder
            return { main: letter ? `K ${letter}` : 'K', sub: 'Kinder' };
        }

        // Standard cases: "1ro Básico A"
        let number = parts[0].replace(/(ro|do|to|mo|vo|er|da|ta|ma|va)/g, '');
        let level = '';

        for (let i = 1; i < parts.length; i++) {
            const p = parts[i];
            if (p === 'Básico' || p === 'Básica') level = 'Básico';
            else if (p === 'Medio' || p === 'Media') level = 'Medio';
        }

        if (!number && !level) return { main: courseName.substring(0, 3), sub: '' };

        return {
            main: `${number}${letter}`,
            sub: level
        };
    };

    return (
        <div className="min-w-[800px] relative pb-10" style={{ height: `${totalHeight}px` }}>
            {/* Headers */}
            <div className="sticky top-0 z-30 flex shadow-sm pl-16">
                {DIAS_SEMANA.map(dia => (
                    <div key={dia} className="flex-1 text-center py-3 font-bold text-slate-200 bg-[#0f1221] border-b border-indigo-500/30 border-r border-slate-700/30">
                        {dia}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="relative">
                {/* Time Axis */}
                <div className="absolute left-0 top-0 bottom-0 w-16 border-r border-slate-700/30 bg-slate-900/30 z-10">
                    {Array.from({ length: (endHour - startHour) * 2 + 1 }).map((_, i) => {
                        const totalMinutes = i * 30;
                        const hour = Math.floor(startHour + i * 0.5);
                        const min = i % 2 === 0 ? '00' : '30';
                        return (
                            <div key={i} className="absolute w-full flex justify-end pr-3" style={{ top: totalMinutes * pixelsPerMinute, transform: 'translateY(-50%)' }}>
                                <span className="text-xs font-mono text-slate-500">{String(hour).padStart(2, '0')}:{min}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Columns */}
                <div className="absolute left-16 right-0 top-0 bottom-0 flex">
                    {DIAS_SEMANA.map((dia, index) => (
                        <div key={dia} className="flex-1 border-r border-slate-700/30 relative">
                            {/* Guides */}
                            {Array.from({ length: (endHour - startHour) * 2 + 1 }).map((_, i) => (
                                <div key={i} className="absolute left-0 right-0 border-t border-slate-800/10 pointer-events-none" style={{ top: i * 30 * pixelsPerMinute }}></div>
                            ))}

                            {/* Blocks */}
                            {flatBlocks.filter(b => b.dia === index + 1).map(block => {
                                const blockColor = getColorForCourse(block.curso);
                                const { main, sub } = formatCourseForCard(block.curso);
                                const isShort = block.duration <= 45;

                                return (
                                    <div key={block.id}
                                        className={`absolute inset-x-[1px] rounded-lg shadow-sm border-0 overflow-hidden bg-slate-800/90 hover:bg-slate-700/90 transition-colors group z-20`}
                                        style={{ top: block.top, height: block.height }}>
                                        <div className="flex h-full w-full">
                                            {/* Course Sidebar */}
                                            <div className={`h-full w-14 min-w-[3.5rem] flex flex-col items-center justify-center ${blockColor} text-white`}>
                                                <span className={`${main.length > 3 ? 'text-sm' : 'text-xl'} font-bold leading-none text-center px-0.5`}>{main}</span>
                                                {sub && <span className="text-[9px] uppercase font-medium mt-0.5 opacity-90">{sub}</span>}
                                            </div>

                                            {/* Content */}
                                            <div className={`flex-grow relative flex flex-col justify-center min-w-0 overflow-hidden ${isShort ? 'p-1' : 'p-2'}`}>
                                                <div className={`flex items-center gap-2 ${isShort ? 'mb-0' : 'mb-0.5'}`}>
                                                    <span className={`${isShort ? 'text-[9px]' : 'text-[10px]'} font-mono text-slate-400`}>
                                                        {block.hora} / {block.duration}m
                                                    </span>
                                                </div>
                                                <h3 className={`font-bold text-slate-200 leading-none break-words whitespace-normal w-full overflow-hidden ${isShort ? 'text-[10px] max-h-[2.4em]' : 'text-xs line-clamp-2'}`} title={block.asignatura}>
                                                    {block.asignatura}
                                                </h3>

                                                {canEdit && (
                                                    <button onClick={(e) => { e.stopPropagation(); onRemoveBlock(block); }}
                                                        className="absolute top-0.5 right-0.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
export default ScheduleGrid;
