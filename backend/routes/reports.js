const express = require('express');
const router = express.Router();
const db = require('../db');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
// Export to Excel (replaces old CSV export)

// Export to Excel (replaces old CSV export)
// Export to Excel (replaces old CSV export)
// Direct GET Export (Bypasses UUID naming issues)
router.get('/export-xls-direct', async (req, res) => {
    let { rows, fileName, reportData, measurements } = req.query;
    try {
        if (typeof rows === 'string') try { rows = JSON.parse(rows); } catch (e) { }
        if (typeof reportData === 'string') try { reportData = JSON.parse(reportData); } catch (e) { }
        if (typeof measurements === 'string') try { measurements = JSON.parse(measurements); } catch (e) { }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Report');

        if (reportData && measurements) {
            // ... (Logo part same as POST)
            const logoPath = path.join(__dirname, '../frontend/public/tamto_logo.png');
            if (fs.existsSync(logoPath)) {
                const logoId = workbook.addImage({
                    buffer: fs.readFileSync(logoPath),
                    extension: 'png',
                });
                sheet.addImage(logoId, {
                    tl: { col: 0, row: 0 },
                    ext: { width: 150, height: 60 }
                });
            }

            sheet.mergeCells('D1:M1');
            const t1 = sheet.getCell('D1');
            t1.value = 'INDUSTRIAL TAMTO DE PUEBLA S.A. DE C.V.';
            t1.font = { name: 'Segoe UI', bold: true, size: 14, color: { argb: 'FF000000' } };
            t1.alignment = { horizontal: 'center', vertical: 'middle' };

            sheet.mergeCells('D2:M2');
            const t2 = sheet.getCell('D2');
            t2.value = 'REPORTE DE CALIDAD';
            t2.font = { name: 'Segoe UI', bold: true, size: 12, color: { argb: 'FF000000' } };
            t2.alignment = { horizontal: 'center', vertical: 'middle' };

            const setInfo = (row, label, value) => {
                const cLabel = sheet.getCell(row, 4);
                cLabel.value = label;
                cLabel.font = { name: 'Segoe UI', bold: true };
                const cValue = sheet.getCell(row, 6);
                cValue.value = value || '-';
                cValue.font = { name: 'Segoe UI' };
                cValue.alignment = { horizontal: 'left' };
            };

            setInfo(4, 'Nombre de la Parte', reportData.part_name);
            setInfo(5, 'Número de Parte', reportData.part_number);
            setInfo(6, 'Revisión', reportData.version);
            setInfo(7, 'Cliente', reportData.customer);
            setInfo(8, 'Máquina', reportData.machine);
            setInfo(9, 'Proveedor', reportData.provider);
            setInfo(10, 'Inspector', reportData.inspector);
            const dateObj = new Date(reportData.date);
            setInfo(11, 'Fecha', !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString() : reportData.date);

            const headerRowIdx = 13;
            const headers = ['#', 'Tipo de dato', 'Característica', 'Mín', 'Nominal', 'Máx'];
            let maxSamples = 0;
            if (measurements.length > 0 && measurements[0].results) maxSamples = measurements[0].results.length;
            if (measurements.length === 0 && reportData.sample_quantity) maxSamples = reportData.sample_quantity;
            for (let i = 0; i < maxSamples; i++) headers.push(`Muestra ${i + 1}`);

            const headerRow = sheet.getRow(headerRowIdx);
            headers.forEach((h, i) => {
                const cell = headerRow.getCell(i + 1);
                cell.value = h;
                cell.font = { name: 'Segoe UI', bold: true };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBCC00' } };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            measurements.forEach((m, idx) => {
                const r = headerRowIdx + 1 + idx;
                const row = sheet.getRow(r);
                row.getCell(1).value = m.cota_number || (idx + 1);
                row.getCell(2).value = m.data_type;
                row.getCell(3).value = m.characteristic;
                row.getCell(4).value = parseFloat(m.min_value);
                row.getCell(5).value = parseFloat(m.nominal_value);
                row.getCell(6).value = parseFloat(m.max_value);
                if (m.results) m.results.forEach((val, sIdx) => {
                    const cell = row.getCell(7 + sIdx);
                    cell.value = parseFloat(val);
                });
            });
            sheet.getColumn(1).width = 8;
            sheet.getColumn(2).width = 15;
            sheet.getColumn(3).width = 30;
        } else {
            if (typeof rows === 'string') {
                rows = JSON.parse(rows);
            }
            sheet.addRows(rows);
        }

        const buffer = await workbook.xlsx.writeBuffer();
        let downloadName = fileName || 'report.xlsx';
        if (downloadName.endsWith('.xls')) downloadName = downloadName.replace(/\.xls$/, '.xlsx');
        res.attachment(downloadName);
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error");
    }
});

