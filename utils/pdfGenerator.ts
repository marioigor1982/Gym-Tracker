import html2canvas from 'html2canvas';
import type { WorkoutSession } from '../types';

// jspdf é carregado através de uma tag de script em index.html e está disponível no objeto window.
// Acessamos a classe principal do objeto global 'jspdf'.
const { jsPDF } = (window as any).jspdf;

const formatDuration = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let result = '';
    if (hours > 0) result += `${hours}h `;
    result += `${minutes}m`;
    return result;
};

const formatStopwatchTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const createPdfHtml = (session: WorkoutSession): string => {
    let exerciseHtml = '';

    session.exercises.forEach(ex => {
        let logsHtml = '';
        if (ex.isCardio) {
            const completedLog = ex.logs.find(log => log.completed);
            if (completedLog) {
                logsHtml = `<p style="margin-left: 20px; color: #555;">- Tempo: ${formatStopwatchTime(completedLog.reps)}</p>`;
            }
        } else {
            logsHtml = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr>
                            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd; color: #555;">Série</th>
                            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd; color: #555;">Peso (kg)</th>
                            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd; color: #555;">Reps</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ex.logs.map((log, index) => `
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">${index + 1}</td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">${log.weight}</td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">${log.reps}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        exerciseHtml += `
            <div style="margin-bottom: 25px; page-break-inside: avoid;">
                <h3 style="font-size: 18px; color: #333; margin-bottom: 5px;">${ex.name}</h3>
                ${logsHtml}
            </div>
        `;
    });

    const totalWeight = session.exercises.reduce((acc, ex) => 
        acc + ex.logs.reduce((logAcc, log) => log.completed && !ex.isCardio ? logAcc + (log.weight * log.reps) : logAcc, 0), 0);

    return `
        <div id="pdf-content" style="font-family: Arial, sans-serif; color: #333; background-color: white; padding: 40px; width: 800px;">
            <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px;">
                <h1 style="font-size: 32px; color: #3B82F6; margin: 0;">Relatório de Treino</h1>
                <p style="font-size: 16px; color: #666; margin-top: 5px;">Gym Tracker</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 16px;">
                <div>
                    <strong>Treino:</strong> ${session.name}
                </div>
                <div>
                    <strong>Data:</strong> ${new Date(session.startTime).toLocaleDateString('pt-BR')}
                </div>
                <div>
                    <strong>Duração:</strong> ${formatDuration((session.endTime || session.startTime) - session.startTime)}
                </div>
            </div>

            <h2 style="font-size: 24px; color: #3B82F6; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 20px;">Detalhes dos Exercícios</h2>
            
            ${exerciseHtml}

            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #3B82F6; text-align: center;">
                <h3 style="font-size: 20px; color: #333;">Resumo Total</h3>
                <p style="font-size: 16px;"><strong>Peso Total Levantado:</strong> ${totalWeight.toLocaleString('pt-BR')} kg</p>
            </div>
        </div>
    `;
};

export const generateWorkoutPdf = (session: WorkoutSession): Promise<void> => {
    return new Promise((resolve, reject) => {
        const reportHtml = createPdfHtml(session);

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.innerHTML = reportHtml;
        document.body.appendChild(tempContainer);

        const contentElement = tempContainer.querySelector('#pdf-content') as HTMLElement;
        if (!contentElement) {
            console.error('Could not find element to generate PDF from.');
            document.body.removeChild(tempContainer);
            return reject(new Error('PDF content element not found.'));
        }

        setTimeout(async () => {
            try {
                const canvas = await html2canvas(contentElement, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                });

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });

                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                
                const dateStr = new Date(session.startTime).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
                const fileName = `Relatorio-Treino-${session.name.replace(/\s/g, '_')}-${dateStr}.pdf`;
                
                pdf.save(fileName);
                resolve();

            } catch (error) {
                console.error("Error generating PDF: ", error);
                reject(error);
            } finally {
                document.body.removeChild(tempContainer);
            }
        }, 100); // Small delay to ensure the element is rendered
    });
};