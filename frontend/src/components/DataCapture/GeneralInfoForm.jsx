import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Upload } from 'lucide-react';

const GeneralInfoForm = ({ data, onChange, onImageUpload }) => {
    const { t } = useLanguage();

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Auto-convert numeric fields
        if (name === 'lot_quantity' || name === 'sample_quantity') {
            onChange(name, parseInt(value) || 0);
        } else {
            onChange(name, value);
        }
    };

    const handleImageChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Create a local preview URL
            const previewUrl = URL.createObjectURL(file);
            // Notify parent to handle upload to server
            onImageUpload(file, previewUrl);
        }
    };

    return (
        <div className="bg-white p-6 rounded shadow mb-6">
            <h2 className="text-xl font-bold mb-4 border-b pb-2 text-tamto-yellow uppercase tracking-wide">
                {t('generalInfo.title')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
                {/* Row 1 */}
                <div className="col-span-1">
                    <label className="block font-medium text-gray-700">{t('generalInfo.partName')}</label>
                    <input type="text" name="part_name" value={data.part_name} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 bg-gray-50 border p-1 focus:border-tamto-yellow focus:ring-tamto-yellow" />
                </div>
                <div className="col-span-1">
                    <label className="block font-medium text-gray-700">{t('generalInfo.partNumber')}</label>
                    <input type="text" name="part_number" value={data.part_number} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 bg-gray-50 border p-1 focus:border-tamto-yellow focus:ring-tamto-yellow" />
                </div>
                <div className="col-span-1">
                    <label className="block font-medium text-gray-700">{t('generalInfo.version')}</label>
                    <input type="text" name="version" value={data.version} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 bg-gray-50 border p-1 focus:border-tamto-yellow focus:ring-tamto-yellow" />
                </div>
                <div className="col-span-1">
                    <label className="block font-medium text-gray-700">{t('generalInfo.date')}</label>
                    <input type="date" name="date" value={data.date} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 bg-gray-50 border p-1 focus:border-tamto-yellow focus:ring-tamto-yellow" />
                </div>
                <div className="col-span-1">
                    <label className="block font-medium text-gray-700">{t('generalInfo.reportType')}</label>
                    <input type="text" name="report_type" value={data.report_type} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 bg-gray-50 border p-1 focus:border-tamto-yellow focus:ring-tamto-yellow" />
                </div>

                {/* Row 2 */}
                <div className="col-span-1">
                    <label className="block font-medium text-gray-700">{t('generalInfo.customer')}</label>
                    <input type="text" name="customer" value={data.customer} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 bg-gray-50 border p-1 focus:border-tamto-yellow focus:ring-tamto-yellow" />
                </div>
                <div className="col-span-1">
                    <label className="block font-medium text-gray-700">{t('generalInfo.machine')}</label>
                    <input type="text" name="machine" value={data.machine} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 bg-gray-50 border p-1 focus:border-tamto-yellow focus:ring-tamto-yellow" />
                </div>
                <div className="col-span-1">
                    <label className="block font-medium text-gray-700">{t('generalInfo.provider')}</label>
                    <input type="text" name="provider" value={data.provider} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 bg-gray-50 border p-1 focus:border-tamto-yellow focus:ring-tamto-yellow" />
                </div>
                <div className="col-span-1">
                    <label className="block font-medium text-gray-700">{t('generalInfo.traceability')}</label>
                    <input type="text" name="traceability" value={data.traceability} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 bg-gray-50 border p-1 focus:border-tamto-yellow focus:ring-tamto-yellow" />
                </div>
                <div className="col-span-1">
                    <label className="block font-medium text-gray-700">{t('generalInfo.inspector')}</label>
                    <input type="text" name="inspector" value={data.inspector} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 bg-gray-50 border p-1 focus:border-tamto-yellow focus:ring-tamto-yellow" />
                </div>

                {/* Row 3 */}
                <div className="col-span-1">
                    <label className="block font-medium text-gray-700">{t('generalInfo.lotQty')}</label>
                    <input type="number" name="lot_quantity" value={data.lot_quantity} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 bg-gray-50 border p-1 focus:border-tamto-yellow focus:ring-tamto-yellow" />
                </div>
                <div className="col-span-1">
                    <label className="block font-medium text-gray-700">{t('generalInfo.sampleQty')}</label>
                    <input type="number" name="sample_quantity" value={data.sample_quantity} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 bg-gray-50 border p-1 focus:border-tamto-yellow focus:ring-tamto-yellow" />
                </div>
                <div className="col-span-1">
                    <label className="block font-medium text-gray-700">{t('generalInfo.units')}</label>
                    <select name="units" value={data.units} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 bg-gray-50 border p-1 focus:border-tamto-yellow focus:ring-tamto-yellow">
                        <option value="">Select Units</option>
                        <option value="inches">{t('generalInfo.inches')}</option>
                        <option value="millimeters">{t('generalInfo.millimeters')}</option>
                    </select>
                </div>

                <div className="col-span-2 row-span-2 flex items-center justify-end">
                    {/* Image Preview Compact */}
                    <div className="flex items-center space-x-2 border p-1 rounded bg-gray-50 w-full justify-center h-full">
                        {data.part_image_url ? (
                            <div className="relative h-full flex items-center">
                                <img src={data.part_image_url} alt="Part" className="max-h-20 w-auto rounded" />
                                <button type="button" className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 text-[10px]" onClick={() => onImageUpload(null, null)}>X</button>
                            </div>
                        ) : (
                            <label className="cursor-pointer flex flex-col items-center justify-center text-gray-400 hover:text-tamto-yellow p-2">
                                <Upload size={16} />
                                <span className="text-[10px]">Img</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralInfoForm;
