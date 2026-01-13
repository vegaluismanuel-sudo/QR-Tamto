import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useReport } from '../../contexts/ReportContext';
import { useLanguage } from '../../contexts/LanguageContext';

const WebReportView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { reportData: contextReportData, measurements: contextMeasurements } = useReport();
    const { language, t } = useLanguage();

    // Fallback to location state if context is empty
    const { reportData: stateReportData, measurements: stateMeasurements } = location.state || {};

    const reportData = stateReportData || contextReportData;
    const measurements = stateMeasurements || contextMeasurements;

    if (!reportData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8 no-print">
                <p className="text-xl text-red-600 mb-4">No report data found. Please generate a report from Data Capture.</p>
                <button onClick={() => navigate('/data-capture')} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
                    Go Back
                </button>
            </div>
        );
    }

    const chunk = (arr, size) => {
        const chunks = [];
        if (!arr) return chunks;
        for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
        return chunks;
    };

    const charChunks = chunk(measurements || [], 20);
    const totalSamplesCount = parseInt(reportData.sample_quantity) || (measurements && measurements[0]?.results?.length) || 0;
    const sampleIndices = Array.from({ length: totalSamplesCount }, (_, i) => i);
    const sampleChunks = chunk(sampleIndices, 10);
    const totalPages = charChunks.length * sampleChunks.length;

    const totalMeas = measurements?.length * totalSamplesCount || 0;
    let totalNok = 0;
    measurements?.forEach(m => {
        if (m.results) {
            const isAttribute = (m.data_type || '').toUpperCase().includes('ATR');
            const nokCriteria = (m.criteria_nok || '').toLowerCase().trim();
            const okCriteria = (m.criteria_ok || '').toLowerCase().trim();
            const min = parseFloat(m.min_value);
            const max = parseFloat(m.max_value);

            m.results.forEach(r => {
                const valRaw = (r || '').toString().toLowerCase().trim();
                let isNok = false;

                if (isAttribute) {
                    if (nokCriteria && valRaw === nokCriteria) isNok = true;
                    else if (okCriteria && valRaw && valRaw !== okCriteria) isNok = true;
                } else {
                    const valNum = parseFloat(r);
                    if (!isNaN(valNum) && (valNum < min || valNum > max)) isNok = true;
                }

                if (isNok) totalNok++;
            });
        }
    });
    const okRate = totalMeas > 0 ? ((totalMeas - totalNok) / totalMeas * 100).toFixed(1) : 100;

    return (
        <>
            <div className="bg-gray-800 min-h-screen py-8 flex flex-col items-center print:p-0 print:bg-white overflow-y-auto">
                <style>{`
                    @media print {
                        @page { 
                            size: letter landscape; 
                            margin: 0;
                        }
                        body { 
                            -webkit-print-color-adjust: exact; 
                            background: white !important; 
                            margin: 0 !important; 
                            padding: 0 !important;
                        }
                        .no-print { display: none !important; }
                        .report-page {
                            margin: 0 !important;
                            box-shadow: none !important;
                            break-after: page;
                            page-break-after: always;
                        }
                    }

                    .report-page {
                        width: 279.4mm;
                        height: 215.9mm;
                        background: white;
                        padding: 10mm;
                        margin-bottom: 2rem;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                        box-sizing: border-box;
                    }

                    /* Table styles matching PDF 6.3pt */
                    .print-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 6.3pt;
                        text-align: center;
                    }
                    .print-table th, .print-table td {
                        border: 0.1mm solid #d1d5db;
                        padding: 1mm 0.5mm;
                        vertical-align: middle;
                    }
                    .print-table th {
                        background-color: #f3f4f6;
                        font-weight: bold;
                    }
                    
                    .col-idx { width: 7mm; }
                    .col-type { width: 9mm; }
                    .col-char { width: 32mm; text-align: left; padding-left: 2mm !important; }
                    .col-val { width: 10mm; }
                    .col-crit { width: 12mm; }
                    .col-tool { width: 15mm; }
                    .col-toolid { width: 12mm; }
                    .col-obs { width: 25mm; text-align: left; padding-left: 2mm !important; }
                    .col-sample { width: 10mm; }

                    .nok-cell {
                        color: #ef4444 !important;
                        font-weight: bold !important;
                        background-color: #fff1f2 !important;
                    }
                `}</style>

                {/* Toolbar */}
                <div className="w-[279mm] flex justify-between items-center mb-6 no-print px-4">
                    <button onClick={() => navigate(-1)} className="bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 transition">
                        <ArrowLeft size={20} />
                    </button>

                    <div className="flex gap-4">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 bg-tamto-yellow text-tamto-black px-6 py-2.5 rounded shadow-xl hover:bg-yellow-400 font-black transition"
                        >
                            <Printer size={20} /> {t('actions.print') || 'Imprimir'}
                        </button>
                    </div>
                </div>

                {/* PAGES CONTAINER */}
                <div className="flex flex-col items-center">
                    {sampleChunks.map((currentSamples, sIdx) => (
                        charChunks.map((currentChars, cIdx) => {
                            const pageNumber = sIdx * charChunks.length + cIdx + 1;

                            return (
                                <div key={pageNumber} className="report-page">
                                    {/* Header Section */}
                                    <div className="flex justify-between items-start mb-1 pb-1 border-b-[1mm] border-tamto-yellow">
                                        <img src="/tamto_logo.png" alt="Logo" className="h-10 object-contain" />
                                        <div className="text-right">
                                            <h1 className="text-lg font-black text-gray-900 leading-none mb-0.5 uppercase">
                                                {language === 'es' ? 'REPORTE DE CALIDAD' : 'QUALITY REPORT'}
                                            </h1>
                                            <p className="text-[6pt] font-bold text-gray-600 uppercase leading-none">
                                                Industrial Tamto de Puebla S.A. de C.V.
                                            </p>
                                            <p className="text-[4pt] text-gray-400 font-mono mt-0.5">
                                                {new Date().toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Info Section */}
                                    <div className="flex gap-3 mb-2 pb-1 border-b border-gray-100">
                                        {/* Part Image */}
                                        <div className="w-48 h-28 border border-gray-200 bg-white p-1 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                                            {reportData.part_image_url || reportData.part_image_path ? (
                                                <img
                                                    src={reportData.part_image_url || (reportData.part_image_path?.startsWith('http') ? reportData.part_image_path : `http://localhost:3000${reportData.part_image_path}`)}
                                                    alt="Pieza"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="text-gray-300 text-[6pt] italic uppercase font-bold text-center">Sin Imagen de Pieza</div>
                                            )}
                                        </div>

                                        {/* Info Grid */}
                                        <div className="flex-grow grid grid-cols-4 gap-x-2 gap-y-0.5 mt-0.5">
                                            <CompactInfo label={t('generalInfo.partName')} value={reportData.part_name} />
                                            <CompactInfo label={t('generalInfo.partNumber')} value={reportData.part_number} />
                                            <CompactInfo label={t('generalInfo.version')} value={reportData.version} />
                                            <CompactInfo label={t('generalInfo.customer')} value={reportData.customer} />
                                            <CompactInfo label={t('generalInfo.machine')} value={reportData.machine} />
                                            <CompactInfo label={t('generalInfo.inspector')} value={reportData.inspector} />
                                            <CompactInfo label={t('generalInfo.provider')} value={reportData.provider} />
                                            <CompactInfo label={t('generalInfo.lotQty')} value={reportData.lot_quantity} />
                                            <CompactInfo label={t('generalInfo.sampleQty')} value={reportData.sample_quantity} />
                                            <CompactInfo label={t('generalInfo.traceability')} value={reportData.traceability} />
                                            <CompactInfo label={t('generalInfo.units')} value={reportData.units} />
                                            <CompactInfo label={t('generalInfo.reportType')} value={reportData.report_type} />
                                        </div>
                                    </div>

                                    {/* Table Section */}
                                    <div className="flex-grow overflow-hidden">
                                        <table className="print-table">
                                            <thead>
                                                <tr>
                                                    <th className="col-idx">#</th>
                                                    <th className="col-type">{language === 'es' ? 'TIPO' : 'TYPE'}</th>
                                                    <th className="col-char">{language === 'es' ? 'CARACT.' : 'CHAR.'}</th>
                                                    <th className="col-val">{language === 'es' ? 'MÍN.' : 'MIN'}</th>
                                                    <th className="col-val">NOMINAL</th>
                                                    <th className="col-val">{language === 'es' ? 'MÁX.' : 'MAX'}</th>
                                                    <th className="col-crit">CRIT. OK</th>
                                                    <th className="col-crit">CRIT. NOK</th>
                                                    <th className="col-tool">{language === 'es' ? 'HERR.' : 'TOOL'}</th>
                                                    <th className="col-toolid">ID</th>
                                                    <th className="col-obs">OBS.</th>
                                                    {currentSamples.map(idx => (
                                                        <th key={idx} className="col-sample bg-blue-50/50">
                                                            {language === 'es' ? 'M' : 'S'}{idx + 1}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentChars.map((m, mIdx) => (
                                                    <tr key={mIdx}>
                                                        <td className="col-idx font-bold text-gray-500">{m.cota_number}</td>
                                                        <td className="col-type text-gray-400">
                                                            {(m.data_type || 'VAR').substring(0, 3).toUpperCase()}
                                                        </td>
                                                        <td className="col-char font-bold text-gray-900 truncate">
                                                            {m.characteristic}
                                                        </td>
                                                        <td className="col-val">{m.min_value}</td>
                                                        <td className="col-val font-black text-blue-900 bg-blue-50/10">
                                                            {m.nominal_value}
                                                        </td>
                                                        <td className="col-val font-medium">{m.max_value}</td>
                                                        <td className="col-crit">{m.criteria_ok || '---'}</td>
                                                        <td className="col-crit">{m.criteria_nok || '---'}</td>
                                                        <td className="col-tool uppercase leading-tight">{m.tool}</td>
                                                        <td className="col-toolid font-mono">{m.tool_id}</td>
                                                        <td className="col-obs italic text-gray-500 truncate">{m.observations || '---'}</td>
                                                        {currentSamples.map(sIdx => {
                                                            const valRaw = m.results ? m.results[sIdx] : '';
                                                            const valNum = parseFloat(valRaw);
                                                            const min = parseFloat(m.min_value);
                                                            const max = parseFloat(m.max_value);

                                                            let isNok = false;
                                                            const isAttribute = (m.data_type || '').toUpperCase().includes('ATR');
                                                            if (isAttribute) {
                                                                const nokStr = (m.criteria_nok || '').toLowerCase().trim();
                                                                const okStr = (m.criteria_ok || '').toLowerCase().trim();
                                                                const curStr = (valRaw || '').toString().toLowerCase().trim();
                                                                if (nokStr && curStr === nokStr) isNok = true;
                                                                else if (okStr && curStr && curStr !== okStr) isNok = true;
                                                            } else {
                                                                if (!isNaN(valNum) && (valNum < min || valNum > max)) isNok = true;
                                                            }

                                                            return (
                                                                <td key={sIdx} className={`col-sample font-mono ${isNok ? 'nok-cell' : ''}`}>
                                                                    {valRaw}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                                {/* Padding rows to keep table size consistent if last chunk is small */}
                                                {currentChars.length < 20 && Array.from({ length: 20 - currentChars.length }).map((_, i) => (
                                                    <tr key={`pad-${i}`} className="opacity-0">
                                                        <td colSpan={11 + currentSamples.length}>&nbsp;</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination Footer */}
                                    <div className="mt-auto pt-2 text-[6pt] text-gray-400 flex justify-between items-center">
                                        <div className="font-black italic">
                                            APROBACIÓN TOTAL: {okRate}%
                                        </div>
                                        <div className="font-bold">
                                            PÁGINA {pageNumber} / {totalPages}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ))}
                </div>

                <div className="mt-4 text-gray-500 text-xs no-print text-center w-full italic">
                    * Vista optimizada para impresión exacta. 20 características y 10 muestras por página.
                </div>
            </div>
        </>
    );
};

const CompactInfo = ({ label, value }) => (
    <div className="flex flex-col border-b border-gray-100 py-0.5">
        <span className="text-[5.5pt] font-semibold text-tamto-yellow mb-0 tracking-tighter whitespace-nowrap lowercase first-letter:uppercase">{label}</span>
        <span className="text-[8.5pt] font-black text-gray-800 truncate tracking-tight uppercase leading-tight">{value || '---'}</span>
    </div>
);

export default WebReportView;
