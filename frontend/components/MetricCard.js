import { useLanguage } from '../contexts/LanguageContext';
import { useAudio } from '../contexts/AudioContext';
import { 
  MdPeople, 
  MdAttachMoney, 
  MdWork, 
  MdWoman,
  MdConstruction,
  MdCheckCircle,
  MdBuild,
  MdVolumeUp,
  MdTrendingUp,
  MdTrendingDown,
  MdTrendingFlat
} from 'react-icons/md';
import { 
  FaUsers, 
  FaRupeeSign, 
  FaHardHat,
  FaFemale,
  FaTools,
  FaCheckCircle,
  FaCog
} from 'react-icons/fa';

const MetricCard = ({ metric, value, change, changeType, icon, color = 'blue' }) => {
  const { formatMessage, locale } = useLanguage();
  const { playAudio } = useAudio();
  
  // React Icons mapping for better visual consistency
  const iconMap = {
    households: { icon: FaUsers, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    wages: { icon: FaRupeeSign, color: 'text-green-600', bgColor: 'bg-green-100' },
    persondays: { icon: FaHardHat, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    women: { icon: FaFemale, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    works: { icon: FaTools, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
    works_completed: { icon: FaCheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
    works_ongoing: { icon: FaCog, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    default: { icon: MdWork, color: 'text-gray-600', bgColor: 'bg-gray-100' }
  };
  
  const iconConfig = iconMap[icon] || iconMap.default;
  const IconComponent = iconConfig.icon;
  
  // Get labels from translation system
  const getLabel = (metric) => {
    return formatMessage(`metrics.${metric}`);
  };

  const labelText = getLabel(metric);

  // Format numbers in Indian style (Lakh, Crore)
  const formatIndianNumber = (num) => {
    if (!num || num === 0) return '0';
    
    if (num >= 10000000) {
      return `${(num / 10000000).toFixed(1)} ${formatMessage('number.crore')}`;
    } else if (num >= 100000) {
      return `${(num / 100000).toFixed(1)} ${formatMessage('number.lakh')}`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} ${formatMessage('number.thousand')}`;
    }
    return num.toLocaleString(locale === 'hi' ? 'hi-IN' : 'en-IN');
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
      changeType === 'positive' ? formatMessage('change.better') :
      changeType === 'negative' ? formatMessage('change.worse') :
      formatMessage('change.same')
    }`;
    
    playAudio('metric_explanation', { text: audioText });
  };

  return (
    <div 
      className={`metric-card ${color} hover-lift cursor-pointer group relative overflow-hidden`}
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
      {/* Enhanced Icon with Background */}
      <div className="flex justify-center mb-6">
        <div className={`p-4 rounded-2xl ${iconConfig.bgColor} group-hover:scale-110 transition-transform duration-300`}>
          <IconComponent className={`w-12 h-12 ${iconConfig.color}`} />
        </div>
      </div>
      
      {/* Large, bold value */}
      <div className="value">
        {formattedValue}
      </div>
      
      {/* Clear Hindi label */}
      <div className="label">
        {labelText}
      </div>
      
      {/* Enhanced Change indicator with React Icons */}
      {typeof change === 'number' && (
        <div className={`change ${changeType} flex items-center justify-center`} aria-label={`परिवर्तन ${signedChange}`}>
          {changeType === 'positive' && <MdTrendingUp className="w-5 h-5 mr-1" />}
          {changeType === 'negative' && <MdTrendingDown className="w-5 h-5 mr-1" />}
          {changeType === 'neutral' && <MdTrendingFlat className="w-5 h-5 mr-1" />}
          {signedChange}
        </div>
      )}

      {/* Enhanced Visual progress bar */}
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

      {/* Enhanced Audio indicator */}
      <div className="absolute top-4 right-4 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
        <div className="p-2 bg-white/80 rounded-full shadow-lg">
          <MdVolumeUp className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      {/* Enhanced Tooltip */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        <div className="bg-gray-800 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap flex items-center shadow-lg">
          <MdVolumeUp className="w-3 h-3 mr-1" />
          सुनने के लिए क्लिक करें
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-purple-400/0 to-green-400/0 group-hover:from-blue-400/10 group-hover:via-purple-400/10 group-hover:to-green-400/10 transition-all duration-500 rounded-3xl" />
    </div>
  );
};

export default MetricCard;