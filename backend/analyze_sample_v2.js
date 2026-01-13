const ExcelJS = require('exceljs');
const path = require('path');

async function analyze() {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(path.join(__dirname, '../Muestra de Reporte.xlsx'));
        const ws = workbook.worksheets[0];

        console.log("--- Merges ---");
        // Try standard property
        try {
            console.log(ws.merges); // Might be object or undefined
        } catch (e) { console.log("Error reading merges"); }

        console.log("\n--- Rows 1-20 ---");
        ws.eachRow((row, number) => {
            if (number > 20) return;
            let rowStr = `R${number}: `;
            row.eachCell({ includeEmpty: true }, (cell, colNum) => {
                const v = cell.value;
                let txt = (typeof v === 'object') ? JSON.stringify(v) : v;
                rowStr += `[C${colNum}]:"${txt}" `;
            });
            console.log(rowStr);
        });

        console.log("--- Done ---");

    } catch (e) {
        console.error("Crash:", e);
    }
}
analyze();
