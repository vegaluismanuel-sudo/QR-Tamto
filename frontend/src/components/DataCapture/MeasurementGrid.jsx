import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReport } from '../../contexts/ReportContext';
import { Plus, Trash } from 'lucide-react';

const MeasurementGrid = ({ measurements, onUpdate, sampleQuantity }) => {
    const { t } = useLanguage();
    const { reportData, updateReportInfo } = useReport();

    // Ref for table to handle focus custom navigation
    const tableRef = useRef(null);
    const tableContainerRef = useRef(null);

    // Initial Scroll Fix for RTL container with LTR content
    useLayoutEffect(() => {
        if (tableContainerRef.current) {
            // In RTL, scrollLeft 0 is usually the Right side.
            // We want to show the logical Start (Left side) of the LTR content.
            // Try to scroll to the "end" (negative or positive infinity depending on browser).
            tableContainerRef.current.scrollLeft = -9999;
            // Fallback for browsers using positive inverted coordinates
            if (tableContainerRef.current.scrollLeft === 0) {
                tableContainerRef.current.scrollLeft = 9999;
            }
        }
    }, []);

    const addRow = () => {
        const newRow = {
            id: Date.now(),
            cota_number: measurements.length + 1,
            data_type: 'Variable',
            characteristic: '',
            is_critical: false,
            min_value: '', nominal_value: '', max_value: '',
            criteria_ok: '', criteria_nok: '',
            tool: '', tool_id: '', observations: '',
            results: Array(sampleQuantity).fill('')
        };
        onUpdate([...measurements, newRow]);
    };

    const removeRow = (index) => {
        const newRows = [...measurements];
        newRows.splice(index, 1);
        onUpdate(newRows);
    };

    const updateRow = (index, field, value) => {
        const newRows = [...measurements];
        newRows[index] = { ...newRows[index], [field]: value };
        onUpdate(newRows);
    };

    const updateResult = (rowIndex, sampleIndex, value) => {
        const newRows = [...measurements];
        // Ensure results array structure matches quantity
        if (!newRows[rowIndex].results) newRows[rowIndex].results = [];
        // If array is shorter, pad it?
        // Actually results[sampleIndex] assignment handles it in JS (sparse array), but let's be safe.
        while (newRows[rowIndex].results.length < sampleQuantity) newRows[rowIndex].results.push('');

        const newResults = [...newRows[rowIndex].results];
        newResults[sampleIndex] = value;
        newRows[rowIndex].results = newResults;
        onUpdate(newRows);
    };

    const handleHeaderChange = (index, value) => {
        const newHeaders = [...(reportData.sample_headers || [])];
        // Ensure we have enough headers
        while (newHeaders.length <= index) newHeaders.push((newHeaders.length + 1).toString());
        newHeaders[index] = value;
        updateReportInfo('sample_headers', newHeaders);
    };

    const handleKeyDown = (e, rowIndex, colIndex) => {
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault();
            // Move to next row, same column
            const nextId = `cell-${rowIndex + 1}-${colIndex}`;
            const el = document.getElementById(nextId);
            if (el) el.focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevId = `cell-${rowIndex - 1}-${colIndex}`;
            const el = document.getElementById(prevId);
            if (el) el.focus();
        } else if (e.key === 'ArrowRight') {
            // Optional: Move right
        }
    };

    const getCellStatus = (row, value) => {
        if (value === '' || value === null || value === undefined) return '';

        if (row.data_type === 'Variable') {
            const numVal = parseFloat(value);
            if (isNaN(numVal)) return '';
            let fail = false;
            if (row.min_value !== '' && numVal < parseFloat(row.min_value)) fail = true;
            if (row.max_value !== '' && numVal > parseFloat(row.max_value)) fail = true;
            return fail ? 'text-red-600 font-bold bg-red-50' : 'text-green-600';
        } else if (row.data_type === 'Atributo') {
            if (value === row.criteria_nok) return 'text-red-600 font-bold bg-red-50';
            if (value === row.criteria_ok) return 'text-green-600';
            return '';
        }
        return '';
    };

    // Ensure headers exist
    const sampleHeaders = reportData.sample_headers || Array.from({ length: sampleQuantity }, (_, i) => (i + 1).toString());

    // Safety check
    if (!measurements) return <div>Loading...</div>;

    // Determine column visibility
    const hasCriteria = measurements.some(m => m.data_type === 'Atributo' || m.data_type === 'Referencia');

    return (
        <div className="bg-white p-4 rounded shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-tamto-grey">{t('grid.title')}</h3>
                <button onClick={addRow} className="flex items-center space-x-2 bg-tamto-yellow px-3 py-1 rounded font-bold text-sm hover:bg-yellow-400">
                    <Plus size={16} /> <span>{t('grid.cota') ? 'Add Row' : 'Add Row'}</span>
                </button>
            </div>

            <div
                className="overflow-y-auto overflow-x-auto max-h-[65vh] border rounded custom-scrollbar-left"
                ref={tableContainerRef}
                style={{ direction: 'rtl' }}
            >
                <table className="min-w-full border-collapse text-xs" style={{ direction: 'ltr' }}>
                    <thead>
                        <tr className="bg-gray-100 border-b">
                            <th className="p-2 border whitespace-nowrap sticky left-0 top-0 bg-gray-100 z-30 w-[40px] min-w-[40px] max-w-[40px]">#</th>
                            <th className="p-2 border whitespace-nowrap sticky left-[40px] top-0 bg-gray-100 z-30 w-[50px] min-w-[50px] max-w-[50px]">{t('actions.save') ? 'Del' : 'Del'}</th>
                            <th className="p-2 border whitespace-nowrap sticky left-[90px] top-0 bg-gray-100 z-30 w-[100px] min-w-[100px] max-w-[100px]">{t('grid.dataType')}</th>
                            <th className="p-2 border whitespace-nowrap sticky left-[190px] top-0 bg-gray-100 z-30 w-[200px] min-w-[200px] max-w-[200px]">{t('grid.characteristic')}</th>
                            <th className="p-2 border whitespace-nowrap w-10 sticky top-0 bg-gray-100 z-20">{t('grid.critical')}</th>
                            <th className="p-2 border whitespace-nowrap min-w-[60px] sticky top-0 bg-gray-100 z-20">{t('grid.min')}</th>
                            <th className="p-2 border whitespace-nowrap min-w-[60px] sticky top-0 bg-gray-100 z-20">{t('grid.nominal')}</th>
                            <th className="p-2 border whitespace-nowrap min-w-[60px] sticky top-0 bg-gray-100 z-20">{t('grid.max')}</th>

                            {/* Always Show Criteria (Before Tool) */}
                            <th className="p-2 border whitespace-nowrap min-w-[100px] sticky top-0 bg-gray-100 z-20">{t('grid.criteriaOk')}</th>
                            <th className="p-2 border whitespace-nowrap min-w-[100px] sticky top-0 bg-gray-100 z-20">{t('grid.criteriaNok')}</th>

                            {/* New Columns */}
                            <th className="p-2 border whitespace-nowrap min-w-[80px] sticky top-0 bg-gray-100 z-20">{t('grid.tool')}</th>
                            <th className="p-2 border whitespace-nowrap min-w-[80px] sticky top-0 bg-gray-100 z-20">{t('grid.toolId')}</th>
                            <th className="p-2 border whitespace-nowrap min-w-[120px] sticky top-0 bg-gray-100 z-20">{t('grid.observations')}</th>

                            {/* Sample Headers */}
                            {Array.from({ length: sampleQuantity }).map((_, i) => (
                                <th key={i} className="p-1 border whitespace-nowrap min-w-[60px] text-center sticky top-0 bg-gray-100 z-20">
                                    <input
                                        type="text"
                                        value={sampleHeaders[i] || ''}
                                        onChange={(e) => handleHeaderChange(i, e.target.value)}
                                        maxLength={25}
                                        className="w-full text-center bg-transparent border-0 font-bold focus:ring-0 text-xs p-0"
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {measurements.map((row, rIndex) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                                <td className="p-1 border sticky left-0 bg-white text-center font-bold z-10 w-[40px] min-w-[40px] max-w-[40px]">{row.cota_number}</td>
                                <td className="p-1 border sticky left-[40px] bg-white text-center z-10 w-[50px] min-w-[50px] max-w-[50px]">
                                    <button onClick={() => removeRow(rIndex)} className="text-red-500 hover:text-red-700">
                                        <Trash size={14} />
                                    </button>
                                </td>
                                <td className="p-1 border sticky left-[90px] bg-white z-10 w-[100px] min-w-[100px] max-w-[100px]">
                                    <select
                                        value={row.data_type}
                                        onChange={(e) => updateRow(rIndex, 'data_type', e.target.value)}
                                        className="w-full text-xs border-0 bg-transparent focus:ring-0 p-1"
                                    >
                                        <option value="Variable">{t('grid.types.variable')}</option>
                                        <option value="Atributo">{t('grid.types.attribute')}</option>
                                        <option value="Referencia">{t('grid.types.reference')}</option>
                                    </select>
                                </td>
                                <td className="p-1 border sticky left-[190px] bg-white z-10 w-[200px] min-w-[200px] max-w-[200px]">
                                    <input type="text" value={row.characteristic} onChange={(e) => updateRow(rIndex, 'characteristic', e.target.value)} maxLength={25} className="w-full text-xs border-0 bg-transparent focus:ring-0 p-1" />
                                </td>
                                <td className="p-1 border text-center">
                                    <input type="checkbox" checked={row.is_critical} onChange={(e) => updateRow(rIndex, 'is_critical', e.target.checked)} />
                                </td>

                                {/* Spec Fields */}
                                <td className="p-1 border">
                                    {row.data_type === 'Atributo' ? (
                                        <span className="text-gray-300 text-[10px] italic">N/A</span>
                                    ) : (
                                        <input
                                            type="number"
                                            value={row.min_value}
                                            onChange={(e) => updateRow(rIndex, 'min_value', e.target.value)}
                                            className="w-full text-xs border-0 bg-transparent focus:ring-0 p-1"
                                            placeholder="Min"
                                        />
                                    )}
                                </td>
                                <td className="p-1 border">
                                    <input
                                        type="number"
                                        value={row.nominal_value}
                                        onChange={(e) => updateRow(rIndex, 'nominal_value', e.target.value)}
                                        className={`w-full text-xs border-0 bg-transparent focus:ring-0 p-1 ${row.data_type === 'Atributo' ? 'bg-gray-100' : ''}`}
                                        disabled={row.data_type === 'Atributo'}
                                    />
                                </td>
                                <td className="p-1 border">
                                    {row.data_type === 'Atributo' ? (
                                        <span className="text-gray-300 text-[10px] italic">N/A</span>
                                    ) : (
                                        <input
                                            type="number"
                                            value={row.max_value}
                                            onChange={(e) => updateRow(rIndex, 'max_value', e.target.value)}
                                            className="w-full text-xs border-0 bg-transparent focus:ring-0 p-1"
                                            placeholder="Max"
                                        />
                                    )}
                                </td>

                                {/* Criteria Inputs (Before Tool) */}
                                <td className="p-1 border">
                                    <input
                                        type="text"
                                        value={row.criteria_ok}
                                        onChange={(e) => updateRow(rIndex, 'criteria_ok', e.target.value)}
                                        disabled={row.data_type !== 'Atributo' && row.data_type !== 'Referencia'}
                                        maxLength={25}
                                        className={`w-full text-xs border-0 bg-transparent focus:ring-0 p-1 ${row.data_type === 'Variable' ? 'bg-gray-100 text-transparent' : 'bg-yellow-50'}`}
                                    />
                                </td>
                                <td className="p-1 border">
                                    <input
                                        type="text"
                                        value={row.criteria_nok}
                                        onChange={(e) => updateRow(rIndex, 'criteria_nok', e.target.value)}
                                        disabled={row.data_type !== 'Atributo' && row.data_type !== 'Referencia'}
                                        maxLength={25}
                                        className={`w-full text-xs border-0 bg-transparent focus:ring-0 p-1 ${row.data_type === 'Variable' ? 'bg-gray-100 text-transparent' : 'bg-red-50'}`}
                                    />
                                </td>

                                {/* Tool, ID, Obs */}
                                <td className="p-1 border">
                                    <input type="text" value={row.tool} onChange={(e) => updateRow(rIndex, 'tool', e.target.value)} maxLength={25} className="w-full text-xs border-0 bg-transparent focus:ring-0 p-1" />
                                </td>
                                <td className="p-1 border">
                                    <input type="text" value={row.tool_id} onChange={(e) => updateRow(rIndex, 'tool_id', e.target.value)} maxLength={25} className="w-full text-xs border-0 bg-transparent focus:ring-0 p-1" />
                                </td>
                                <td className="p-1 border">
                                    <input type="text" value={row.observations} onChange={(e) => updateRow(rIndex, 'observations', e.target.value)} maxLength={25} className="w-full text-xs border-0 bg-transparent focus:ring-0 p-1" />
                                </td>

                                {/* Samples Inputs */}
                                {Array.from({ length: sampleQuantity }).map((_, sIndex) => (
                                    <td key={sIndex} className="p-1 border text-center">
                                        {row.data_type === 'Atributo' ? (
                                            <select
                                                value={row.results ? row.results[sIndex] || '' : ''}
                                                onChange={(e) => updateResult(rIndex, sIndex, e.target.value)}
                                                id={`cell-${rIndex}-${sIndex}`}
                                                onKeyDown={(e) => handleKeyDown(e, rIndex, sIndex)}
                                                className={`w-full text-xs border-0 focus:ring-0 p-1 h-6 ${getCellStatus(row, row.results ? row.results[sIndex] : '')}`}
                                            >
                                                <option value=""></option>
                                                {row.criteria_ok && <option value={row.criteria_ok}>{row.criteria_ok}</option>}
                                                {row.criteria_nok && <option value={row.criteria_nok}>{row.criteria_nok}</option>}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={row.results ? row.results[sIndex] || '' : ''}
                                                onChange={(e) => updateResult(rIndex, sIndex, e.target.value)}
                                                id={`cell-${rIndex}-${sIndex}`}
                                                onKeyDown={(e) => handleKeyDown(e, rIndex, sIndex)}
                                                maxLength={25}
                                                className={`w-full text-xs text-center border-0 focus:ring-0 focus:bg-blue-50 p-1 ${getCellStatus(row, row.results ? row.results[sIndex] : '')}`}
                                            />
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MeasurementGrid;
