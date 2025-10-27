import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useIntl } from 'react-intl';
import axios from 'axios';
import { FaVolumeUp, FaSyncAlt, FaSpinner, FaExchangeAlt } from 'react-icons/fa';

import LoadingSpinner from './LoadingSpinner';
import MetricCard from './MetricCard';
import { useAudio } from '../contexts/AudioContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DistrictDashboard({ district, onChangeDistrict }) {
  const intl = useIntl();
  const { playAudio } = useAudio();
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  return (
    <div className="fade-in">
      {/* Clean Dashboard Header */}
      <div className="dashboard-header">
        <div className="flex items-center justify-center mb-6">
          <h1 className="dashboard-title">
            {districtInfo.name}
          </h1>
          <button
            onClick={onChangeDistrict}
            className="btn btn-secondary ml-4"
          >
            <FaExchangeAlt className="w-4 h-4 mr-2" />
            {intl.formatMessage({ id: 'dashboard.change_district' })}
          </button>
        </div>
        
        <p className="dashboard-subtitle">
          {intl.formatMessage({ id: 'dashboard.title' })}
        </p>
        
        {summaryData.last_updated && (
          <p className="text-sm text-gray-500 mb-4">
            {intl.formatMessage({ id: 'dashboard.last_updated' })}: {' '}
            {new Date(summaryData.last_updated).toLocaleDateString(intl.locale)}
          </p>
        )}
        
        {/* Data source indicator */}
        <div className="mt-4 text-center">
          <div className="data-source-indicator">
            <div className="dot"></div>
            <span className="text-sm font-medium text-green-700">
              📊 Live Data from data.gov.in
            </span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <button 
            className="audio-btn"
            onClick={() => playAudio('dashboard_help')}
            aria-label={intl.formatMessage({ id: 'audio.play_metric' })}
          >
            <FaVolumeUp className="w-5 h-5 text-blue-600" />
          </button>
          
          <button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="btn btn-success"
          >
            {isRefreshing ? (
              <>
                <FaSpinner className="animate-spin w-4 h-4 mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <FaSyncAlt className="w-4 h-4 mr-2" />
                Refresh Live Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid mb-12">
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

      {/* Monthly Trend */}
      <div className="card mb-12">
        <div className="card-header">
          <h3 className="text-xl font-semibold text-gray-900">
            {intl.formatMessage({ id: 'dashboard.monthly_trend', defaultMessage: 'Monthly Trend' })}
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {formatNumber(toNumber(latestMonth?.households_work_provided ?? 0))}
              </div>
              <div className="text-sm text-gray-600">
                {intl.formatMessage({ id: 'metrics.households_work_provided', defaultMessage: 'Households Provided Work' })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                ₹{formatNumber(toNumber(latestMonth?.avg_wage ?? 0))}
              </div>
              <div className="text-sm text-gray-600">
                {intl.formatMessage({ id: 'metrics.avg_wage', defaultMessage: 'Average Wage' })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {toNumber(latestMonth?.women_participation_pct ?? 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">
                {intl.formatMessage({ id: 'metrics.women_participation_pct', defaultMessage: 'Women Participation %' })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}