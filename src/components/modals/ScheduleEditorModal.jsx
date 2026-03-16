import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Save, Plus, Trash2, Upload, Copy, Check, FileText, Menu, Download } from 'lucide-react';
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

    // Multi-course State
    const [isMultiCourse, setIsMultiCourse] = useState(false);
    const [selectedCursos, setSelectedCursos] = useState([]);

    const fileInputExcelRef = useRef(null);
    const fileInputJsonRef = useRef(null);
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
                        curso: h.isMultiCourse ? "Taller" : curso,
                        asignatura,
                        top: minutesFromStart * PIXELS_PER_MINUTE,
                        height: (h.duration || 45) * PIXELS_PER_MINUTE,
                        isMultiCourse: h.isMultiCourse || false,
                        cursos: h.cursos || []
                    });
                });
            });
        });
        return blocks;
    }, [scheduleData]);

    const handleAddBlock = () => {
        const finalAsignatura = isCustomSubject ? formCustomAsignatura : formAsignatura;
        if (!finalAsignatura) return;

        if (!isMultiCourse && !formCurso) return;
        if (isMultiCourse && selectedCursos.length === 0) return;

        const finalCurso = isMultiCourse ? "Taller" : (formLetter && formLetter !== '-' ? `${formCurso} ${formLetter}` : formCurso);

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
                duration: parseInt(formDuracion),
                isMultiCourse,
                cursos: isMultiCourse ? [...selectedCursos] : []
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

    const handleExportJSON = () => {
        const dataToExport = {
            id: scheduleToEdit?.id,
            name: scheduleToEdit?.name || "Respaldo Horario",
            validYear,
            scheduleData,
            exportedAt: new Date().toISOString()
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `respaldo_horario_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportJSON = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                if (json.scheduleData) {
                    setScheduleData(json.scheduleData);
                    if (json.validYear) setValidYear(json.validYear);
                    alert("Respaldo JSON cargado correctamente.");
                } else {
                    alert("El archivo JSON no parece ser un respaldo válido.");
                }
            } catch (err) {
                alert("Error al leer el archivo JSON.");
            }
        };
        reader.readAsText(file);
        event.target.value = null;
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
                                <button onClick={() => fileInputExcelRef.current?.click()} className="px-3 py-1.5 bg-emerald-900/10 hover:bg-emerald-900/30 text-emerald-400 rounded-lg flex gap-1 items-center text-[10px] transition-colors" title="Importar Excel">
                                    <Upload size={12} /> Excel
                                </button>
                                <button onClick={() => fileInputJsonRef.current?.click()} className="px-3 py-1.5 bg-indigo-900/20 hover:bg-indigo-900/40 text-indigo-400 rounded-lg flex gap-1 items-center text-[10px] transition-colors" title="Importar Respaldo JSON">
                                    <Upload size={12} /> Importar
                                </button>
                                <button onClick={handleExportJSON} className="px-3 py-1.5 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 rounded-lg flex gap-1 items-center text-[10px] transition-colors" title="Descargar Respaldo JSON">
                                    <Download size={12} /> Resp. JSON
                                </button>
                                <button onClick={handleExportText} className="px-3 py-1.5 bg-slate-700/30 hover:bg-slate-700/50 text-slate-300 rounded-lg flex gap-1 items-center text-[10px] transition-colors" title="Generar código de respaldo">
                                    <Save size={12} /> Código
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
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button onClick={() => { fileInputExcelRef.current?.click(); setShowMobileMenu(false); }} className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl flex flex-col items-center gap-1 text-[10px] text-slate-300 transition-colors">
                                <Upload size={16} className="text-emerald-400" />
                                Importar Excel
                            </button>
                            <button onClick={() => { fileInputJsonRef.current?.click(); setShowMobileMenu(false); }} className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl flex flex-col items-center gap-1 text-[10px] text-slate-300 transition-colors">
                                <Upload size={16} className="text-indigo-400" />
                                Importar JSON
                            </button>
                            <button onClick={() => { handleExportJSON(); setShowMobileMenu(false); }} className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl flex flex-col items-center gap-1 text-[10px] text-slate-300 transition-colors">
                                <Download size={16} className="text-blue-400" />
                                Respaldo JSON
                            </button>
                            <button onClick={() => { handleExportText(); setShowMobileMenu(false); }} className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl flex flex-col items-center gap-1 text-[10px] text-slate-300 transition-colors">
                                <Save size={16} className="text-slate-400" />
                                Código Respaldo
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

                        <div className="w-full md:w-auto flex flex-col gap-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold block">Modo Clase</label>
                            <button
                                onClick={() => setIsMultiCourse(!isMultiCourse)}
                                className={`h-[30px] px-3 rounded text-[10px] font-bold transition-all border ${isMultiCourse ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                            >
                                {isMultiCourse ? 'MULTI-CURSO' : 'INDIVIDUAL'}
                            </button>
                        </div>

                        {isMultiCourse ? (
                            <div className="flex-grow min-w-[200px] bg-slate-800 border border-slate-700 rounded p-2 min-h-[60px] md:h-auto flex items-center gap-2">
                                <div className="flex flex-wrap gap-2 items-center w-full">
                                    <button
                                        onClick={() => {
                                            const ciclo1 = LISTA_CURSOS.slice(2, 6); // 1ro-4to Básico
                                            setSelectedCursos(prev => [...new Set([...prev, ...ciclo1])]);
                                        }}
                                        className="bg-emerald-600/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap hover:bg-emerald-600/30"
                                    >
                                        + 1er Ciclo
                                    </button>
                                    <button
                                        onClick={() => {
                                            const ciclo2 = LISTA_CURSOS.slice(6, 10); // 5to-8vo
                                            setSelectedCursos(prev => [...new Set([...prev, ...ciclo2])]);
                                        }}
                                        className="bg-blue-600/20 text-blue-400 text-[9px] px-2 py-0.5 rounded border border-blue-500/30 whitespace-nowrap hover:bg-blue-600/30"
                                    >
                                        + 2do Ciclo
                                    </button>
                                    <button
                                        onClick={() => setSelectedCursos([])}
                                        className="text-[9px] text-slate-500 hover:text-slate-300 ml-1 underline"
                                    >
                                        Limpiar
                                    </button>
                                    <div className="h-4 w-[1px] bg-slate-700 mx-1 hidden md:block"></div>
                                    <div className="flex flex-wrap gap-1">
                                        {LISTA_CURSOS.map(c => (
                                            <label key={c} className="flex items-center gap-1 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCursos.includes(c)}
                                                    onChange={() => {
                                                        setSelectedCursos(prev =>
                                                            prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                                                        );
                                                    }}
                                                    className="hidden"
                                                />
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded transition-all ${selectedCursos.includes(c) ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}`}>
                                                    {c.split(' ')[0]}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : null}


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

                <input type="file" ref={fileInputExcelRef} hidden accept=".xlsx" onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const result = await parseScheduleExcel(await file.arrayBuffer());
                    if (result.success) setScheduleData(result.scheduleData);
                    e.target.value = null;
                }} />

                <input type="file" ref={fileInputJsonRef} hidden accept=".json" onChange={handleImportJSON} />

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
