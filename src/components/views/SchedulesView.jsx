import React from 'react';
import { Calendar, Plus, Eye, CheckCircle2 } from 'lucide-react';
const SchedulesView = ({ schedules = [], onEdit }) => {
    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Mis Horarios</h1>
                    <p className="text-slate-400 text-sm mt-1">Gestiona y organiza tus clases</p>
                </div>
                <button
                    onClick={() => onEdit({}, null, true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    <Plus size={20} />
                    <span className="font-medium">Crear Nuevo</span>
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {!schedules.length ? (
                    <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-slate-700 rounded-3xl bg-slate-800/20">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Calendar size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-300 mb-2">No hay horarios creados</h3>
                        <p className="mb-6 max-w-sm mx-auto">Comienza creando tu primer horario para organizar las clases.</p>
                        <button onClick={() => onEdit({}, null, true)} className="text-indigo-400 hover:text-indigo-300 font-medium">
                            + Crear primer horario
                        </button>
                    </div>
                ) : (
                    schedules.map(schedule => (
                        <div key={schedule.id} className="group bg-slate-800/50 border border-indigo-500/10 hover:border-indigo-500/30 rounded-2xl p-5 hover:-translate-y-1 transition-all shadow-lg hover:shadow-indigo-500/10">
                            <div className="flex justify-between mb-4">
                                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                                    <Calendar size={24} />
                                </div>
                                <span className="h-fit bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                    <CheckCircle2 size={10} /> ACTIVO
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-1" title={schedule.name}>
                                {schedule.name || "Horario Sin Nombre"}
                            </h3>
                            <p className="text-slate-400 text-xs mb-6">Última modificación: Hoy</p>

                            <button
                                onClick={() => onEdit(schedule, null, true)}
                                className="w-full py-2.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl flex justify-center items-center gap-2 transition-all font-medium text-sm"
                            >
                                <Eye size={16} />
                                Ver y Editar
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
export default SchedulesView;
