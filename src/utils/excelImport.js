import * as XLSX from 'xlsx';
const DAY_MAP = {
    'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
    'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6, 'domingo': 0
};
export const parseScheduleExcel = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        try {
            const workbook = XLSX.read(fileBuffer, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            let validYear = new Date().getFullYear();
            const cellA2 = sheet['A2'];
            if (cellA2 && cellA2.v) validYear = parseInt(cellA2.v);
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 1 });
            const scheduleData = {};
            let count = 0;
            jsonData.forEach((row) => {
                if (!row[1] || !row[4]) return;
                const rawDia = String(row[1]).toLowerCase().trim();
                const diaInt = DAY_MAP[rawDia];

                let rawHora = row[2];
                let finalHora = "08:00";
                if (typeof rawHora === 'number') {
                    const totalSeconds = Math.round(86400 * rawHora);
                    const hours = Math.floor(totalSeconds / 3600);
                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                    finalHora = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                } else if (typeof rawHora === 'string') {
                    finalHora = rawHora.trim();
                }
                const duracion = parseInt(row[3]) || 90;
                let curso = String(row[4]).trim();
                const letra = row[5] ? String(row[5]).trim() : '';
                if (letra && letra !== '-' && letra.toLowerCase() !== 'n/a') curso = `${curso} ${letra}`;
                let asignatura = row[6] ? String(row[6]).trim() : '';
                const detalle = row[7] ? String(row[7]).trim() : '';
                const lowerAsig = asignatura.toLowerCase();
                if ((lowerAsig === 'personalizada' || lowerAsig === 'personalizado' || lowerAsig === 'otro' || lowerAsig === 'talleres' || !asignatura) && detalle) {
                    asignatura = detalle;
                }
                if (!diaInt || !asignatura) return;
                if (!scheduleData[curso]) scheduleData[curso] = {};
                if (!scheduleData[curso][asignatura]) scheduleData[curso][asignatura] = [];
                const existingBlockIndex = scheduleData[curso][asignatura].findIndex(
                    b => b.dia === diaInt && b.hora === finalHora
                );
                if (existingBlockIndex !== -1) return;
                scheduleData[curso][asignatura].push({
                    dia: diaInt,
                    hora: finalHora,
                    duration: duracion
                });
                count++;
            });
            resolve({ success: true, validYear, scheduleData, count });
        } catch (error) {
            console.error(error);
            resolve({ success: false, error: error.message });
        }
    });
};
