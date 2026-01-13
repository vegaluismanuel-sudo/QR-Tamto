import React, { createContext, useState, useContext } from 'react';

const ReportContext = createContext();

export const ReportProvider = ({ children }) => {
    const [reportData, setReportData] = useState({
        part_name: '', part_number: '', version: '', customer: '', machine: '', provider: '',
        date: new Date().toISOString().split('T')[0], traceability: '', inspector: '',
        lot_quantity: 0, sample_quantity: 30, report_type: '', units: 'inches',
        part_image_url: null, part_image_file: null,
        sample_headers: Array.from({ length: 30 }, (_, i) => (i + 1).toString()) // Default headers
    });

    const [measurements, setMeasurements] = useState([]);

    // Clear report for New
    const newReport = () => {
        setReportData({
            part_name: '', part_number: '', version: '', customer: '', machine: '', provider: '',
            date: new Date().toISOString().split('T')[0], traceability: '', inspector: '',
            lot_quantity: 0, sample_quantity: 30, report_type: '', units: 'inches',
            part_image_url: null, part_image_file: null,
            sample_headers: Array.from({ length: 30 }, (_, i) => (i + 1).toString())
        });
        setMeasurements([]);
    };

    const loadReport = (data) => {
        const { measurements: loadedMeasurements, ...info } = data;
        if (info.part_image_path) {
            info.part_image_url = `http://localhost:3000${info.part_image_path}`;
        }
        // Ensure sample_headers exists, if legacy report didn't have it
        if (!info.sample_headers || info.sample_headers.length === 0) {
            info.sample_headers = Array.from({ length: info.sample_quantity || 5 }, (_, i) => (i + 1).toString());
        }
        setReportData(info);
        setMeasurements(loadedMeasurements || []);
    };

    const updateReportInfo = (name, value) => {
        setReportData(prev => {
            const newData = { ...prev, [name]: value };
            // If sample_quantity changes, resize headers
            if (name === 'sample_quantity') {
                const newQty = parseInt(value) || 0;
                const oldHeaders = prev.sample_headers || [];
                if (newQty > oldHeaders.length) {
                    const added = Array.from({ length: newQty - oldHeaders.length }, (_, i) => (oldHeaders.length + i + 1).toString());
                    newData.sample_headers = [...oldHeaders, ...added];
                } else if (newQty < oldHeaders.length) {
                    newData.sample_headers = oldHeaders.slice(0, newQty);
                }
            }
            return newData;
        });
    };

    return (
        <ReportContext.Provider value={{
            reportData,
            setReportData, // expose full setter if needed
            updateReportInfo,
            measurements,
            setMeasurements,
            newReport,
            loadReport
        }}>
            {children}
        </ReportContext.Provider>
    );
};

export const useReport = () => useContext(ReportContext);
