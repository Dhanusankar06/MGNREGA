import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { FaPlus, FaTimes, FaDownload, FaVolumeUp } from 'react-icons/fa';

import { ComparisonChart } from './Charts';
import LoadingSpinner from './LoadingSpinner';
import { useAudio } from '../contexts/AudioContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DistrictComparison({ currentDistrict }) {
  const { formatMessage } = useLanguage();
  const { playAudio } = useAudio();
  const [selectedDistricts, setSelectedDistricts] = useState([currentDistrict]);
  const [selectedMetric, setSelectedMetric] = useState('total_wages_paid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDistrict, setShowAddDistrict] = useState(false);

  // Fetch available districts for comparison
  const { data: allDistricts } = useQuery(
    'all-districts',
    async () => {
      const response = await axios.get(`${API_URL}/api/districts?limit=100`);
      return response.data.districts;
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Fetch comparison data
  const { data: comparisonData, isLoading, error } = useQuery(
    ['district-comparison', selectedDistricts.map(d => d.id).join(','), selectedMetric],
    async () => {
      if (selectedDistricts.length === 0) return null;
      
      const districtIds = selectedDistricts.map(d => d.id).join(',');
      const response = await axios.get(
        `${API_URL}/api/compare?district_ids=${districtIds}&metric=${selectedMetric}`
      );
      return response.data;
    },
    {
      enabled: selectedDistricts.length > 0,
      staleTime: 5 * 60 * 1000,
    }
  );

  const metrics = [
    { key: 'total_wages_paid', label: 'Total Wages Paid', unit: '₹' },
    { key: 'total_persondays', label: 'Total Person Days', unit: '' },
    { key: 'avg_households_registered', label: 'Average Households', unit: '' },
    { key: 'avg_women_participation', label: 'Women Participation %', unit: '%' },
  ];

  const filteredDistricts = allDistricts?.filter(district =>
    district.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedDistricts.find(selected => selected.id === district.id)
  ) || [];

  const addDistrict = (district) => {
    if (selectedDistricts.length < 5) {
      setSelectedDistricts([...selectedDistricts, district]);
      setShowAddDistrict(false);
      setSearchTerm('');
      
      playAudio('district_added', { district_name: district.name });
    }
  };

  const removeDistrict = (districtId) => {
    setSelectedDistricts(selectedDistricts.filter(d => d.id !== districtId));
  };

  const exportComparison = () => {
    if (!comparisonData) return;

    const csvContent = [
      ['District', 'Value', 'Metric', 'Period'],
      ...comparisonData.comparison.map(item => [
        item.name,
        item.avg_value,
        selectedMetric,
        comparisonData.period
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `district-comparison-${selectedMetric}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    playAudio('data_exported');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            जिला तुलना
          </h2>
          <p className="text-gray-600 mt-1">
            जिलों के बीच प्रदर्शन की तुलना करें
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => playAudio('comparison_help')}
            className="audio-btn"
            aria-label="Play comparison help"
          >
            <FaVolumeUp className="w-4 h-4" />
          </button>
          
          {comparisonData && (
            <button
              onClick={exportComparison}
              className="btn btn-secondary"
            >
              <FaDownload className="w-4 h-4 mr-2" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selected Districts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selected Districts ({selectedDistricts.length}/5)
            </label>
            <div className="space-y-2">
              {selectedDistricts.map((district) => (
                <div
                  key={district.id}
                  className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2"
                >
                  <span className="font-medium text-blue-900">{district.name}</span>
                  {selectedDistricts.length > 1 && (
                    <button
                      onClick={() => removeDistrict(district.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              {selectedDistricts.length < 5 && (
                <button
                  onClick={() => setShowAddDistrict(true)}
                  className="w-full flex items-center justify-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600"
                >
                  <FaPlus className="w-4 h-4 mr-2" />
                  Add District
                </button>
              )}
            </div>
          </div>

          {/* Metric Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Comparison Metric
            </label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {metrics.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add District Modal */}
        {showAddDistrict && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Add District</h4>
              <button
                onClick={() => setShowAddDistrict(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Search districts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredDistricts.slice(0, 10).map((district) => (
                <button
                  key={district.id}
                  onClick={() => addDistrict(district)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-700"
                >
                  {district.name}, {district.state_name}
                </button>
              ))}
              
              {filteredDistricts.length === 0 && searchTerm && (
                <div className="text-center py-4 text-gray-500">
                  No districts found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            Failed to load comparison data. Please try again.
          </div>
        </div>
      )}

      {comparisonData && (
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <ComparisonChart
              districts={comparisonData.comparison}
              metric={selectedMetric}
              title={metrics.find(m => m.key === selectedMetric)?.label}
            />
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Detailed Comparison
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      District
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Average Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Months
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {comparisonData.comparison.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {selectedMetric === 'total_wages_paid' 
                          ? `₹${(item.avg_value / 10000000).toFixed(1)}Cr`
                          : selectedMetric === 'avg_women_participation'
                          ? `${item.avg_value.toFixed(1)}%`
                          : item.avg_value.toLocaleString()
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {selectedMetric === 'total_wages_paid' 
                          ? `₹${(item.total_value / 10000000).toFixed(1)}Cr`
                          : selectedMetric === 'avg_women_participation'
                          ? `${item.total_value.toFixed(1)}%`
                          : item.total_value.toLocaleString()
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {item.months_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}