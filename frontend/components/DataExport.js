import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useIntl } from 'react-intl';
import axios from 'axios';
import { FaDownload, FaFileExcel, FaFilePdf, FaFileAlt, FaSpinner } from 'react-icons/fa';

import { useAudio } from '../contexts/AudioContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DataExport({ district }) {
  const intl = useIntl();
  const { playAudio } = useAudio();
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportPeriod, setExportPeriod] = useState('12months');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch monthly data for export
  const { data: monthlyData } = useQuery(
    ['district-months', district.id, 24],
    async () => {
      const response = await axios.get(`${API_URL}/api/districts/${district.id}/months?limit=24`);
      return response.data.months;
    },
    {
      enabled: !!district.id,
      staleTime: 5 * 60 * 1000,
    }
  );

  const exportFormats = [
    { key: 'csv', label: 'CSV (Excel)', icon: FaFileExcel, description: 'Comma-separated values for Excel' },
    { key: 'json', label: 'JSON', icon: FaFileAlt, description: 'Machine-readable data format' },
    { key: 'pdf', label: 'PDF Report', icon: FaFilePdf, description: 'Formatted report document' },
  ];

  const exportPeriods = [
    { key: '6months', label: 'Last 6 Months', months: 6 },
    { key: '12months', label: 'Last 12 Months', months: 12 },
    { key: '24months', label: 'Last 24 Months', months: 24 },
    { key: 'all', label: 'All Available Data', months: null },
  ];

  const generateCSV = (data) => {
    const headers = [
      'Year',
      'Month',
      'Households Registered',
      'Households Work Provided',
      'Total Person Days',
      'Wages Paid (₹)',
      'Women Participation (%)',
      'Works Completed',
      'Works Ongoing',
      'Average Wage (₹)',
      'Source Date'
    ];

    const rows = data.map(item => [
      item.year,
      item.month,
      item.households_registered,
      item.households_work_provided,
      item.total_persondays,
      item.wages_paid,
      item.women_participation_pct,
      item.works_completed,
      item.works_ongoing,
      item.avg_wage,
      new Date(item.source_date).toLocaleDateString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const generateJSON = (data) => {
    const exportData = {
      district: {
        id: district.id,
        name: district.name,
        state: district.state_name
      },
      export_info: {
        generated_at: new Date().toISOString(),
        period: exportPeriods.find(p => p.key === exportPeriod)?.label,
        total_records: data.length,
        format: 'json'
      },
      data: data.map(item => ({
        year: item.year,
        month: item.month,
        date: `${item.year}-${String(item.month).padStart(2, '0')}-01`,
        metrics: {
          households_registered: item.households_registered,
          households_work_provided: item.households_work_provided,
          total_persondays: item.total_persondays,
          wages_paid: item.wages_paid,
          women_participation_pct: item.women_participation_pct,
          works_completed: item.works_completed,
          works_ongoing: item.works_ongoing,
          avg_wage: item.avg_wage
        },
        source_date: item.source_date
      }))
    };

    return JSON.stringify(exportData, null, 2);
  };

  const generatePDF = async (data) => {
    // For PDF generation, we'll create an HTML report and let the browser handle PDF conversion
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MGNREGA Report - ${district.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .district-name { font-size: 24px; font-weight: bold; color: #1f2937; }
            .report-info { color: #6b7280; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: right; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .summary { background-color: #f8fafc; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .metric { display: inline-block; margin: 10px 20px; text-align: center; }
            .metric-value { font-size: 18px; font-weight: bold; color: #3b82f6; }
            .metric-label { font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="district-name">${district.name} MGNREGA Performance Report</div>
            <div class="report-info">Generated on ${new Date().toLocaleDateString()}</div>
            <div class="report-info">Period: ${exportPeriods.find(p => p.key === exportPeriod)?.label}</div>
          </div>
          
          <div class="summary">
            <h3>Summary Statistics</h3>
            <div class="metric">
              <div class="metric-value">${data.reduce((sum, item) => sum + (item.households_work_provided || 0), 0).toLocaleString()}</div>
              <div class="metric-label">Total Households Provided Work</div>
            </div>
            <div class="metric">
              <div class="metric-value">${data.reduce((sum, item) => sum + (item.total_persondays || 0), 0).toLocaleString()}</div>
              <div class="metric-label">Total Person Days</div>
            </div>
            <div class="metric">
              <div class="metric-value">₹${(data.reduce((sum, item) => sum + (item.wages_paid || 0), 0) / 10000000).toFixed(1)}Cr</div>
              <div class="metric-label">Total Wages Paid</div>
            </div>
            <div class="metric">
              <div class="metric-value">${(data.reduce((sum, item) => sum + (item.women_participation_pct || 0), 0) / data.length).toFixed(1)}%</div>
              <div class="metric-label">Avg Women Participation</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Households Work</th>
                <th>Person Days</th>
                <th>Wages Paid (₹)</th>
                <th>Women %</th>
                <th>Works Completed</th>
                <th>Avg Wage (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  <td>${new Date(item.year, item.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                  <td>${(item.households_work_provided || 0).toLocaleString()}</td>
                  <td>${(item.total_persondays || 0).toLocaleString()}</td>
                  <td>${(item.wages_paid || 0).toLocaleString()}</td>
                  <td>${(item.women_participation_pct || 0).toFixed(1)}%</td>
                  <td>${item.works_completed || 0}</td>
                  <td>${(item.avg_wage || 0).toFixed(0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 40px; font-size: 12px; color: #6b7280; text-align: center;">
            Generated by MGNREGA LokDekho | Data source: data.gov.in
          </div>
        </body>
      </html>
    `;

    return htmlContent;
  };

  const handleExport = async () => {
    if (!monthlyData || monthlyData.length === 0) {
      playAudio('error');
      return;
    }

    setIsExporting(true);

    try {
      // Filter data based on selected period
      let filteredData = monthlyData;
      const selectedPeriod = exportPeriods.find(p => p.key === exportPeriod);
      
      if (selectedPeriod && selectedPeriod.months) {
        filteredData = monthlyData.slice(0, selectedPeriod.months);
      }

      let content, filename, mimeType;

      switch (exportFormat) {
        case 'csv':
          content = generateCSV(filteredData);
          filename = `${district.name.replace(/\s+/g, '_')}_MGNREGA_${exportPeriod}.csv`;
          mimeType = 'text/csv';
          break;

        case 'json':
          content = generateJSON(filteredData);
          filename = `${district.name.replace(/\s+/g, '_')}_MGNREGA_${exportPeriod}.json`;
          mimeType = 'application/json';
          break;

        case 'pdf':
          const htmlContent = await generatePDF(filteredData);
          // Create a new window for PDF generation
          const printWindow = window.open('', '_blank');
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          
          // Trigger print dialog
          setTimeout(() => {
            printWindow.print();
          }, 500);
          
          setIsExporting(false);
          playAudio('data_exported');
          return;

        default:
          throw new Error('Unsupported export format');
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      playAudio('data_exported');

    } catch (error) {
      console.error('Export failed:', error);
      playAudio('error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {intl.formatMessage({ id: 'export.title', defaultMessage: 'Export Data' })}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {intl.formatMessage({ id: 'export.subtitle', defaultMessage: 'Download district performance data' })}
          </p>
        </div>
        <FaDownload className="w-6 h-6 text-blue-600" />
      </div>

      <div className="space-y-6">
        {/* Export Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Export Format
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {exportFormats.map((format) => {
              const IconComponent = format.icon;
              return (
                <button
                  key={format.key}
                  onClick={() => setExportFormat(format.key)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    exportFormat === format.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <IconComponent className={`w-5 h-5 mr-2 ${
                      exportFormat === format.key ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <span className={`font-medium ${
                      exportFormat === format.key ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {format.label}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    exportFormat === format.key ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {format.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Period Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Time Period
          </label>
          <select
            value={exportPeriod}
            onChange={(e) => setExportPeriod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {exportPeriods.map((period) => (
              <option key={period.key} value={period.key}>
                {period.label}
              </option>
            ))}
          </select>
        </div>

        {/* Data Preview */}
        {monthlyData && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Data Preview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Records:</span>
                <span className="ml-2 font-medium">
                  {exportPeriods.find(p => p.key === exportPeriod)?.months 
                    ? Math.min(monthlyData.length, exportPeriods.find(p => p.key === exportPeriod).months)
                    : monthlyData.length
                  }
                </span>
              </div>
              <div>
                <span className="text-gray-600">Latest:</span>
                <span className="ml-2 font-medium">
                  {monthlyData[0] ? `${monthlyData[0].month}/${monthlyData[0].year}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">District:</span>
                <span className="ml-2 font-medium">{district.name}</span>
              </div>
              <div>
                <span className="text-gray-600">Format:</span>
                <span className="ml-2 font-medium uppercase">{exportFormat}</span>
              </div>
            </div>
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting || !monthlyData || monthlyData.length === 0}
          className="w-full btn btn-primary"
        >
          {isExporting ? (
            <>
              <FaSpinner className="animate-spin w-4 h-4 mr-2" />
              Generating {exportFormat.toUpperCase()}...
            </>
          ) : (
            <>
              <FaDownload className="w-4 h-4 mr-2" />
              Export {exportFormat.toUpperCase()} Report
            </>
          )}
        </button>

        {/* Help Text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• CSV files can be opened in Excel or Google Sheets</p>
          <p>• JSON format is suitable for developers and data analysis</p>
          <p>• PDF reports are formatted for printing and sharing</p>
          <p>• All data is sourced from official government APIs</p>
        </div>
      </div>
    </div>
  );
}