router.post('/export-xls', async (req, res) => {
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    let { rows, fileName, reportData, measurements } = req.body;

    try {
        // Parse inputs if they come as JSON strings (from Form POST)
        if (typeof rows === 'string') try { rows = JSON.parse(rows); } catch (e) { }
        if (typeof reportData === 'string') try { reportData = JSON.parse(reportData); } catch (e) { }
        if (typeof measurements === 'string') try { measurements = JSON.parse(measurements); } catch (e) { }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Report');

        if (reportData && measurements) {
            // --- ADVANCED LAYOUT (Pixel Perfect) ---

            // 1. Logo (Top Left)
            const logoPath = path.join(__dirname, '../frontend/public/tamto_logo.png');
            if (fs.existsSync(logoPath)) {
                const logoId = workbook.addImage({
                    buffer: fs.readFileSync(logoPath),
                    extension: 'png',
                });
                sheet.addImage(logoId, {
                    tl: { col: 0, row: 0 }, // Integer anchor to prevent corruption
                    ext: { width: 150, height: 60 }
                });
            }

            // 2. Titles (Centered D1:M1, D2:M2)
            sheet.mergeCells('D1:M1');
            const t1 = sheet.getCell('D1');
            t1.value = 'INDUSTRIAL TAMTO DE PUEBLA S.A. DE C.V.';
            t1.font = { name: 'Segoe UI', bold: true, size: 14, color: { argb: 'FF000000' } };
            t1.alignment = { horizontal: 'center', vertical: 'middle' };

            sheet.mergeCells('D2:M2');
            const t2 = sheet.getCell('D2');
            t2.value = 'REPORTE DE CALIDAD';
            t2.font = { name: 'Segoe UI', bold: true, size: 12, color: { argb: 'FF000000' } };
            t2.alignment = { horizontal: 'center', vertical: 'middle' };

            // 3. General Info Grid (Starting Row 4)
            // Layout based on Sample: Label at Col D (4), Value at Col F (6)
            // And maybe Column H/J for 2nd column of info?
            // Let's create a helper to place pairs
            const setInfo = (row, label, value) => {
                const cLabel = sheet.getCell(row, 4); // D
                cLabel.value = label;
                cLabel.font = { name: 'Segoe UI', bold: true };

                const cValue = sheet.getCell(row, 6); // F
                cValue.value = value || '-';
                cValue.font = { name: 'Segoe UI' };
                cValue.alignment = { horizontal: 'left' };
            };

            // Mapping fields
            setInfo(4, 'Nombre de la Parte', reportData.part_name);
            setInfo(5, 'Número de Parte', reportData.part_number);
            setInfo(6, 'Revisión', reportData.version);
            setInfo(7, 'Cliente', reportData.customer);
            setInfo(8, 'Máquina', reportData.machine);
            setInfo(9, 'Proveedor', reportData.provider);
            setInfo(10, 'Inspector', reportData.inspector);

            const dateObj = new Date(reportData.date);
            setInfo(11, 'Fecha', !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString() : reportData.date);

            // 4. Measurements Table (Starts Row 13)
            const headerRowIdx = 13;
            const headers = ['#', 'Tipo de dato', 'Característica', 'Mín', 'Nominal', 'Máx'];
            // Add Samples headers dynamically?
            // Assuming measurements[0].results has samples
            let maxSamples = 0;
            if (measurements.length > 0 && measurements[0].results) {
                maxSamples = measurements[0].results.length;
            }
            if (measurements.length === 0 && reportData.sample_quantity) maxSamples = reportData.sample_quantity;

            for (let i = 0; i < maxSamples; i++) headers.push(`Muestra ${i + 1}`);

            // Write Header
            const headerRow = sheet.getRow(headerRowIdx);
            headers.forEach((h, i) => {
                const cell = headerRow.getCell(i + 1);
                cell.value = h;
                cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FF060405' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBCC00' } };
                cell.border = { top: { style: 'thin', color: { argb: 'FF454547' } }, left: { style: 'thin', color: { argb: 'FF454547' } }, bottom: { style: 'thin', color: { argb: 'FF454547' } }, right: { style: 'thin', color: { argb: 'FF454547' } } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });

            // Write Data Rows
            measurements.forEach((m, idx) => {
                const r = headerRowIdx + 1 + idx;
                const row = sheet.getRow(r);

                // Fixed cols
                row.getCell(1).value = m.cota_number || (idx + 1);
                row.getCell(2).value = m.data_type;
                row.getCell(3).value = m.characteristic;

                const minV = parseFloat(m.min_value);
                row.getCell(4).value = isNaN(minV) ? m.min_value : minV;

                const nomV = parseFloat(m.nominal_value);
                row.getCell(5).value = isNaN(nomV) ? m.nominal_value : nomV;

                const maxV = parseFloat(m.max_value);
                row.getCell(6).value = isNaN(maxV) ? m.max_value : maxV;

                // Samples
                if (m.results && Array.isArray(m.results)) {
                    m.results.forEach((val, sIdx) => {
                        const cell = row.getCell(7 + sIdx);
                        const v = parseFloat(val);
                        cell.value = isNaN(v) ? val : v;
                    });
                }
            });

            // 5. Styling & Formatting (Borders, Red Text, Widths)
            const borderStyle = { style: 'thin', color: { argb: 'FF454547' } };

            // Widths
            sheet.getColumn(1).width = 8;
            sheet.getColumn(2).width = 15;
            sheet.getColumn(3).width = 30;
            sheet.getColumn(4).width = 10;
            sheet.getColumn(5).width = 10;
            sheet.getColumn(6).width = 10;

            // Loop for Borders & Conditional Formatting
            const lastRowIdx = headerRowIdx + measurements.length;
            const lastColIdx = headers.length;

            for (let r = headerRowIdx; r <= lastRowIdx; r++) {
                const row = sheet.getRow(r);
                for (let c = 1; c <= lastColIdx; c++) {
                    const cell = row.getCell(c);
                    cell.font = { name: 'Segoe UI', size: 11, ...cell.font };

                    if (r > headerRowIdx) { // Data rows
                        cell.border = { top: borderStyle, left: borderStyle, bottom: borderStyle, right: borderStyle };
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };

                        // Conditional Formatting (Columns 7+) -> Samples
                        if (c >= 7) {
                            const minVal = parseFloat(row.getCell(4).value);
                            const maxVal = parseFloat(row.getCell(6).value);
                            const cellVal = parseFloat(cell.value);

                            if (!isNaN(minVal) && !isNaN(maxVal) && !isNaN(cellVal)) {
                                if (cellVal < minVal || cellVal > maxVal) {
                                    cell.font = { name: 'Segoe UI', size: 11, color: { argb: 'FFFF0000' } };
                                }
                            }
                            if (typeof cell.value === 'string' && (cell.value.toUpperCase().includes('NOK') || cell.value.toUpperCase().includes('NG'))) {
                                cell.font = { name: 'Segoe UI', size: 11, color: { argb: 'FFFF0000' } };
                            }
                        }
                    }
                }
            }

            // Freeze Panes
            sheet.views = [{ state: 'frozen', xSplit: 3, ySplit: headerRowIdx }];

        } else {
            // --- FALLBACK (Old logic for safety or other calls) ---
            if (typeof rows === 'string') {
                rows = JSON.parse(rows);
            }

            sheet.addRows(rows);

            // Styling Logic (from old implementation)
            let headerRowIdx = -1;

            // Find the "Measurements" Header Row (starts with '#')
            sheet.eachRow((row, rowNumber) => {
                const firstCell = row.getCell(1).value;
                if (firstCell && firstCell.toString().trim() === '#') {
                    headerRowIdx = rowNumber;
                }
            });

            if (headerRowIdx !== -1) {
                // Freeze Panes: Lock the first 3 columns (#, Data Type, Characteristic)
                // Note: In UI we locked 4 cols including "Del". "Del" is not exported.
                // So exported columns are: 1(#), 2(Type), 3(Char).
                sheet.views = [
                    { state: 'frozen', xSplit: 3, ySplit: 0 }
                ];

                // Header Style
                const headerRow = sheet.getRow(headerRowIdx);
                headerRow.font = { name: 'Segoe UI', bold: true, color: { argb: 'FF060405' } }; // Black Text
                headerRow.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFBCC00' } // Tamto Yellow
                };

                // Borders for the Table (Header down to end)
                const lastRowIdx = sheet.rowCount;
                const lastColIdx = headerRow.actualCellCount; // Use actual cells, not global

                // Define Border Style with color #454547
                const borderStyle = { style: 'thin', color: { argb: 'FF454547' } };

                for (let r = headerRowIdx; r <= lastRowIdx; r++) {
                    const row = sheet.getRow(r);
                    for (let c = 1; c <= lastColIdx; c++) {
                        const cell = row.getCell(c);
                        // Apply Segoe UI to data cells too
                        cell.font = { name: 'Segoe UI', size: 11, ...cell.font };

                        cell.border = {
                            top: borderStyle,
                            left: borderStyle,
                            bottom: borderStyle,
                            right: borderStyle
                        };
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };

                        // Conditional Formatting (Red Text for NOK)
                        if (r > headerRowIdx && c >= 12) { // Samples start at Col 12 (approx) -> Headers: #, Type, Char, Min, Nom, Max, CritOK, CritNOK, Tool, ToolId, Obs, Sample1...
                            // Actually let's verify column indices based on DataCapture.jsx
                            // Col 1:#, 2:Type, 3:Char, 4:Min, 5:Nom, 6:Max
                            // ... 11:Obs, 12:Sample1

                            const minVal = parseFloat(row.getCell(4).value);
                            const maxVal = parseFloat(row.getCell(6).value);
                            const cellVal = parseFloat(cell.value);

                            // Check Variable (numeric check)
                            if (!isNaN(minVal) && !isNaN(maxVal) && !isNaN(cellVal)) {
                                if (cellVal < minVal || cellVal > maxVal) {
                                    cell.font = { name: 'Segoe UI', size: 11, color: { argb: 'FFFF0000' } }; // Red
                                }
                            }
                            // Check Attribute (Text "NOK" or "NG"?)
                            // If cell value is string 'NOK' etc.
                            if (typeof cell.value === 'string' && (cell.value.toUpperCase().includes('NOK') || cell.value.toUpperCase().includes('NG'))) {
                                cell.font = { name: 'Segoe UI', size: 11, color: { argb: 'FFFF0000' } };
                            }
                        }
                    }
                }

                // Adjust Column Widths
                sheet.getColumn(1).width = 8;  // #
                sheet.getColumn(2).width = 15; // Type
                sheet.getColumn(3).width = 40; // Characteristic
                sheet.getColumn(4).width = 10; // Min
                sheet.getColumn(5).width = 10; // Nominal
                sheet.getColumn(6).width = 10; // Max
                // Samples auto width? Leave default or set approx 8
                for (let c = 7; c <= lastColIdx; c++) {
                    sheet.getColumn(c).width = 10;
                }
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        let downloadName = fileName || 'report.xlsx';
        if (downloadName.endsWith('.xls')) downloadName = downloadName.replace(/\.xls$/, '.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment(downloadName);
        res.send(buffer);

    } catch (error) {
        console.error("Export XLS Error:", error);
        res.status(500).send("Error generating Excel file");
    }
});

