const ExcelJS = require('exceljs');
const path = require('path');

async function analyze() {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(path.join(__dirname, '../Muestra de Reporte.xlsx'));
        const ws = workbook.worksheets[0];

        console.log("--- Merges ---");
        // Access merges safely. In ExcelJS 4.x check both places
        const merges = ws.model && ws.model.merges ? ws.model.merges : (ws._merges ? Object.keys(ws._merges) : []);
        console.log(merges);

        console.log("\n--- Column Widths (1-15) ---");
        for (let i = 1; i <= 15; i++) {
            const col = ws.getColumn(i);
            if (col.width) console.log(`Col ${i}: ${col.width}`);
        }

        console.log("\n--- Rows 1-25 ---");
        ws.eachRow((row, number) => {
            if (number > 25) return;
            let rowStr = `Row ${number} (H:${row.height}): `;
            row.eachCell({ includeEmpty: false }, (cell, colNum) => {
                let val = cell.value;
                if (typeof val === 'object') val = JSON.stringify(val);
                rowStr += `[${cell.address}]: "${val}"  `;
            });
            console.log(rowStr);
        });

        console.log("\n--- Images ---");
        const images = ws.getImages();
        console.log(`Count: ${images.length}`);
        images.forEach(img => {
            console.log(`Range: ${JSON.stringify(img.range)}`);
        });

    } catch (e) {
        console.error(e);
    }
}
analyze();
