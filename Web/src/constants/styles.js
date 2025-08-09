// Style constants to replace inline styles
export const COLORS = {
  // Primary colors
  PRIMARY: '#059669',
  PRIMARY_HOVER: '#047857',
  
  // Text colors
  TEXT_PRIMARY: '#111827',
  TEXT_SECONDARY: '#6b7280',
  TEXT_MUTED: '#9ca3af',
  
  // Background colors
  BG_PRIMARY: '#ffffff',
  BG_SECONDARY: '#f9fafb',
  BG_GRAY: '#f3f4f6',
  
  // Status colors
  SUCCESS: '#10b981',
  ERROR: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6',
  
  // Border colors
  BORDER_DEFAULT: '#d1d5db',
  BORDER_FOCUS: '#6366f1',
  
  // Loading/disabled states
  DISABLED: '#9ca3af',
  LOADING_BG: '#f3f4f6'
};

export const SPACING = {
  // Padding/margin values
  XS: '0.25rem',
  SM: '0.5rem', 
  MD: '1rem',
  LG: '1.5rem',
  XL: '2rem',
  XXL: '3rem',
  
  // Specific spacing
  PAGE_PADDING: '1.5rem',
  CARD_PADDING: '1rem',
  BUTTON_PADDING: '0.75rem 1.5rem'
};

export const TYPOGRAPHY = {
  // Font sizes
  TEXT_XS: '0.75rem',
  TEXT_SM: '0.875rem',
  TEXT_BASE: '1rem',
  TEXT_LG: '1.125rem',
  TEXT_XL: '1.25rem',
  TEXT_2XL: '1.5rem',
  TEXT_3XL: '1.875rem',
  TEXT_4XL: '2.25rem',
  
  // Font weights
  WEIGHT_NORMAL: '400',
  WEIGHT_MEDIUM: '500',
  WEIGHT_SEMIBOLD: '600',
  WEIGHT_BOLD: '700',
  
  // Line heights
  LEADING_TIGHT: '1.25',
  LEADING_NORMAL: '1.5',
  LEADING_RELAXED: '1.625'
};

export const LAYOUT = {
  // Dimensions
  HEADER_HEIGHT: '4rem',
  SIDEBAR_WIDTH: '16rem',
  FOOTER_HEIGHT: '3rem',
  
  // Breakpoints
  MOBILE: '640px',
  TABLET: '768px',
  DESKTOP: '1024px',
  LARGE: '1280px',
  
  // Container widths
  CONTAINER_SM: '640px',
  CONTAINER_MD: '768px',
  CONTAINER_LG: '1024px',
  CONTAINER_XL: '1280px',
  
  // Z-index values
  Z_DROPDOWN: 10,
  Z_MODAL: 50,
  Z_TOAST: 100
};

export const SHADOWS = {
  SM: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  MD: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  LG: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  XL: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
};

export const ANIMATIONS = {
  TRANSITION_FAST: '150ms ease-in-out',
  TRANSITION_DEFAULT: '300ms ease-in-out',
  TRANSITION_SLOW: '500ms ease-in-out',
  
  // Common transform values
  HOVER_SCALE: 'scale(1.05)',
  HOVER_TRANSLATE_Y: 'translateY(-2px)',
  
  // Animation durations
  DURATION_FAST: '150ms',
  DURATION_DEFAULT: '300ms',
  DURATION_SLOW: '500ms'
};