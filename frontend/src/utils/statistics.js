export const calculateStats = (rawData) => {
    // rawData might be array of strings or numbers
    const data = (rawData || [])
        .map(x => parseFloat(x))
        .filter(x => !isNaN(x));

    const n = data.length;
    if (n === 0) return { mean: 0, median: 0, mode: 0, stdDev: 0, range: 0, min: 0, max: 0, n: 0, count: 0 };

    const sum = data.reduce((a, b) => a + b, 0);
    const mean = parseFloat((sum / n).toFixed(4));

    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(n / 2);
    const median = n % 2 !== 0 ? sorted[mid] : parseFloat(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(4));

    const min = sorted[0];
    const max = sorted[n - 1];
    const range = parseFloat((max - min).toFixed(4));

    // Mode
    const frequency = {};
    let maxFreq = 0;
    let mode = sorted[0];
    data.forEach(x => {
        frequency[x] = (frequency[x] || 0) + 1;
        if (frequency[x] > maxFreq) {
            maxFreq = frequency[x];
            mode = x;
        }
    });

    // Std Dev (Sample)
    let stdDev = 0;
    if (n > 1) {
        const variance = data.reduce((total, num) => total + Math.pow(num - mean, 2), 0) / (n - 1);
        stdDev = parseFloat(Math.sqrt(variance).toFixed(4));
    }

    return {
        mean,
        median,
        mode,
        stdDev,
        range,
        min,
        max,
        n,
        count: n
    };
};

export const checkConformity = (value, min, max) => {
    const val = parseFloat(value);
    if (isNaN(val)) return true; // If no value, assume not failing yet? Or false? 
    // Usually if a sample is missing it's not "NOK" by itself, but better to skip.

    const hasMin = min !== '' && min !== null && min !== undefined;
    const hasMax = max !== '' && max !== null && max !== undefined;

    if (hasMin && val < parseFloat(min)) return false;
    if (hasMax && val > parseFloat(max)) return false;
    return true;
};

export const calculateConformitySummary = (measurements) => {
    let total = 0;
    let pass = 0;
    let fail = 0;

    (measurements || []).forEach(m => {
        const isAttribute = (m.data_type || '').toUpperCase().includes('ATR');
        const results = m.results || [];

        results.forEach(val => {
            total++;
            if (isAttribute) {
                const nokCriteria = (m.criteria_nok || '').toLowerCase().trim();
                const okCriteria = (m.criteria_ok || '').toLowerCase().trim();
                const currentVal = (val || '').toString().toLowerCase().trim();

                if (nokCriteria && currentVal === nokCriteria) fail++;
                else if (okCriteria && currentVal && currentVal !== okCriteria) fail++;
                else pass++;
            } else {
                if (checkConformity(val, m.min_value, m.max_value)) pass++;
                else fail++;
            }
        });
    });

    return { total, pass, fail };
};

// d2 constants for subgroup sizes 2 to 10
const D2_TABLE = {
    2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078
};

