import React, { useEffect, useState } from 'react';
import { getReports, getReportById, deleteReport } from '../../services/api';
import { useReport } from '../../contexts/ReportContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2 } from 'lucide-react';

const ReportHistory = () => {
    const [reports, setReports] = useState([]);
    const { loadReport } = useReport();
    const { t } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await getReports();
            setReports(data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const handleLoad = async (id) => {
        try {
            const data = await getReportById(id);
            loadReport(data);
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            alert('Error loading report');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('actions.confirmDelete'))) {
            try {
                await deleteReport(id);
                loadHistory();
            } catch (error) {
                console.error(error);
                alert('Error deleting report');
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black mb-6 text-[#060405] uppercase tracking-wider border-b-2 border-[#FBCC00] pb-2 inline-block">
                {t('modules.history')}
            </h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm text-left">
                    <thead className="text-[11px] font-bold text-[#454547] uppercase bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">{t('generalInfo.partName')}</th>
                            <th className="px-6 py-4">{t('generalInfo.partNumber')}</th>
                            <th className="px-6 py-4">{t('generalInfo.date')}</th>
                            <th className="px-6 py-4">{t('generalInfo.inspector')}</th>
                            <th className="px-6 py-4">{t('generalInfo.reportType')}</th>
                            <th className="px-6 py-4 text-center">{t('analysis.stats.characteristic')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {reports.map((report) => (
                            <tr key={report.id} className="bg-white hover:bg-gray-50/80 transition-colors">
                                <td className="px-6 py-4 font-mono text-gray-400">#{report.id}</td>
                                <td className="px-6 py-4 font-bold text-[#060405]">{report.part_name}</td>
                                <td className="px-6 py-4 text-gray-600 font-medium">{report.part_number}</td>
                                <td className="px-6 py-4 text-gray-500">{report.date}</td>
                                <td className="px-6 py-4 text-gray-500">{report.inspector}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-gray-100 text-[#454547] text-[10px] font-bold rounded uppercase">
                                        {report.report_type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center space-x-3">
                                        <button
                                            onClick={() => handleLoad(report.id)}
                                            className="group flex items-center px-3 py-1.5 bg-[#FBCC00] text-[#060405] font-bold rounded shadow-sm hover:bg-[#ebbf00] transition-all"
                                            title={t('actions.load')}
                                        >
                                            <FileText size={14} className="mr-1.5" />
                                            {t('actions.load')}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(report.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                            title={t('actions.delete')}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {reports.length === 0 && (
                    <div className="text-center py-12 bg-gray-50/50">
                        <p className="text-gray-400 font-medium italic">{t('modules.noReports')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportHistory;
