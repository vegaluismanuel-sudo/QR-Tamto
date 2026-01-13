import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReport } from '../../contexts/ReportContext';
import { calculateStats, calculateConformitySummary } from '../../utils/statistics';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { ClipboardCopy } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const DeviationBar = ({ value, nominal, minSpec, maxSpec, color = 'bg-blue-600' }) => {
    const val = parseFloat(value);
    const nom = parseFloat(nominal);
    const min = parseFloat(minSpec);
    const max = parseFloat(maxSpec);

    if (isNaN(val) || isNaN(nom) || isNaN(min) || isNaN(max) || min >= max || nom <= min || nom >= max) {
        // Fallback for missing specs or invalid values
        const fallbackPercent = isNaN(val) || isNaN(nom) ? 50 : (val === nom ? 50 : (val > nom ? 90 : 10));
        return (
            <div className="mt-1.5 flex flex-col items-center">
                <div className="relative w-16 h-1 bg-gray-100 rounded-full">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-2 bg-gray-200" />
                </div>
            </div>
        );
    }

    let percentage = 50;
    if (val < nom) {
        // Map [min, nom] -> [0, 50]
        percentage = 50 * (val - min) / (nom - min);
    } else if (val > nom) {
        // Map [nom, max] -> [50, 100]
        percentage = 50 + 50 * (val - nom) / (max - nom);
    }

    const clampedPercent = Math.max(0, Math.min(100, percentage));

    return (
        <div className="mt-1.5 flex flex-col items-center">
            <div className="relative w-16 h-1 bg-gray-200 rounded-full">
                {/* Nominal Reference (Center) */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-gray-400" />
                {/* Value Dot */}
                <div
                    className={`absolute top-1/2 w-2 h-2 rounded-full border border-white shadow-sm transition-all duration-300 ${color}`}
                    style={{
                        left: `${clampedPercent}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10
                    }}
                />
            </div>
        </div>
    );
};

const StatsDashboard = () => {
    const { t } = useLanguage();
    const { reportData, measurements } = useReport();

    if (!measurements || measurements.length === 0) {
        return <div className="p-6 text-gray-500">{t('analysis.noVariableData')}</div>;
    }

    const variableMeasurements = measurements.filter(m => (m.data_type || '').toUpperCase() === 'VARIABLE');
    const attributeMeasurements = measurements.filter(m => (m.data_type || '').toUpperCase() === 'ATRIBUTO' || (m.data_type || '').toUpperCase() === 'ATTRIBUTE');
    const conformityData = calculateConformitySummary(measurements);

    const isInches = (reportData.units || '').toLowerCase().includes('inch') || (reportData.units || '').toLowerCase() === 'pulgadas';
    const precision = isInches ? 4 : 3;

    const formatVal = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? val : num.toFixed(precision);
    };

    const stats = variableMeasurements.map(m => {
        const rawStats = calculateStats(m.results);
        return {
            id: m.id,
            cotaNumber: m.cota_number,
            characteristic: m.characteristic,
            minSpec: formatVal(m.min_value),
            nominal: formatVal(m.nominal_value),
            maxSpec: formatVal(m.max_value),
            mean: formatVal(rawStats.mean),
            median: formatVal(rawStats.median),
            stdDev: formatVal(rawStats.stdDev),
            min: formatVal(rawStats.min),
            max: formatVal(rawStats.max),
            count: rawStats.count
        };
    });

    const attributeStats = attributeMeasurements.map(m => {
        const okCrit = (m.criteria_ok || 'OK').toString().trim().toUpperCase();
        const nokCrit = (m.criteria_nok || 'NOT OK').toString().trim().toUpperCase();

        const okCount = (m.results || []).filter(v => {
            const val = (v || '').toString().trim().toUpperCase();
            const match = val === okCrit;
            // if (match) console.log(`Match OK: [${val}] === [${okCrit}]`);
            return match;
        }).length;

        const nokCount = (m.results || []).filter(v => {
            const val = (v || '').toString().trim().toUpperCase();
            const match = val === nokCrit;
            // if (match) console.log(`Match NOK: [${val}] === [${nokCrit}]`);
            return match;
        }).length;

        return {
            id: m.id,
            cotaNumber: m.cota_number,
            characteristic: m.characteristic,
            okCrit: m.criteria_ok || 'OK',
            nokCrit: m.criteria_nok || 'NOT OK',
            ok: okCount,
            nok: nokCount,
            total: (m.results || []).length
        };
    });


    const handleCopyToClipboard = async () => {
        try {
            let html = `
                <table style="border-collapse: collapse; font-family: Calibri, Arial, sans-serif;">
                    <tr><td colspan="4" style="font-size: 16pt; font-weight: bold;">INDUSTRIAL TAMTO DE PUEBLA S.A. DE C.V.</td></tr>
                    <tr><td colspan="4" style="font-size: 14pt; font-weight: bold;">${t('modules.statsSummary').toUpperCase()}</td></tr>
                    <tr><td colspan="4">&nbsp;</td></tr>
                    <tr><td style="font-weight: bold;">Part Name:</td><td>${reportData.part_name || ''}</td></tr>
                    <tr><td style="font-weight: bold;">Part Number:</td><td>${reportData.part_number || ''}</td></tr>
                    <tr><td style="font-weight: bold;">Date:</td><td>${reportData.date || ''}</td></tr>
                    <tr><td style="font-weight: bold;">Units:</td><td>${reportData.units || ''}</td></tr>
                    <tr><td colspan="4">&nbsp;</td></tr>
                </table>
            `;

            // Variable Stats Table
            html += `
                <table style="border-collapse: collapse; font-family: Calibri, Arial, sans-serif; border: 1px solid #444;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #444; padding: 4px;">#</th>
                            <th style="border: 1px solid #444; padding: 4px;">${t('analysis.stats.characteristic')}</th>
                            <th style="border: 1px solid #444; padding: 4px;">MIN (Spec)</th>
                            <th style="border: 1px solid #444; padding: 4px;">Nominal</th>
                            <th style="border: 1px solid #444; padding: 4px;">MAX (Spec)</th>
                            <th style="border: 1px solid #444; padding: 4px; background-color: #eee;">${t('analysis.stats.mean')}</th>
                            <th style="border: 1px solid #444; padding: 4px; background-color: #eee;">${t('analysis.stats.median')}</th>
                            <th style="border: 1px solid #444; padding: 4px; background-color: #eee;">${t('analysis.stats.stdDev')}</th>
                            <th style="border: 1px solid #444; padding: 4px;">MIN</th>
                            <th style="border: 1px solid #444; padding: 4px;">MAX</th>
                            <th style="border: 1px solid #444; padding: 4px;">Samples</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            let tsvLines = [["#", "Characteristic", "Mean", "Median", "Std Dev", "Min", "Max", "Samples"].join('\t')];

            stats.forEach(s => {
                const minLimit = parseFloat(s.minSpec);
                const maxLimit = parseFloat(s.maxSpec);
                const isMeanOut = !isNaN(minLimit) && !isNaN(maxLimit) && (parseFloat(s.mean) < minLimit || parseFloat(s.mean) > maxLimit);
                const isMinOut = !isNaN(minLimit) && parseFloat(s.min) < minLimit;
                const isMaxOut = !isNaN(maxLimit) && parseFloat(s.max) > maxLimit;

                html += `
                    <tr>
                        <td style="border: 1px solid #444; padding: 4px; text-align: center;">${s.cotaNumber || ''}</td>
                        <td style="border: 1px solid #444; padding: 4px;">${s.characteristic}</td>
                        <td style="border: 1px solid #444; padding: 4px; text-align: center;">${s.minSpec}</td>
                        <td style="border: 1px solid #444; padding: 4px; text-align: center; font-weight: bold;">${s.nominal}</td>
                        <td style="border: 1px solid #444; padding: 4px; text-align: center;">${s.maxSpec}</td>
                        <td style="border: 1px solid #444; padding: 4px; text-align: center; font-weight: bold; ${isMeanOut ? 'color: red;' : ''}">${s.mean}</td>
                        <td style="border: 1px solid #444; padding: 4px; text-align: center;">${s.median}</td>
                        <td style="border: 1px solid #444; padding: 4px; text-align: center;">${s.stdDev}</td>
                        <td style="border: 1px solid #444; padding: 4px; text-align: center; font-weight: bold; ${isMinOut ? 'color: red;' : ''}">${s.min}</td>
                        <td style="border: 1px solid #444; padding: 4px; text-align: center; font-weight: bold; ${isMaxOut ? 'color: red;' : ''}">${s.max}</td>
                        <td style="border: 1px solid #444; padding: 4px; text-align: center;">${s.count}</td>
                    </tr>
                `;
                tsvLines.push([s.cotaNumber, s.characteristic, s.mean, s.median, s.stdDev, s.min, s.max, s.count].join('\t'));
            });
            html += `</tbody></table><br/>`;

            // Conformity
            if (conformityData) {
                html += `
                    <table style="border-collapse: collapse; font-family: Calibri, Arial, sans-serif; border: 1px solid #444;">
                        <tr style="background-color: #f2f2f2;"><th colspan="2" style="border: 1px solid #444; padding: 4px;">${t('analysis.conformity')}</th></tr>
                        <tr><td style="border: 1px solid #444; padding: 4px;">PASS</td><td style="border: 1px solid #444; padding: 4px; color: green; font-weight: bold;">${conformityData.pass}</td></tr>
                        <tr><td style="border: 1px solid #444; padding: 4px;">FAIL</td><td style="border: 1px solid #444; padding: 4px; color: red; font-weight: bold;">${conformityData.fail}</td></tr>
                        <tr><td style="border: 1px solid #444; padding: 4px;">TOTAL</td><td style="border: 1px solid #444; padding: 4px; font-weight: bold;">${conformityData.total}</td></tr>
                        <tr><td style="border: 1px solid #444; padding: 4px;">% OK</td><td style="border: 1px solid #444; padding: 4px; font-weight: bold;">${((conformityData.pass / conformityData.total) * 100).toFixed(1)}%</td></tr>
                    </table><br/>
                `;
            }

            // Attribute Stats
            if (attributeStats.length > 0) {
                html += `
                    <table style="border-collapse: collapse; font-family: Calibri, Arial, sans-serif; border: 1px solid #444;">
                        <thead>
                            <tr style="background-color: #f2f2f2;">
                                <th style="border: 1px solid #444; padding: 4px;">#</th>
                                <th style="border: 1px solid #444; padding: 4px;">${t('analysis.stats.characteristic')}</th>
                                <th style="border: 1px solid #444; padding: 4px; color: green;">OK</th>
                                <th style="border: 1px solid #444; padding: 4px; color: red;">NOT OK</th>
                                <th style="border: 1px solid #444; padding: 4px;">Samples</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                attributeStats.forEach(s => {
                    html += `
                        <tr>
                            <td style="border: 1px solid #444; padding: 4px; text-align: center;">${s.cotaNumber || ''}</td>
                            <td style="border: 1px solid #444; padding: 4px;">${s.characteristic}</td>
                            <td style="border: 1px solid #444; padding: 4px; text-align: center; color: green; font-weight: bold;">${s.ok}</td>
                            <td style="border: 1px solid #444; padding: 4px; text-align: center; color: red; font-weight: bold;">${s.nok}</td>
                            <td style="border: 1px solid #444; padding: 4px; text-align: center;">${s.total}</td>
                        </tr>
                    `;
                });
                html += `</tbody></table>`;
            }

            const blobHtml = new Blob([html], { type: 'text/html' });
            const blobText = new Blob([tsvLines.join('\n')], { type: 'text/plain' });
            const data = [new ClipboardItem({ 'text/html': blobHtml, 'text/plain': blobText })];

            await navigator.clipboard.write(data);
            alert('¡Resumen estadístico copiado con éxito! Ahora puedes pegar en Excel.');

        } catch (error) {
            console.error("Clipboard Error:", error);
            alert("Error al copiar al portapapeles.");
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-tamto-grey">{t('modules.statsSummary')}</h2>
                    <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-2">
                        <span className="bg-tamto-yellow/20 text-tamto-grey px-2 py-0.5 rounded border border-tamto-yellow/30 uppercase">
                            {t('generalInfo.units')}: {reportData.units || '---'}
                        </span>
                    </p>
                </div>
                <div className="flex space-x-2">
                    <button onClick={handleCopyToClipboard} className="flex items-center space-x-2 bg-teal-600 text-white px-3 py-2 rounded hover:bg-teal-700 h-fit">
                        <ClipboardCopy size={18} /> <span>{t('actions.copyToExcel') || 'Copiar a Excel'}</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8 max-h-[70vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">#</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">{t('analysis.stats.characteristic')}</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider border-l bg-gray-50">{t('analysis.stats.min')} (Spec)</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">{t('analysis.stats.nominal')}</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50">{t('analysis.stats.max')} (Spec)</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-black uppercase tracking-wider border-l bg-gray-100">{t('analysis.stats.mean')}</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-black uppercase tracking-wider bg-gray-100">{t('analysis.stats.median')}</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-black uppercase tracking-wider bg-gray-100">{t('analysis.stats.stdDev')}</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-black uppercase tracking-wider border-l bg-blue-50/20">{t('analysis.stats.min')}</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-black uppercase tracking-wider bg-blue-50/20">{t('analysis.stats.max')}</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-l bg-gray-50">{t('analysis.stats.samples')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {stats.map((s, idx) => {
                            const minLimit = parseFloat(s.minSpec);
                            const maxLimit = parseFloat(s.maxSpec);
                            const isMeanOut = !isNaN(minLimit) && !isNaN(maxLimit) && (parseFloat(s.mean) < minLimit || parseFloat(s.mean) > maxLimit);
                            const isMinOut = !isNaN(minLimit) && parseFloat(s.min) < minLimit;
                            const isMaxOut = !isNaN(maxLimit) && parseFloat(s.max) > maxLimit;

                            return (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">{s.cotaNumber}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-tamto-grey">{s.characteristic}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500 border-l italic">{s.minSpec}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500 font-bold">{s.nominal}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500 italic">{s.maxSpec}</td>
                                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-center font-bold border-l bg-gray-50/30 ${isMeanOut ? 'text-red-600' : 'text-black'}`}>
                                        <div>{s.mean}</div>
                                        <DeviationBar value={s.mean} nominal={s.nominal} minSpec={s.minSpec} maxSpec={s.maxSpec} color={isMeanOut ? 'bg-red-500' : 'bg-blue-600'} />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-black bg-gray-50/30">
                                        <div>{s.median}</div>
                                        <DeviationBar value={s.median} nominal={s.nominal} minSpec={s.minSpec} maxSpec={s.maxSpec} color="bg-gray-600" />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-black bg-gray-50/30">{s.stdDev}</td>
                                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-center font-bold border-l bg-gray-50/20 ${isMinOut ? 'text-red-600' : 'text-black'}`}>{s.min}</td>
                                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-center font-bold bg-gray-50/20 ${isMaxOut ? 'text-red-600' : 'text-black'}`}>{s.max}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500 font-mono border-l">{s.count}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold">{t('analysis.conformity')}</h3>
                {conformityData && (
                    <div className="flex space-x-8">
                        <div className="text-center">
                            <p className="text-sm text-gray-500 uppercase font-bold">{t('analysis.charts.pass')}</p>
                            <p className="text-2xl font-black text-green-600">{conformityData.pass}</p>
                        </div>
                        <div className="text-center border-l pl-8">
                            <p className="text-sm text-gray-500 uppercase font-bold">{t('analysis.charts.fail')}</p>
                            <p className="text-2xl font-black text-red-600">{conformityData.fail}</p>
                        </div>
                        <div className="text-center border-l pl-8">
                            <p className="text-sm text-gray-500 uppercase font-bold">TOTAL</p>
                            <p className="text-2xl font-black text-gray-800">{conformityData.total}</p>
                        </div>
                        <div className="text-center border-l pl-8">
                            <p className="text-sm text-gray-500 uppercase font-bold">% OK</p>
                            <p className="text-2xl font-black text-tamto-yellow">{((conformityData.pass / conformityData.total) * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                )}
            </div>

            {attributeStats.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                        <h3 className="text-lg font-bold text-tamto-grey">Estadísticas de Atributos</h3>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{attributeStats.length} Items</span>
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-16">#</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t('analysis.stats.characteristic')}</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-green-600 uppercase tracking-wider border-l">{t('analysis.charts.pass')} (OK)</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-red-600 uppercase tracking-wider border-l border-r">{t('analysis.charts.fail')} (NOT OK)</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">{t('analysis.stats.samples')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {attributeStats.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500">{s.cotaNumber}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-tamto-grey">{s.characteristic}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-green-700 bg-green-50/20 border-l">{s.ok} <span className="text-[10px] font-normal text-green-500 block uppercase">{s.okCrit}</span></td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-red-700 bg-red-50/20 border-l border-r">{s.nok} <span className="text-[10px] font-normal text-red-400 block uppercase">{s.nokCrit}</span></td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-500 font-mono italic">{s.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StatsDashboard;