export const calculateCapability = (rawData, min, max, nominal, subgroupSize = 1) => {
    // rawData: all individual values flattened
    const data = (rawData || [])
        .map(x => parseFloat(x))
        .filter(x => !isNaN(x));

    const n = data.length;
    if (n === 0) return null;

    const stats = calculateStats(data);
    const mean = stats.mean;
    const stdDevOverall = stats.stdDev;

    let pp = 0, ppk = 0, ppu = 0, ppl = 0;
    const hasMin = min !== '' && min !== null && min !== undefined;
    const hasMax = max !== '' && max !== null && max !== undefined;
    const hasNominal = nominal !== '' && nominal !== null && nominal !== undefined;
    const USL = parseFloat(max);
    const LSL = parseFloat(min);
    const N = parseFloat(nominal);

    if (hasMax && hasMin) {
        pp = (USL - LSL) / (6 * stdDevOverall);
    }
    if (hasMax) {
        ppu = (USL - mean) / (3 * stdDevOverall);
    }
    if (hasMin) {
        ppl = (mean - LSL) / (3 * stdDevOverall);
    }

    if (hasMax && hasMin) ppk = Math.min(ppu, ppl);
    else if (hasMax) ppk = ppu;
    else if (hasMin) ppk = ppl;

    // K Index (Centering)
    let kIndex = 0;
    if (hasMax && hasMin && hasNominal) {
        kIndex = ((mean - N) / (0.5 * (USL - LSL))) * 100;
    }

    // Cpm Index (Taguchi)
    let cpm = 0;
    if (hasMax && hasMin && hasNominal) {
        const tau = Math.sqrt(Math.pow(stdDevOverall, 2) + Math.pow(mean - N, 2));
        cpm = (USL - LSL) / (6 * tau);
    }

    // Cp Indices
    let stdDevWithin = stdDevOverall;

    if (subgroupSize > 1 && subgroupSize <= 10) {
        const numGroups = Math.floor(n / subgroupSize);
        if (numGroups > 0) {
            let sumRanges = 0;
            for (let i = 0; i < numGroups; i++) {
                const chunk = data.slice(i * subgroupSize, (i + 1) * subgroupSize);
                const maxC = Math.max(...chunk);
                const minC = Math.min(...chunk);
                sumRanges += (maxC - minC);
            }
            const rBar = sumRanges / numGroups;
            const d2 = D2_TABLE[subgroupSize];
            if (d2) stdDevWithin = rBar / d2;
        }
    } else if (subgroupSize === 1 && n > 1) {
        let sumMR = 0;
        for (let i = 1; i < n; i++) {
            sumMR += Math.abs(data[i] - data[i - 1]);
        }
        const mrBar = sumMR / (n - 1);
        stdDevWithin = mrBar / 1.128; // d2 for n=2
    }

    let cp = 0, cpk = 0, cpu = 0, cpl = 0;

    if (hasMax && hasMin) {
        cp = (USL - LSL) / (6 * stdDevWithin);
    }
    if (hasMax) {
        cpu = (USL - mean) / (3 * stdDevWithin);
    }
    if (hasMin) {
        cpl = (mean - LSL) / (3 * stdDevWithin);
    }

    if (hasMax && hasMin) cpk = Math.min(cpu, cpl);
    else if (hasMax) cpk = cpu;
    else if (hasMin) cpk = cpl;

    // Custom Control Limits (as requested by user)
    let ucl = 0, lcl = 0;
    if (hasMax && hasMin) {
        const tolerance = USL - LSL;
        ucl = USL - (tolerance / 6);
        lcl = LSL + (tolerance / 6);
    }

    const round = (val) => parseFloat((val || 0).toFixed(4));

    return {
        pp: round(pp),
        ppk: round(ppk),
        ppl: round(ppl),
        ppu: round(ppu),
        cp: round(cp),
        cpk: round(cpk),
        cpl: round(cpl),
        cpu: round(cpu),
        k: round(kIndex),
        cpm: round(cpm),
        ucl: round(ucl),
        lcl: round(lcl),
        mean: round(mean),
        stdDevOverall: round(stdDevOverall),
        stdDevWithin: round(stdDevWithin),
        min: round(stats.min),
        max: round(stats.max)
    };
};

export const calculateHistogram = (rawData, min, max, numBins = 8) => {
    const data = (rawData || [])
        .map(x => parseFloat(x))
        .filter(x => !isNaN(x))
        .sort((a, b) => a - b);

    if (data.length === 0) return { bins: [], normalCurve: [] };

    const USL = parseFloat(max);
    const LSL = parseFloat(min);
    const n = data.length;

    // Standard SPC Histogram logic:
    // We want to cover LSL and USL and some margin
    const stats = calculateStats(data);
    const mean = stats.mean;
    const stdDev = stats.stdDev;

    // Use LSL/USL as references for the range if available
    const hasSpecs = !isNaN(LSL) && !isNaN(USL);
    const rangeStart = hasSpecs ? Math.min(LSL, stats.min) : stats.min;
    const rangeEnd = hasSpecs ? Math.max(USL, stats.max) : stats.max;
    const padding = (rangeEnd - rangeStart) * 0.1;

    const plotMin = rangeStart - padding;
    const plotMax = rangeEnd + padding;
    const plotRange = plotMax - plotMin;
    const binSize = plotRange / numBins;

    const bins = [];
    const normalCurve = [];

    for (let i = 0; i < numBins; i++) {
        const start = plotMin + (i * binSize);
        const end = plotMin + ((i + 1) * binSize);
        const mid = (start + end) / 2;

        const count = data.filter(x => x >= start && x < (i === numBins - 1 ? end + 0.00001 : end)).length;

        // Normal Distribution Value (scaled to frequency)
        // Frequency = N * BinSize * PDF(x)
        const z = (mid - mean) / stdDev;
        const pdf = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
        const normalVal = n * binSize * pdf;

        bins.push({
            label: `${start.toFixed(3)}-${end.toFixed(3)}`,
            count,
            mid
        });

        normalCurve.push(normalVal);
    }

    return { bins, normalCurve, plotMin, plotMax, binSize };
};
