import { useIntl } from 'react-intl';

export default function LoadingSpinner({ size = 'medium', message }) {
  const intl = useIntl();
  
  const sizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const defaultMessage = intl.formatMessage({ id: 'loading.please_wait' });

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses[size]} animate-spin`}>
        <svg 
          className="w-full h-full text-primary-600" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      
      {(message || size !== 'small') && (
        <p className="mt-2 text-sm text-gray-600 text-center">
          {message || defaultMessage}
        </p>
      )}
      
      {/* Screen reader text */}
      <span className="sr-only">
        {message || defaultMessage}
      </span>
    </div>
  );
}