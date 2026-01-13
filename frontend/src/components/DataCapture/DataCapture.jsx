import React, { useState } from 'react';
import GeneralInfoForm from './GeneralInfoForm';
import MeasurementGrid from './MeasurementGrid';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReport } from '../../contexts/ReportContext';
import { saveReport, uploadImage } from '../../services/api';
import { Save, FileSpreadsheet, PlusCircle, Play, FileText, ClipboardCopy } from 'lucide-react';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';

const DataCapture = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    // Use Context instead of local state
    const { reportData, setReportData, measurements, setMeasurements, newReport } = useReport();
    const [saving, setSaving] = useState(false);

    const handleGeneralInfoChange = (name, value) => {
        setReportData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (file, previewUrl) => {
        if (!file) {
            setReportData(prev => ({ ...prev, part_image_file: null, part_image_url: null }));
            return;
        }
        setReportData(prev => ({ ...prev, part_image_file: file, part_image_url: previewUrl }));
    };

    const handleMeasurementsUpdate = (newMeasurements) => {
        setMeasurements(newMeasurements);
    };

    const handleNewReport = () => {
        if (confirm('Are you sure you want to clear current data?')) {
            newReport();
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let imagePath = reportData.part_image_path; // Keep existing if present
            if (reportData.part_image_file) {
                const uploadRes = await uploadImage(reportData.part_image_file);
                imagePath = uploadRes.filePath;
            }

            const payload = {
                ...reportData,
                part_image_path: imagePath,
                measurements: measurements.map(m => ({
                    ...m,
                }))
            };

            const res = await saveReport(payload);
            alert('Report Saved Successfully!');
        } catch (error) {
            console.error(error);
            alert('Error saving report');
        } finally {
            setSaving(false);
        }
    };

    const handleSimulate = () => {
        const existingInfo = { ...reportData, sample_quantity: 30 };
        const newRows = Array.from({ length: 50 }, (_, i) => {
            const nominal = 10 + Math.random() * 5;
            const tolerance = 0.5;
            const min = parseFloat((nominal - tolerance).toFixed(3));
            const max = parseFloat((nominal + tolerance).toFixed(3));

            const results = Array.from({ length: 30 }, () => {
                const isOk = Math.random() > 0.1;
                let val;
                if (isOk) {
                    val = min + Math.random() * (max - min);
                } else {
                    val = Math.random() > 0.5 ? max + Math.random() * 0.5 : min - Math.random() * 0.5;
                }
                return val.toFixed(3);
            });

            return {
                id: Date.now() + i,
                cota_number: i + 1,
                data_type: 'Variable',
                characteristic: `Dim ${i + 1}`,
                is_critical: Math.random() > 0.8,
                min_value: min.toString(),
                nominal_value: nominal.toFixed(3),
                max_value: max.toString(),
                criteria_ok: '',
                criteria_nok: '',
                tool: 'Caliper',
                tool_id: `T-${Math.floor(Math.random() * 100)}`,
                observations: '',
                results: results
            };
        });
        setReportData(existingInfo);
        setMeasurements(newRows);
    };


    const handleCopyToClipboard = async () => {
        try {
            // --- 1. PREPARE HTML CONTENT (FOR RICH PASTE) ---
            const generalFields = [
                { label: t('generalInfo.partName'), value: reportData.part_name },
                { label: t('generalInfo.partNumber'), value: reportData.part_number },
                { label: t('generalInfo.version'), value: reportData.revision || reportData.version },
                { label: t('generalInfo.customer'), value: reportData.customer },
                { label: t('generalInfo.date'), value: reportData.date },
                { label: t('generalInfo.inspector'), value: reportData.inspector },
                { label: t('generalInfo.lotQty'), value: reportData.lot_quantity },
                { label: t('generalInfo.sampleQty'), value: reportData.sample_quantity },
            ];

            let html = `
                <table style="border-collapse: collapse; font-family: Calibri, Arial, sans-serif;">
                    <tr><td colspan="4" style="font-size: 16pt; font-weight: bold; color: #000;">INDUSTRIAL TAMTO DE PUEBLA S.A. DE C.V.</td></tr>
                    <tr><td colspan="4" style="font-size: 14pt; font-weight: bold; color: #333;">REPORTE DE CALIDAD</td></tr>
                    <tr><td colspan="4">&nbsp;</td></tr>
            `;

            // Add general info in 2 columns
            for (let i = 0; i < generalFields.length; i += 2) {
                html += `<tr>
                    <td style="font-weight: bold; border: 1px solid #ddd; padding: 4px; background-color: #f2f2f2;">${generalFields[i].label}</td>
                    <td style="border: 1px solid #ddd; padding: 4px;">${generalFields[i].value || '-'}</td>
                    ${generalFields[i + 1] ? `
                        <td style="font-weight: bold; border: 1px solid #ddd; padding: 4px; background-color: #f2f2f2;">${generalFields[i + 1].label}</td>
                        <td style="border: 1px solid #ddd; padding: 4px;">${generalFields[i + 1].value || '-'}</td>
                    ` : '<td colspan="2"></td>'}
                </tr>`;
            }

            html += `<tr><td colspan="4">&nbsp;</td></tr></table>`;

            // Measurements Table
            const sampleCols = Array.from({ length: reportData.sample_quantity || 0 }, (_, i) => `Sample ${i + 1}`);
            const headers = [
                '#',
                t('grid.dataType'),
                t('grid.characteristic'),
                t('grid.min'),
                t('grid.nominal'),
                t('grid.max'),
                t('grid.criteriaOk'),
                t('grid.criteriaNok'),
                t('grid.tool'),
                t('grid.toolId'),
                t('grid.observations'),
                ...sampleCols
            ];

            html += `<table style="border-collapse: collapse; font-family: Calibri, Arial, sans-serif; border: 1px solid #444;"><thead><tr style="background-color: #FBCC00;">`;
            headers.forEach(h => {
                html += `<th style="border: 1px solid #444; padding: 4px; font-weight: bold;">${h}</th>`;
            });
            html += `</tr></thead><tbody>`;

            // Plain text TSV preparation (for fallback)
            let tsvRows = [headers.join('\t')];

            measurements.forEach(m => {
                const results = Array.isArray(m.results) ? m.results : [];
                let dataType = m.data_type || '';
                if (dataType.toLowerCase() === 'variable') dataType = t('grid.types.variable');
                else if (dataType.toLowerCase() === 'atributo' || dataType.toLowerCase() === 'attribute') dataType = t('grid.types.attribute');

                const minV = parseFloat(m.min_value);
                const maxV = parseFloat(m.max_value);

                html += `<tr>
                    <td style="border: 1px solid #444; padding: 4px; text-align: center;">${m.cota_number}</td>
                    <td style="border: 1px solid #444; padding: 4px;">${dataType}</td>
                    <td style="border: 1px solid #444; padding: 4px;">${m.characteristic}</td>
                    <td style="border: 1px solid #444; padding: 4px; text-align: center;">${m.min_value || ''}</td>
                    <td style="border: 1px solid #444; padding: 4px; text-align: center;">${m.nominal_value || ''}</td>
                    <td style="border: 1px solid #444; padding: 4px; text-align: center;">${m.max_value || ''}</td>
                    <td style="border: 1px solid #444; padding: 4px; text-align: center;">${m.criteria_ok || ''}</td>
                    <td style="border: 1px solid #444; padding: 4px; text-align: center;">${m.criteria_nok || ''}</td>
                    <td style="border: 1px solid #444; padding: 4px;">${m.tool || ''}</td>
                    <td style="border: 1px solid #444; padding: 4px;">${m.tool_id || ''}</td>
                    <td style="border: 1px solid #444; padding: 4px;">${m.observations || ''}</td>
                `;

                const tsvLine = [
                    m.cota_number,
                    dataType,
                    m.characteristic,
                    m.min_value,
                    m.nominal_value,
                    m.max_value,
                    m.criteria_ok || '',
                    m.criteria_nok || '',
                    m.tool || '',
                    m.tool_id || '',
                    m.observations || ''
                ];

                results.forEach(res => {
                    const val = parseFloat(res);
                    let colorStyle = "";
                    if (!isNaN(val) && !isNaN(minV) && !isNaN(maxV)) {
                        if (val < minV || val > maxV) {
                            colorStyle = "color: red; font-weight: bold;";
                        }
                    }
                    // Also check for "NOK" strings
                    if (typeof res === 'string' && (res.toUpperCase().includes('NOK') || res.toUpperCase().includes('NG'))) {
                        colorStyle = "color: red; font-weight: bold;";
                    }

                    html += `<td style="border: 1px solid #444; padding: 4px; text-align: center; ${colorStyle}">${res || ''}</td>`;
                    tsvLine.push(res);
                });

                html += `</tr>`;
                tsvRows.push(tsvLine.join('\t'));
            });

            html += `</tbody></table>`;

            // --- 2. WRITE TO CLIPBOARD ---
            const textContent = tsvRows.join('\n');
            const blobHtml = new Blob([html], { type: 'text/html' });
            const blobText = new Blob([textContent], { type: 'text/plain' });

            const data = [new ClipboardItem({
                'text/html': blobHtml,
                'text/plain': blobText
            })];

            await navigator.clipboard.write(data);
            alert('¡Reporte copiado con éxito! Ahora puedes pegar en Excel manteniendo los colores y encabezados.');

        } catch (error) {
            console.error(error);
            alert('Error al copiar al portapapeles. Inténtalo de nuevo.');
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-tamto-grey">{t('modules.dataCapture')}</h2>
                <div className="flex space-x-2">
                    <button onClick={handleNewReport} className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition">
                        <PlusCircle size={18} /> <span>{t('actions.new') || 'New'}</span>
                    </button>
                    <button onClick={handleSimulate} className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition">
                        <Play size={18} /> <span>Sim 50x30</span>
                    </button>
                    <button onClick={handleSave} disabled={saving} className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition">
                        <Save size={18} /> <span>{saving ? '...' : t('actions.save')}</span>
                    </button>
                    <button onClick={handleCopyToClipboard} className="flex items-center space-x-2 bg-teal-600 text-white px-3 py-2 rounded hover:bg-teal-700 transition">
                        <ClipboardCopy size={18} /> <span>{t('actions.copyToExcel') || 'Copiar a Excel'}</span>
                    </button>

                    <button
                        onClick={() => navigate('/report-view', { state: { reportData, measurements } })}
                        className="flex items-center space-x-2 bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700 transition"
                    >
                        <FileText size={18} /> <span>PDF / VER REPORTE</span>
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <GeneralInfoForm
                    data={reportData}
                    onChange={handleGeneralInfoChange}
                    onImageUpload={handleImageUpload}
                />

                <MeasurementGrid
                    measurements={measurements}
                    onUpdate={handleMeasurementsUpdate}
                    sampleQuantity={reportData.sample_quantity || 5}
                />
            </div>
        </div>
    );
};

export default DataCapture;
