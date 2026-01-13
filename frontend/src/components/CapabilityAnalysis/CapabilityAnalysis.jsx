import React, { useState, useMemo, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReport } from '../../contexts/ReportContext';
import { calculateCapability, calculateHistogram } from '../../utils/statistics';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { ChevronDown, Printer } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const CapabilityAnalysis = () => {
    const { t, language } = useLanguage();
    const { reportData, measurements } = useReport();
    const reportRef = useRef(null);

    // UI State
    const [selectedCotaId, setSelectedCotaId] = useState(measurements?.[0]?.id || null);
    const [indexType, setIndexType] = useState('CP'); // 'CP' or 'PP'

    const variableCotan = useMemo(() => {
        return (measurements || []).filter(m => (m.data_type || '').toUpperCase() === 'VARIABLE');
    }, [measurements]);

    const selectedCota = useMemo(() => {
        if (!selectedCotaId) return variableCotan[0];
        return variableCotan.find(m => m.id === parseInt(selectedCotaId)) || variableCotan[0];
    }, [variableCotan, selectedCotaId]);

    const stats = useMemo(() => {
        if (!selectedCota) return null;
        return calculateCapability(selectedCota.results, selectedCota.min_value, selectedCota.max_value, selectedCota.nominal_value);
    }, [selectedCota]);

    const { bins, normalCurve, plotMin, plotMax } = useMemo(() => {
        if (!selectedCota) return { bins: [], normalCurve: [] };
        return calculateHistogram(selectedCota.results, selectedCota.min_value, selectedCota.max_value, 12);
    }, [selectedCota]);

    // Vertical Lines Plugin for Histogram
    const verticalLinesPlugin = {
        id: 'verticalLines',
        afterDraw: (chart) => {
            const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
            const drawLine = (val, color, dash = []) => {
                const xPos = x.getPixelForValue(val);
                if (xPos === undefined || isNaN(xPos)) return;

                ctx.save();
                ctx.beginPath();
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = color;
                if (dash.length) ctx.setLineDash(dash);
                ctx.moveTo(xPos, top);
                ctx.lineTo(xPos, bottom);
                ctx.stroke();
                ctx.restore();
            };

            const USL = parseFloat(selectedCota?.max_value);
            const LSL = parseFloat(selectedCota?.min_value);
            const Nom = parseFloat(selectedCota?.nominal_value);

            if (!isNaN(LSL)) drawLine(LSL, '#060405');
            if (!isNaN(USL)) drawLine(USL, '#060405');
            if (!isNaN(Nom)) drawLine(Nom, '#FBCC00', [5, 5]);
        }
    };

    if (variableCotan.length === 0) {
        return <div className="p-6 text-gray-500">{t('analysis.noVariableData')}</div>;
    }

    const approvalPct = stats ? ((selectedCota.results.filter(r => {
        const v = parseFloat(r);
        return !isNaN(v) && v >= parseFloat(selectedCota.min_value) && v <= parseFloat(selectedCota.max_value);
    }).length / selectedCota.results.length) * 100).toFixed(0) : 0;

    const failedPct = 100 - approvalPct;

    // Unit and Precision Logic
    const isInches = (reportData.units || '').toLowerCase().includes('inch') || (reportData.units || '').toLowerCase() === 'pulgadas';
    const precision = isInches ? 4 : 3;

    // Horizontal Line Labels Plugin
    const horizontalLineLabelsPlugin = {
        id: 'horizontalLineLabels',
        afterDraw: (chart) => {
            const { ctx, chartArea: { right }, scales: { y } } = chart;
            ctx.save();
            ctx.font = 'bold 10px Arial'; // Slightly larger for better readability
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';

            const datasets = chart.data.datasets;
            const labelsSeen = new Set();

            datasets.forEach((dataset) => {
                if (['USL', 'LSL', 'Nominal', 'UCL', 'LCL'].includes(dataset.label)) {
                    const val = dataset.data[0];
                    if (val === undefined || val === null || isNaN(val)) return;

                    const yPos = y.getPixelForValue(val);
                    if (yPos < chart.chartArea.top || yPos > chart.chartArea.bottom) return;

                    // Avoid duplicate labels at same position
                    const posKey = Math.round(yPos);
                    if (labelsSeen.has(posKey)) return;
                    labelsSeen.add(posKey);

                    ctx.fillStyle = dataset.borderColor;
                    // Draw a small background for legibility
                    const text = `${dataset.label}: ${val.toFixed(precision)}`;
                    const textWidth = ctx.measureText(text).width;

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.fillRect(right + 2, yPos - 7, textWidth + 6, 14);

                    ctx.fillStyle = dataset.borderColor === 'black' ? '#000' : dataset.borderColor;
                    ctx.fillText(text, right + 4, yPos);
                }
            });
            ctx.restore();
        }
    };

    // Chart Data - Line Chart (Samples & Limits)
    const lineChartData = {
        labels: (selectedCota?.results || []).map((_, i) => i + 1),
        datasets: [
            {
                label: t('analysis.stats.samples'),
                data: selectedCota?.results?.map(v => parseFloat(v)),
                borderColor: '#060405', // Black
                backgroundColor: '#060405',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0,
                zIndex: 10
            },
            {
                label: 'USL',
                data: Array(selectedCota?.results?.length).fill(parseFloat(selectedCota?.max_value)),
                borderColor: 'black',
                borderWidth: 1,
                pointRadius: 0,
                fill: false,
                zIndex: 1
            },
            {
                label: 'LSL',
                data: Array(selectedCota?.results?.length).fill(parseFloat(selectedCota?.min_value)),
                borderColor: 'black',
                borderWidth: 1,
                pointRadius: 0,
                fill: false,
                zIndex: 1
            },
            {
                label: 'Nominal',
                data: Array(selectedCota?.results?.length).fill(parseFloat(selectedCota?.nominal_value)),
                borderColor: '#FBCC00', // Yellow
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                zIndex: 1
            },
            {
                label: 'UCL',
                data: Array(selectedCota?.results?.length).fill(stats?.ucl),
                borderColor: '#444',
                borderWidth: 1,
                borderDash: [3, 3],
                pointRadius: 0,
                fill: false,
                zIndex: 1
            },
            {
                label: 'LCL',
                data: Array(selectedCota?.results?.length).fill(stats?.lcl),
                borderColor: '#444',
                borderWidth: 1,
                borderDash: [3, 3],
                pointRadius: 0,
                fill: false,
                zIndex: 1
            }
        ]
    };

    const histogramData = {
        labels: bins.map(b => b.mid),
        datasets: [
            {
                type: 'line',
                label: t('analysis.charts.normalDistribution'),
                data: normalCurve,
                borderColor: '#454547', // Gray
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                zIndex: 10
            },
            {
                type: 'bar',
                label: t('analysis.charts.frequency'),
                data: bins.map(b => b.count),
                backgroundColor: '#FBCC00', // Yellow
                borderColor: '#060405',
                borderWidth: 1,
                barPercentage: 1.0,
                categoryPercentage: 1.0,
                zIndex: 1
            }
        ]
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans print:bg-white print:p-0 print:min-h-0">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page {
                        size: letter portrait;
                        margin: 10mm;
                    }
                    * {
                        box-sizing: border-box !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                    }
                    header, nav, footer, .no-print, [role="navigation"] {
                        display: none !important;
                    }
                    #root, #root > div, main, main > div {
                        background: white !important;
                        min-height: 0 !important;
                        height: auto !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: block !important;
                        position: static !important;
                    }
                    .print-report-container {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    .print-section {
                        width: 100% !important;
                        position: relative !important;
                        display: block !important;
                        clear: both !important;
                        page-break-inside: avoid !important;
                    }
                    .print-header-section {
                        height: 15mm !important;
                        margin-bottom: 5mm !important;
                    }
                    .print-info-section {
                        height: 25mm !important;
                        margin-bottom: 10mm !important;
                    }
                    .print-trend-section {
                        height: 70mm !important;
                        margin-bottom: 10mm !important;
                        padding-bottom: 5mm !important;
                    }
                    .print-bottom-section {
                        height: auto !important;
                        display: grid !important;
                        grid-template-columns: 1fr 1.2fr !important;
                        gap: 10mm !important;
                        align-items: start !important;
                    }
                    .print-stat-table {
                        width: 100% !important;
                    }
                    .print-histogram {
                        height: 60mm !important;
                        width: 100% !important;
                    }
                }
            ` }} />
            {/* Header / Selectors */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center no-print">
                <div className="flex gap-4">
                    <div className="relative">
                        <select
                            value={selectedCotaId}
                            onChange={(e) => setSelectedCotaId(e.target.value)}
                            className="appearance-none bg-white border border-gray-300 rounded px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-tamto-yellow font-bold text-gray-700 shadow-sm"
                        >
                            {variableCotan.map(m => (
                                <option key={m.id} value={m.id}>Cota {m.cota_number} - {m.characteristic}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    <div className="relative">
                        <select
                            value={indexType}
                            onChange={(e) => setIndexType(e.target.value)}
                            className="appearance-none bg-white border border-gray-300 rounded px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-tamto-yellow font-bold text-gray-700 shadow-sm"
                        >
                            <option value="CP">CP POTENCIAL</option>
                            <option value="PP">PP GLOBAL</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => window.print()} className="bg-tamto-yellow text-tamto-black px-6 py-2 rounded font-black shadow-lg hover:bg-yellow-400 transition flex items-center gap-2">
                        <Printer size={18} />
                        {t('actions.print')}
                    </button>
                </div>
            </div>

            {/* Main Report Container */}
            <div ref={reportRef} className="max-w-4xl mx-auto bg-white p-10 shadow-xl border border-gray-200 print:shadow-none print:border-none print:p-0 print:max-w-full print:w-full print-report-container">

                {/* Logo and Title */}
                <div className="flex justify-between items-start mb-8 print-section print-header-section border-b-2 border-gray-100 pb-4">
                    <img src="/tamto_logo.png" alt="Tamto Logo" className="h-16 print:h-10" />
                    <h1 className="text-2xl font-bold tracking-widest text-gray-800 uppercase mt-4 print:mt-2">CAPACITY INDICES</h1>
                </div>

                <div className="mb-10 print-section print-info-section">
                    <h2 className="text-center font-bold text-gray-400 uppercase tracking-widest text-xs border-b border-gray-200 mb-4 pb-1 print:hidden">{t('generalInfo.title')}</h2>
                    <div className="grid grid-cols-3 gap-x-12 gap-y-2 print:gap-x-8 print:text-[10px]">
                        {/* Group 1: Metadata */}
                        <div className="space-y-1.5">
                            <InfoRow label={t('generalInfo.date')} value={reportData.date} />
                            <InfoRow label={t('generalInfo.staff')} value={reportData.inspector || '—'} />
                            <InfoRow label={t('generalInfo.machine')} value={reportData.machine || '—'} />
                        </div>
                        {/* Group 2: Part Details */}
                        <div className="space-y-1.5">
                            <InfoRow label={t('generalInfo.partName')} value={reportData.part_name} />
                            <InfoRow label={t('generalInfo.partNumber')} value={reportData.part_number} />
                            <InfoRow label={t('generalInfo.cota')} value={selectedCota?.cota_number} highlighted />
                        </div>
                        {/* Group 3: Specifications & Measured Range */}
                        <div className="space-y-1.5">
                            <InfoRow label={t('generalInfo.characteristic')} value={selectedCota?.characteristic} />
                            <InfoRow label={t('generalInfo.specs')} value={`${selectedCota?.min_value || '—'} / ${selectedCota?.max_value || '—'}`} />
                            <InfoRow label={t('generalInfo.units')} value={t(`generalInfo.${reportData.units === 'mm' || reportData.units === 'millimeters' ? 'millimeters' : 'inches'}`)} />
                        </div>
                    </div>
                </div>

                {/* Line Chart - Trend - Full Width */}
                <div className="border border-gray-300 p-4 mb-8 h-80 print-section print-trend-section print:border-none print:p-0">
                    <Line
                        data={lineChartData}
                        plugins={[horizontalLineLabelsPlugin]}
                        options={{
                            maintainAspectRatio: false,
                            devicePixelRatio: 2,
                            layout: {
                                padding: {
                                    right: 100 // Increased space for labels
                                }
                            },
                            plugins: {
                                legend: { display: false },
                                tooltip: { enabled: true }
                            },
                            scales: {
                                x: {
                                    grid: { display: true, color: '#e5e7eb' },
                                    ticks: { font: { size: 10 } }
                                },
                                y: {
                                    grid: { display: true, color: '#e5e7eb' },
                                    ticks: { font: { size: 10 } }
                                }
                            }
                        }}
                    />
                </div>

                {/* Bottom Section: Stats & Histogram Side-by-Side in Print */}
                <div className="print-section print-bottom-section grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Statistical Table */}
                    <div className="print-stat-table">
                        <h2 className="text-center font-bold text-gray-400 uppercase tracking-widest text-xs border-b border-gray-200 mb-2 py-1 print:text-[10px]">{t('analysis.stats.summary')}</h2>
                        <div className="space-y-1 text-sm print:text-[10px]">
                            <div className="grid grid-cols-1 gap-1">
                                <InfoRow label={t('analysis.stats.approval')} value={`${approvalPct}%`} valueColor="text-green-500" />
                                <InfoRow label={t('analysis.stats.failed')} value={`${failedPct}%`} valueColor="text-red-500" />
                                <InfoRow label={t('analysis.stats.average')} value={stats?.mean?.toFixed(precision)} />
                                <InfoRow label={t('analysis.stats.maximum')} value={stats?.max?.toFixed(precision)} highlighted />
                                <InfoRow label={t('analysis.stats.minimum')} value={stats?.min?.toFixed(precision)} highlighted />
                                <InfoRow label={t('analysis.stats.samples')} value={selectedCota?.results?.length} />
                            </div>

                            <div className="mt-2 bg-orange-200 p-0.5 text-center font-bold text-gray-700 uppercase text-[9px]">
                                {indexType === 'CP' ? 'CP (Potencial)' : 'PP (Global)'}
                            </div>

                            <div className="grid grid-cols-1 gap-1">
                                {indexType === 'CP' ? (
                                    <>
                                        <InfoRow label="CP" value={stats?.cp?.toFixed(2)} valueColor="text-red-600" />
                                        <InfoRow label="CPK" value={stats?.cpk?.toFixed(2)} valueColor="text-red-600" />
                                        <InfoRow label="K (% Centering)" value={`${stats?.k?.toFixed(1)}%`} />
                                        <InfoRow label="CPM (Taguchi)" value={stats?.cpm?.toFixed(2)} />
                                        <InfoRow label="CPL" value={stats?.cpl?.toFixed(2)} />
                                        <InfoRow label="CPU" value={stats?.cpu?.toFixed(2)} />
                                    </>
                                ) : (
                                    <>
                                        <InfoRow label="PP" value={stats?.pp?.toFixed(2)} valueColor="text-red-600" />
                                        <InfoRow label="PPK" value={stats?.ppk?.toFixed(2)} valueColor="text-red-600" />
                                        <InfoRow label="K (% Centering)" value={`${stats?.k?.toFixed(1)}%`} />
                                        <InfoRow label="CPM (Taguchi)" value={stats?.cpm?.toFixed(2)} />
                                        <InfoRow label="PPL" value={stats?.ppl?.toFixed(2)} />
                                        <InfoRow label="PPU" value={stats?.ppu?.toFixed(2)} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Histogram */}
                    <div className="print-histogram border border-gray-300 p-4 print:border-none print:p-0">
                        <Bar
                            data={histogramData}
                            plugins={[verticalLinesPlugin]}
                            options={{
                                maintainAspectRatio: false,
                                devicePixelRatio: 2,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: { enabled: true }
                                },
                                scales: {
                                    x: {
                                        type: 'linear',
                                        grid: { display: false },
                                        min: plotMin,
                                        max: plotMax,
                                        ticks: {
                                            font: { size: 9 },
                                            callback: (val) => val.toFixed(precision)
                                        }
                                    },
                                    y: {
                                        beginAtZero: true,
                                        grid: { display: true, color: '#e5e7eb' },
                                        ticks: {
                                            stepSize: 1,
                                            font: { size: 9 }
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoRow = ({ label, value, highlighted = false, valueColor = "text-[#060405]" }) => (
    <div className={`flex justify-between border-b border-gray-100 py-1 transition-colors ${highlighted ? 'bg-[#FBCC00]/10 border-[#FBCC00]/20' : ''}`}>
        <span className="text-[11px] uppercase tracking-wider font-bold text-[#454547] print:text-[9px]">{label}</span>
        <span className={`text-[12px] font-black ${valueColor} print:text-[10px] ${highlighted ? 'text-[#060405]' : ''}`}>
            {value || '—'}
        </span>
    </div>
);

export default CapabilityAnalysis;
