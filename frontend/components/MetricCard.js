import React from 'react';
import { useIntl } from 'react-intl';
import { 
  FaUsers, 
  FaHandHoldingUsd, 
  FaCalendarCheck, 
  FaFemale,
  FaHammer,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaMinus
} from 'react-icons/fa';

const MetricCard = ({ metric, value, change, changeType, icon, color = 'blue' }) => {
  const intl = useIntl();
  
  const iconMap = {
    households: FaUsers,
    wages: FaHandHoldingUsd,
    persondays: FaCalendarCheck,
    women: FaFemale,
    works: FaHammer,
    default: FaChartLine
  };
  
  const IconComponent = iconMap[icon] || iconMap.default;
  
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    indigo: 'text-indigo-600'
  };
  
  const changeIconMap = {
    positive: FaArrowUp,
    negative: FaArrowDown,
    neutral: FaMinus
  };
  
  const ChangeIcon = changeIconMap[changeType] || FaMinus;

  const defaultLabels = {
    households: 'Households Registered',
    wages: 'Total Wages Paid',
    persondays: 'Total Persondays',
    women: 'Women Participation %',
    works_completed: 'Works Completed',
    works_ongoing: 'Works Ongoing'
  };

  const labelText = intl.formatMessage({ 
    id: `metrics.${metric}`, 
    defaultMessage: defaultLabels[metric] || metric 
  });

  const formattedValue = intl.formatNumber(value ?? 0, metric === 'wages' 
    ? { notation: 'compact', maximumFractionDigits: 1 }
    : { notation: 'compact', maximumFractionDigits: 1 }
  );

  const signedChange = typeof change === 'number' ? `${change > 0 ? '+' : change < 0 ? '' : ''}${Math.abs(change)}%` : '0%';

  return (
    <div className="metric-card hover-lift">
      <div className={`icon ${colorClasses[color]}`}>
        <IconComponent />
      </div>
      
      <div className="value">{formattedValue}</div>
      
      <div className="label">{labelText}</div>
      
      {typeof change === 'number' && (
        <div className={`change ${changeType}`} aria-label={`Change ${signedChange}`}>
          <ChangeIcon className="inline w-3 h-3 mr-1" />
          {signedChange}
        </div>
      )}

      <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden" aria-hidden="true">
        <div
          className={
            `h-full ${
              changeType === 'positive' ? 'bg-green-500' : changeType === 'negative' ? 'bg-red-500' : 'bg-gray-300'
            }`
          }
          style={{ width: `${Math.min(Math.abs(change ?? 0), 100)}%` }}
        />
      </div>
    </div>
  );
};

export default MetricCard;