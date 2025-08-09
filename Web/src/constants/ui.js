/**
 * UI Constants for React Frontend
 * Centralized constants for UI components, styles, and user interface elements
 */

// Color Palette
export const COLORS = {
  PRIMARY: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e'
  },
  
  SECONDARY: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },
  
  SUCCESS: {
    50: '#f0fdf4',
    500: '#22c55e',
    700: '#15803d'
  },
  
  WARNING: {
    50: '#fffbeb',
    500: '#f59e0b',
    700: '#a16207'
  },
  
  ERROR: {
    50: '#fef2f2',
    500: '#ef4444',
    700: '#b91c1c'
  },
  
  NEUTRAL: {
    WHITE: '#ffffff',
    BLACK: '#000000',
    GRAY_50: '#f9fafb',
    GRAY_100: '#f3f4f6',
    GRAY_200: '#e5e7eb',
    GRAY_300: '#d1d5db',
    GRAY_400: '#9ca3af',
    GRAY_500: '#6b7280',
    GRAY_600: '#4b5563',
    GRAY_700: '#374151',
    GRAY_800: '#1f2937',
    GRAY_900: '#111827'
  }
};

// Typography
export const TYPOGRAPHY = {
  FONT_FAMILY: {
    PRIMARY: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    MONO: "'Fira Code', 'Monaco', 'Cascadia Code', monospace"
  },
  
  FONT_SIZE: {
    XS: '0.75rem',      // 12px
    SM: '0.875rem',     // 14px
    BASE: '1rem',       // 16px
    LG: '1.125rem',     // 18px
    XL: '1.25rem',      // 20px
    '2XL': '1.5rem',    // 24px
    '3XL': '1.875rem',  // 30px
    '4XL': '2.25rem',   // 36px
    '5XL': '3rem',      // 48px
    '6XL': '3.75rem'    // 60px
  },
  
  FONT_WEIGHT: {
    LIGHT: 300,
    NORMAL: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
    EXTRABOLD: 800
  },
  
  LINE_HEIGHT: {
    TIGHT: 1.25,
    NORMAL: 1.5,
    RELAXED: 1.75
  }
};

// Spacing
export const SPACING = {
  XS: '0.25rem',    // 4px
  SM: '0.5rem',     // 8px
  MD: '1rem',       // 16px
  LG: '1.5rem',     // 24px
  XL: '2rem',       // 32px
  '2XL': '3rem',    // 48px
  '3XL': '4rem',    // 64px
  '4XL': '6rem',    // 96px
  '5XL': '8rem'     // 128px
};

// Border Radius
export const BORDER_RADIUS = {
  NONE: '0',
  SM: '0.125rem',   // 2px
  MD: '0.375rem',   // 6px
  LG: '0.5rem',     // 8px
  XL: '0.75rem',    // 12px
  '2XL': '1rem',    // 16px
  FULL: '9999px'
};

// Shadows
export const SHADOWS = {
  SM: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  MD: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  LG: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  XL: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  INNER: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
};

// Animation Durations
export const ANIMATION = {
  DURATION: {
    FAST: '150ms',
    NORMAL: '300ms',
    SLOW: '500ms'
  },
  
  EASING: {
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

// Breakpoints
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px'
};

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070,
  TOAST: 1080
};

// Component Sizes
export const COMPONENT_SIZES = {
  BUTTON: {
    SM: {
      HEIGHT: '2rem',
      PADDING: '0.5rem 0.75rem',
      FONT_SIZE: TYPOGRAPHY.FONT_SIZE.SM
    },
    MD: {
      HEIGHT: '2.5rem',
      PADDING: '0.625rem 1rem',
      FONT_SIZE: TYPOGRAPHY.FONT_SIZE.BASE
    },
    LG: {
      HEIGHT: '3rem',
      PADDING: '0.75rem 1.5rem',
      FONT_SIZE: TYPOGRAPHY.FONT_SIZE.LG
    }
  },
  
  INPUT: {
    SM: {
      HEIGHT: '2rem',
      PADDING: '0.375rem 0.75rem',
      FONT_SIZE: TYPOGRAPHY.FONT_SIZE.SM
    },
    MD: {
      HEIGHT: '2.5rem',
      PADDING: '0.5rem 0.75rem',
      FONT_SIZE: TYPOGRAPHY.FONT_SIZE.BASE
    },
    LG: {
      HEIGHT: '3rem',
      PADDING: '0.75rem 1rem',
      FONT_SIZE: TYPOGRAPHY.FONT_SIZE.LG
    }
  }
};

// Layout Constants
export const LAYOUT = {
  HEADER_HEIGHT: '4rem',
  SIDEBAR_WIDTH: '16rem',
  SIDEBAR_WIDTH_COLLAPSED: '4rem',
  CONTAINER_MAX_WIDTH: '1200px',
  CONTENT_PADDING: SPACING.LG
};

// Toast Configuration
export const TOAST = {
  POSITION: 'top-right',
  DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 3000
  },
  MAX_TOASTS: 5
};

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Form Validation
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  ANIMATION,
  BREAKPOINTS,
  Z_INDEX,
  COMPONENT_SIZES,
  LAYOUT,
  TOAST,
  LOADING_STATES,
  VALIDATION_RULES
};