// Direct GET Download (Bypasses UUID naming issues in Chrome)
router.get('/download-pdf-direct', (req, res) => {
    try {
        const { pdfContent, fileName } = req.query;
        if (!pdfContent || !fileName) return res.status(400).send("Missing field");

        const base64Data = pdfContent.replace(/^data:.*?;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        res.attachment(fileName);
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

// Echo PDF to force download with correct filename
router.post('/download-pdf', (req, res) => {
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    console.log("[DEBUG] /download-pdf hit");
    try {
        const { pdfContent, fileName } = req.body;
        console.log(`[DEBUG] Received fileName: ${fileName}`);
        console.log(`[DEBUG] Received pdfContent type: ${typeof pdfContent}`);
        if (pdfContent) {
            console.log(`[DEBUG] Received pdfContent length: ${pdfContent.length}`);
            console.log(`[DEBUG] pdfContent start: ${pdfContent.substring(0, 100)}`);
        }

        if (!pdfContent || !fileName) {
            console.error("[ERROR] Missing pdfContent or fileName");
            return res.status(400).send("Missing field");
        }

        // Generic regex to strip ANY data URI scheme
        const base64Data = pdfContent.replace(/^data:.*?;base64,/, "");

        // Debug if stripping worked
        console.log(`[DEBUG] base64Data start: ${base64Data.substring(0, 50)}...`);

        const buffer = Buffer.from(base64Data, 'base64');
        console.log(`[DEBUG] Buffer created, length: ${buffer.length}`);

        res.attachment(fileName);
        res.send(buffer);
    } catch (error) {
        console.error("PDF Download Error:", error);
        res.status(500).send("Server Error"); // 12 bytes
    }
});

// GET all reports (summary for history)
router.get('/', (req, res) => {
    const sql = 'SELECT id, part_name, part_number, date, inspector, report_type FROM reports ORDER BY created_at DESC LIMIT 1000';
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET single report by ID (with measurements)
router.get('/:id', (req, res) => {
    const reportId = req.params.id;
    const sqlReport = 'SELECT * FROM reports WHERE id = ?';
    const sqlMeasurements = 'SELECT * FROM measurements WHERE report_id = ?';

    db.get(sqlReport, [reportId], (err, report) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!report) return res.status(404).json({ error: 'Report not found' });

        db.all(sqlMeasurements, [reportId], (err, measurements) => {
            if (err) return res.status(500).json({ error: err.message });
            // Parse results JSON for each measurement
            const parsedMeasurements = measurements.map(m => ({
                ...m,
                results: JSON.parse(m.results || '[]'),
                is_critical: !!m.is_critical // convert 0/1 to boolean
            }));
            res.json({ ...report, measurements: parsedMeasurements });
        });
    });
});

// POST create new report
router.post('/', (req, res) => {
    const {
        part_name, part_number, version, customer, machine, provider,
        date, traceability, inspector, lot_quantity, sample_quantity,
        report_type, units, part_image_path, measurements
    } = req.body;

    const sqlReport = `INSERT INTO reports (
    part_name, part_number, version, customer, machine, provider,
    date, traceability, inspector, lot_quantity, sample_quantity,
    report_type, units, part_image_path
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const paramsReport = [
        part_name, part_number, version, customer, machine, provider,
        date, traceability, inspector, lot_quantity, sample_quantity,
        report_type, units, part_image_path
    ];

    db.run(sqlReport, paramsReport, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        const reportId = this.lastID;

        if (measurements && measurements.length > 0) {
            const sqlMeasurement = `INSERT INTO measurements (
        report_id, cota_number, data_type, characteristic, is_critical,
        min_value, nominal_value, max_value, criteria_ok, criteria_nok,
        tool, tool_id, observations, results
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const stmt = db.prepare(sqlMeasurement);
            measurements.forEach(m => {
                stmt.run([
                    reportId, m.cota_number, m.data_type, m.characteristic, m.is_critical ? 1 : 0,
                    m.min_value, m.nominal_value, m.max_value, m.criteria_ok, m.criteria_nok,
                    m.tool, m.tool_id, m.observations, JSON.stringify(m.results)
                ]);
            });
            stmt.finalize();
        }

        res.status(201).json({ id: reportId, message: 'Report created successfully' });
    });
});

// PUT update report (full update for simplicity)
router.put('/:id', (req, res) => {
    // Implementation needed later if we support editing.
    // For now, let's focus on Creation.
    res.status(501).json({ message: 'Update not implemented yet' });
});

// DELETE report
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM reports WHERE id = ?', id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Report deleted', changes: this.changes });
    });
});

module.exports = router;
