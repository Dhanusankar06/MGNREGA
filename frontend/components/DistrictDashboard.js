import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

import MetricCard from './MetricCard';
import { TimeSeriesChart, MonthlyTrendSummary } from './Charts';
import DistrictComparison from './DistrictComparison';
import DataExport from './DataExport';
import { useAudio } from '../contexts/AudioContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DistrictDashboard({ district, onChangeDistrict }) {
  const { formatMessage } = useLanguage();
  const { playAudio } = useAudio();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch district summary data
  const { data: summary, isLoading, error, refetch } = useQuery(
    ['district-summary', district.id],
    async () => {
      const response = await axios.get(`${API_URL}/api/districts/${district.id}/summary`);
      return response.data;
    },
    {
      enabled: !!district.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    }
  );

  // Fetch monthly data for charts
  const { data: monthlyData } = useQuery(
    ['district-months', district.id],
    async () => {
      const response = await axios.get(`${API_URL}/api/districts/${district.id}/months?limit=12`);
      return response.data.months;
    },
    {
      enabled: !!district.id,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Handle refresh data from live API
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      // Call the refresh endpoint
      const response = await axios.post(`${API_URL}/api/districts/${district.id}/refresh`);
      
      if (response.data.success) {
        // Refetch the data to show updated values
        await refetch();
        
        // Play success audio
        playAudio('data_refreshed', {
          district_name: district.name,
          records_updated: response.data.records_updated
        });
        
        // Show success message (you could add a toast notification here)
        console.log(`✅ Successfully refreshed ${response.data.records_updated} records for ${district.name}`);
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
      playAudio('error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format numbers for display
  const formatNumber = (num, unit = '') => {
    if (!num) return '0';
    
    if (num >= 10000000) {
      return `${(num / 10000000).toFixed(1)}Cr${unit}`;
    } else if (num >= 100000) {
      return `${(num / 100000).toFixed(1)}L${unit}`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K${unit}`;
    }
    return `${num}${unit}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="card max-w-md mx-auto">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {intl.formatMessage({ id: 'error.data_load' })}
          </h3>
          <p className="text-gray-600 mb-4">
            {intl.formatMessage({ id: 'error.network' })}
          </p>
          <button onClick={onChangeDistrict} className="btn-primary">
            {intl.formatMessage({ id: 'dashboard.change_district' })}
          </button>
        </div>
      </div>
    );
  }

  const {
    district: districtInfo = {},
    summary: summaryData = {},
    latestMonth = {},
    yearAgoComparison = {}
  } = summary || {};

  const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const changeTypeOf = (v) => (v > 0 ? 'positive' : v < 0 ? 'negative' : 'neutral');

  const householdsChange = toNumber(yearAgoComparison?.households_registered_change ?? 0);
  const wagesChange = toNumber(yearAgoComparison?.total_wages_paid_change ?? 0);
  const persondaysChange = toNumber(yearAgoComparison?.total_persondays_change ?? 0);
  const womenChange = toNumber(yearAgoComparison?.women_participation_pct_change ?? 0);

  const tabs = [
    { key: 'overview', label: 'मुख्य जानकारी', icon: '📊' },
    { key: 'trends', label: 'महीने की तुलना', icon: '📈' },
    { key: 'compare', label: 'जिलों की तुलना', icon: '⚖️' },
    { key: 'export', label: 'रिपोर्ट डाउनलोड', icon: '📄' },
  ];

  return (
    <div className="fade-in">
      {/* Rural-Friendly Dashboard Header */}
      <div className="dashboard-header">
        <div className="text-6xl mb-6">🏛️</div>
        <h1 className="dashboard-title">
          {districtInfo.name} जिला
        </h1>
        <p className="dashboard-subtitle">
          मनरेगा कार्यक्रम की जानकारी
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
          <button
            onClick={onChangeDistrict}
            className="btn btn-secondary"
          >
            <span className="mr-2">🔄</span>
            जिला बदलें
          </button>
          
          <button 
            className="audio-btn"
            onClick={() => playAudio('dashboard_help')}
            aria-label="डैशबोर्ड की जानकारी सुनें"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16 8a2 2 0 11-4 0 2 2 0 014 0zm-2 6a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Data source indicator */}
        <div className="mt-6">
          <div className="data-source-indicator">
            <div className="dot"></div>
            <span className="text-lg font-semibold text-green-700">
              📊 सरकारी डेटा से सीधी जानकारी
            </span>
          </div>
        </div>
        
        {summaryData.last_updated && (
          <p className="text-white opacity-80 mt-4">
            अंतिम अपडेट: {new Date(summaryData.last_updated).toLocaleDateString('hi-IN')}
          </p>
        )}
        
        {/* Refresh button */}
        <div className="mt-6">
          <button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="btn btn-warning"
          >
            {isRefreshing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                अपडेट हो रहा है...
              </>
            ) : (
              <>
                <span className="mr-2">🔄</span>
                नया डेटा लाएं
              </>
            )}
          </button>
        </div>
      </div>

      {/* Large, Accessible Navigation Tabs */}
      <div className="nav-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`nav-tab ${activeTab === tab.key ? 'active' : 'inactive'}`}
          >
            <span className="text-2xl mr-3">{tab.icon}</span>
            <span className="text-lg font-semibold">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Main Metrics Grid - Larger and More Prominent */}
          <div className="metrics-grid mb-16">
        <MetricCard
          metric="households"
          value={toNumber(summaryData?.households_registered ?? 0)}
          change={householdsChange}
          changeType={changeTypeOf(householdsChange)}
          icon="households"
          color="blue"
        />
        
        <MetricCard
          metric="wages"
          value={toNumber(summaryData?.total_wages_paid ?? 0)}
          change={wagesChange}
          changeType={changeTypeOf(wagesChange)}
          icon="wages"
          color="green"
        />
        
        <MetricCard
          metric="persondays"
          value={toNumber(summaryData?.total_persondays ?? 0)}
          change={persondaysChange}
          changeType={changeTypeOf(persondaysChange)}
          icon="persondays"
          color="purple"
        />
        
        <MetricCard
          metric="women"
          value={toNumber(summaryData?.women_participation_pct ?? 0)}
          change={womenChange}
          changeType={changeTypeOf(womenChange)}
          icon="women"
          color="orange"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <MetricCard
          metric="works_completed"
          value={toNumber(summaryData?.works_completed ?? 0)}
          change={toNumber(yearAgoComparison?.works_completed_change ?? 0)}
          changeType={changeTypeOf(toNumber(yearAgoComparison?.works_completed_change ?? 0))}
          icon="works"
          color="indigo"
        />
        
        <MetricCard
          metric="works_ongoing"
          value={toNumber(summaryData?.works_ongoing ?? 0)}
          change={toNumber(yearAgoComparison?.works_ongoing_change ?? 0)}
          changeType={changeTypeOf(toNumber(yearAgoComparison?.works_ongoing_change ?? 0))}
          icon="works"
          color="red"
        />
      </div>

          {/* Simple Summary Section */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                📈 इस महीने की खास बातें
              </h3>
              <button 
                className="audio-btn-small"
                onClick={() => playAudio('monthly_summary')}
                aria-label="महीने की सारांश सुनें"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16 8a2 2 0 11-4 0 2 2 0 014 0zm-2 6a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {latestMonth && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-blue-50 rounded-2xl">
                  <div className="text-4xl mb-3">👪</div>
                  <div className="text-3xl font-bold text-blue-800 mb-2">
                    {(latestMonth.households_work_provided || 0).toLocaleString('hi-IN')}
                  </div>
                  <div className="text-lg text-blue-600 font-semibold">
                    परिवारों को काम मिला
                  </div>
                </div>
                
                <div className="text-center p-6 bg-green-50 rounded-2xl">
                  <div className="text-4xl mb-3">💰</div>
                  <div className="text-3xl font-bold text-green-800 mb-2">
                    ₹{(latestMonth.avg_wage || 0).toFixed(0)}
                  </div>
                  <div className="text-lg text-green-600 font-semibold">
                    औसत दैनिक मजदूरी
                  </div>
                </div>
                
                <div className="text-center p-6 bg-purple-50 rounded-2xl">
                  <div className="text-4xl mb-3">👩</div>
                  <div className="text-3xl font-bold text-purple-800 mb-2">
                    {(latestMonth.women_participation_pct || 0).toFixed(1)}%
                  </div>
                  <div className="text-lg text-purple-600 font-semibold">
                    महिला भागीदारी
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-8">
          {monthlyData && monthlyData.length > 0 ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <TimeSeriesChart
                    data={monthlyData.reverse()}
                    metric="total_persondays"
                    title="Person Days Generated"
                  />
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <TimeSeriesChart
                    data={monthlyData}
                    metric="wages_paid"
                    title="Wages Paid (₹)"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <TimeSeriesChart
                    data={monthlyData}
                    metric="households_work_provided"
                    title="Households Provided Work"
                  />
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <TimeSeriesChart
                    data={monthlyData}
                    metric="women_participation_pct"
                    title="Women Participation %"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {intl.formatMessage({ id: 'charts.no_data', defaultMessage: 'No trend data available' })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'compare' && (
        <DistrictComparison currentDistrict={district} />
      )}

      {activeTab === 'export' && (
        <DataExport district={district} />
      )}
    </div>
  );
}