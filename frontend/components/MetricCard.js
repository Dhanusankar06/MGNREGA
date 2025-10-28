import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAudio } from '../contexts/AudioContext';

const MetricCard = ({ metric, value, change, changeType, icon, color = 'blue' }) => {
  const { formatMessage } = useLanguage();
  const { playAudio } = useAudio();
  
  // Large, friendly emoji icons for rural users
  const iconMap = {
    households: '👪',
    wages: '💰',
    persondays: '👷',
    women: '👩',
    works: '🏗️',
    works_completed: '✅',
    works_ongoing: '🚧',
    default: '📊'
  };
  
  const iconEmoji = iconMap[icon] || iconMap.default;
  
  // Hindi labels for better accessibility
  const defaultLabels = {
    households: 'पंजीकृत परिवार',
    wages: 'कुल मजदूरी',
    persondays: 'व्यक्ति-दिन',
    women: 'महिला भागीदारी',
    works_completed: 'पूरे हुए काम',
    works_ongoing: 'चालू काम'
  };

  const labelText = defaultLabels[metric] || metric;

  // Format numbers in Indian style (Lakh, Crore)
  const formatIndianNumber = (num) => {
    if (!num || num === 0) return '0';
    
    if (num >= 10000000) {
      return `${(num / 10000000).toFixed(1)} करोड़`;
    } else if (num >= 100000) {
      return `${(num / 100000).toFixed(1)} लाख`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} हज़ार`;
    }
    return num.toLocaleString('hi-IN');
  };

  const formattedValue = metric === 'wages' 
    ? `₹${formatIndianNumber(value)}`
    : metric === 'women'
    ? `${(value || 0).toFixed(1)}%`
    : formatIndianNumber(value);

  const signedChange = typeof change === 'number' 
    ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` 
    : '0%';

  // Audio explanation for the metric
  const handleAudioPlay = () => {
    const audioText = `${labelText}: ${formattedValue}. ${
      changeType === 'positive' ? 'पिछले महीने से बेहतर' :
      changeType === 'negative' ? 'पिछले महीने से कम' :
      'पिछले महीने के बराबर'
    }`;
    
    playAudio('metric_explanation', { text: audioText });
  };

  return (
    <div 
      className={`metric-card ${color} hover-lift cursor-pointer`}
      onClick={handleAudioPlay}
      role="button"
      tabIndex={0}
      aria-label={`${labelText}: ${formattedValue}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleAudioPlay();
        }
      }}
    >
      {/* Large emoji icon */}
      <div className="icon">
        {iconEmoji}
      </div>
      
      {/* Large, bold value */}
      <div className="value">
        {formattedValue}
      </div>
      
      {/* Clear Hindi label */}
      <div className="label">
        {labelText}
      </div>
      
      {/* Change indicator with clear visual feedback */}
      {typeof change === 'number' && (
        <div className={`change ${changeType}`} aria-label={`परिवर्तन ${signedChange}`}>
          {changeType === 'positive' && <span className="mr-1">↗️</span>}
          {changeType === 'negative' && <span className="mr-1">↘️</span>}
          {changeType === 'neutral' && <span className="mr-1">➡️</span>}
          {signedChange}
        </div>
      )}

      {/* Visual progress bar */}
      <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden" aria-hidden="true">
        <div
          className={`h-full transition-all duration-1000 ${
            changeType === 'positive' ? 'bg-gradient-to-r from-green-400 to-green-600' : 
            changeType === 'negative' ? 'bg-gradient-to-r from-red-400 to-red-600' : 
            'bg-gradient-to-r from-gray-400 to-gray-500'
          }`}
          style={{ width: `${Math.min(Math.abs(change ?? 0) * 2, 100)}%` }}
        />
      </div>

      {/* Audio indicator */}
      <div className="absolute top-4 right-4 opacity-60">
        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.846 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.846l3.537-3.816a1 1 0 011.617.816zM16 8a2 2 0 11-4 0 2 2 0 014 0zm-2 6a4 4 0 100-8 4 4 0 000 8z" clipRule="evenodd" />
        </svg>
      </div>

      {/* Tooltip for interaction */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded whitespace-nowrap">
          सुनने के लिए क्लिक करें
        </span>
      </div>
    </div>
  );
};

export default MetricCard;