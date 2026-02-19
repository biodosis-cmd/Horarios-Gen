import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Save, Plus, Trash2, Upload, Copy, Check, FileText, Menu } from 'lucide-react';
import { LISTA_CURSOS, LISTA_ASIGNATURAS, DIAS_SEMANA } from '@/constants';
import { parseScheduleExcel } from '@/utils/excelImport';
import { encryptData } from '@/utils/crypto';
import { generatePDF, generateCreativePDF } from '@/utils/exportUtils';
import ScheduleGrid from '@/components/schedule/ScheduleGrid';

const START_HOUR = 8;
const END_HOUR = 18;
const PIXELS_PER_MINUTE = 0.9;

const ScheduleEditorModal = ({ isOpen, onClose, scheduleToEdit = null, cloneFrom = null }) => {
    const [scheduleData, setScheduleData] = useState({});
    const [validYear, setValidYear] = useState(new Date().getFullYear());

    // Form State
    const [formDia, setFormDia] = useState(1);
    const [formHora, setFormHora] = useState('08:00');
    const [formDuracion, setFormDuracion] = useState(45);
    const [formCurso, setFormCurso] = useState('');
    const [formLetter, setFormLetter] = useState('');
    const [formAsignatura, setFormAsignatura] = useState('');
    const [formCustomAsignatura, setFormCustomAsignatura] = useState('');
    const [isCustomSubject, setIsCustomSubject] = useState(false);

    const fileInputRef = useRef(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [encryptedString, setEncryptedString] = useState('');
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const flatBlocks = useMemo(() => {
        const blocks = [];
        Object.entries(scheduleData).forEach(([curso, asignaturas]) => {
            Object.entries(asignaturas).forEach(([asignatura, horarios]) => {
                horarios.forEach((h, idx) => {
                    const [hourStr, minStr] = h.hora.split(':');
                    const minutesFromStart = (parseInt(hourStr) - START_HOUR) * 60 + parseInt(minStr);
                    blocks.push({
                        id: `${curso}-${asignatura}-${h.dia}-${h.hora}-${idx}`,
                        originalIdx: idx,
                        dia: h.dia,
                        hora: h.hora,
                        duration: h.duration || 45,
                        curso,
                        asignatura,
                        top: minutesFromStart * PIXELS_PER_MINUTE,
                        height: (h.duration || 45) * PIXELS_PER_MINUTE
                    });
                });
            });
        });
        return blocks;
    }, [scheduleData]);

    const handleAddBlock = () => {
        if (!formCurso) return;
        const finalAsignatura = isCustomSubject ? formCustomAsignatura : formAsignatura;
        if (!finalAsignatura) return;

        const finalCurso = formLetter && formLetter !== '-' ? `${formCurso} ${formLetter}` : formCurso;

        // Simple collision check (improved logic needed for full overlap check)
        const conflict = flatBlocks.find(b => b.dia === parseInt(formDia) && b.hora === formHora);
        if (conflict) {
            alert("Conflicto de Horario: Ya existe una clase a esta hora.");
            return;
        }

        setScheduleData(prev => {
            const newState = { ...prev };
            if (!newState[finalCurso]) newState[finalCurso] = {};
            if (!newState[finalCurso][finalAsignatura]) newState[finalCurso][finalAsignatura] = [];

            newState[finalCurso][finalAsignatura].push({
                dia: parseInt(formDia),
                hora: formHora,
                duration: parseInt(formDuracion)
            });
            return newState;
        });
    };

    const removeBlock = (block) => {
        setScheduleData(prev => {
            const newState = { ...prev };
            if (newState[block.curso]?.[block.asignatura]) {
                newState[block.curso][block.asignatura] = newState[block.curso][block.asignatura].filter(
                    (h, i) => !(h.dia === block.dia && h.hora === block.hora && i === block.originalIdx)
                );
                if (newState[block.curso][block.asignatura].length === 0) delete newState[block.curso][block.asignatura];
            }
            return newState;
        });
    };

    const [teacherName, setTeacherName] = useState('');

    const handleExportText = () => {
        const encrypted = encryptData({ validYear, scheduleData, generatedAt: new Date().toISOString() });
        if (encrypted) {
            setEncryptedString(encrypted);
            setShowExportModal(true);
        }
    };

    const handleExportPDF = () => {
        generatePDF(scheduleData, teacherName, validYear);
    };

    useEffect(() => {
        if (isOpen) {
            if (scheduleToEdit) {
                setScheduleData(scheduleToEdit.scheduleData || {});
            } else {
                setScheduleData({});
            }
        }
    }, [isOpen, scheduleToEdit]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-[#0f1221] rounded-2xl w-full max-w-7xl h-[95vh] flex flex-col border border-slate-700 relative">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 bg-slate-800/30 flex justify-between items-center gap-4">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 whitespace-nowrap">Editor</h2>

                    <div className="flex-grow flex items-center justify-end gap-2">
                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-2 overflow-x-auto">
                            {/* Import/Backup Group */}
                            <div className="flex gap-2 mr-2 border-r border-slate-700 pr-2">
                                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 rounded-lg flex gap-1 items-center text-xs transition-colors" title="Importar Excel/Backup">
                                    <Upload size={14} /> Importar
                                </button>
                                <button onClick={handleExportText} className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg flex gap-1 items-center text-xs transition-colors" title="Generar código de respaldo">
                                    <Save size={14} /> Respaldo
                                </button>
                            </div>

                            {/* Document Export Group */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={teacherName}
                                    onChange={e => setTeacherName(e.target.value)}
                                    placeholder="Nombre Docente..."
                                    className="w-40 bg-slate-900 border border-slate-600 rounded-lg p-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none placeholder:text-slate-600"
                                />
                                <button onClick={handleExportPDF} className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg flex gap-1 items-center text-xs transition-colors" title="Exportar PDF Estándar">
                                    <FileText size={14} /> PDF Std
                                </button>
                                <button onClick={() => generateCreativePDF(scheduleData, teacherName, validYear)} className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-lg flex gap-1 items-center text-xs transition-all shadow-lg shadow-purple-500/20" title="Exportar PDF Creativo">
                                    <FileText size={14} /> PDF Pro
                                </button>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="hidden md:block w-[1px] h-6 bg-slate-700 mx-1"></div>

                        <button onClick={onClose} className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {showMobileMenu && (
                    <div className="md:hidden bg-slate-800 border-b border-slate-700 p-4 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button onClick={() => { fileInputRef.current?.click(); setShowMobileMenu(false); }} className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl flex flex-col items-center gap-2 text-xs text-slate-300 transition-colors">
                                <Upload size={20} className="text-emerald-400" />
                                Importar Excel
                            </button>
                            <button onClick={() => { handleExportText(); setShowMobileMenu(false); }} className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl flex flex-col items-center gap-2 text-xs text-slate-300 transition-colors">
                                <Save size={20} className="text-blue-400" />
                                Respaldo
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Nombre Docente</label>
                                <input
                                    type="text"
                                    value={teacherName}
                                    onChange={e => setTeacherName(e.target.value)}
                                    placeholder="Nombre para el PDF..."
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-sm text-slate-200 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => { handleExportPDF(); setShowMobileMenu(false); }} className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs flex items-center justify-center gap-2">
                                    <FileText size={14} /> PDF Estándar
                                </button>
                                <button onClick={() => { generateCreativePDF(scheduleData, teacherName, validYear); setShowMobileMenu(false); }} className="p-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg text-xs flex items-center justify-center gap-2">
                                    <FileText size={14} /> PDF Creativo
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="p-3 bg-slate-900/50 border-b border-slate-700">
                    <div className="flex flex-col md:flex-row md:items-end gap-3">

                        {/* Mobile Grid Layout for Inputs */}
                        <div className="grid grid-cols-2 md:contents gap-2">
                            <div className="w-full md:w-24">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Día</label>
                                <select value={formDia} onChange={e => setFormDia(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none h-[30px]">
                                    {DIAS_SEMANA.map((d, i) => <option key={i} value={i + 1}>{d}</option>)}
                                </select>
                            </div>
                            <div className="w-full md:w-20">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Hora</label>
                                <input type="time" value={formHora} onChange={e => setFormHora(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none h-[30px]" />
                            </div>
                            <div className="w-full md:w-20">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Duración</label>
                                <select value={formDuracion} onChange={e => setFormDuracion(parseInt(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none h-[30px]">
                                    <option value={45}>45 min</option>
                                    <option value={90}>90 min</option>
                                </select>
                            </div>
                            <div className="w-full md:w-28">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Curso</label>
                                <select value={formCurso} onChange={e => setFormCurso(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none h-[30px]">
                                    <option value="">Curso...</option>
                                    {LISTA_CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="hidden md:block md:w-16">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Letra</label>
                                <select value={formLetter} onChange={e => setFormLetter(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none h-[30px]">
                                    <option value="">-</option>
                                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            {/* Mobile only Letter input (part of grid) */}
                            <div className="md:hidden w-full">
                                <label className="text-[10px] uppercase text-slate-500 font-bold mb-1 block">Letra</label>
                                <select value={formLetter} onChange={e => setFormLetter(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none h-[30px]">
                                    <option value="">-</option>
                                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>


                        <div className="flex-grow min-w-[200px] w-full md:w-auto">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] uppercase text-slate-500 font-bold block">{isCustomSubject ? 'Detalle / Otro' : 'Asignatura'}</label>
                                <button onClick={() => setIsCustomSubject(!isCustomSubject)} className="text-[9px] text-indigo-400 hover:text-indigo-300 underline">
                                    {isCustomSubject ? 'Seleccionar lista' : 'Escribir manual'}
                                </button>
                            </div>
                            {isCustomSubject ? (
                                <input type="text"
                                    value={formCustomAsignatura}
                                    onChange={e => setFormCustomAsignatura(e.target.value)}
                                    placeholder="Nombre de la actividad..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none h-[30px]"
                                />
                            ) : (
                                <select value={formAsignatura} onChange={e => setFormAsignatura(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:border-indigo-500 outline-none h-[30px]">
                                    <option value="">Seleccionar Asignatura...</option>
                                    {LISTA_ASIGNATURAS.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            )}
                        </div>

                        <button onClick={handleAddBlock} className="w-full md:w-auto px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors flex justify-center items-center gap-2 h-[30px] mt-2 md:mt-0">
                            <Plus size={16} /> <span className="md:hidden lg:inline">Agregar</span>
                        </button>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-grow overflow-auto bg-[#0b0e1b] relative">
                    <ScheduleGrid startHour={START_HOUR} endHour={END_HOUR} pixelsPerMinute={PIXELS_PER_MINUTE} flatBlocks={flatBlocks} canEdit={true} onRemoveBlock={removeBlock} />
                </div>

                <input type="file" ref={fileInputRef} hidden accept=".xlsx" onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const result = await parseScheduleExcel(await file.arrayBuffer());
                    if (result.success) setScheduleData(result.scheduleData);
                    e.target.value = null;
                }} />

                {showExportModal && (
                    <div className="absolute inset-0 bg-slate-900/95 flex items-center justify-center z-[60] p-4">
                        <div className="bg-slate-800 p-6 rounded-xl max-w-4xl w-full border border-slate-600 shadow-2xl">
                            <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                <Save size={20} className="text-blue-400" />
                                Código de Respaldo
                            </h3>
                            <p className="text-slate-400 text-sm mb-2">Copia este código y guárdalo en un lugar seguro. Podrás usarlo después para importar este horario.</p>

                            <div className="relative mb-4">
                                <textarea
                                    readOnly
                                    value={encryptedString}
                                    className="w-full h-64 bg-[#0f1221] text-green-400 font-mono text-xs p-4 rounded-lg border border-slate-700 resize-none focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(encryptedString);
                                        const btn = document.getElementById('copy-btn');
                                        if (btn) {
                                            const originalText = btn.innerHTML;
                                            btn.innerHTML = '<span class="flex gap-2 items-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copiado!</span>';
                                            setTimeout(() => btn.innerHTML = originalText, 2000);
                                        }
                                    }}
                                    id="copy-btn"
                                    className="absolute top-2 right-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-2 shadow-lg"
                                >
                                    <Copy size={14} /> Copiar
                                </button>
                            </div>

                            <div className="flex justify-end">
                                <button onClick={() => setShowExportModal(false)} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default ScheduleEditorModal;
