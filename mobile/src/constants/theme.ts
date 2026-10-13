export const COLORS = {
  // Ultra-Clean Light Mode Backgrounds
  background: '#f8fafc',         // Slate 50
  backgroundDark: '#f1f5f9',     // Slate 100
  surface: '#ffffff',            // Pure White Card/Surface
  surfaceDark: '#ffffff',
  surfaceDarker: '#f8fafc',
  surfaceCard: '#ffffff',
  surfaceBorder: '#e2e8f0',      // Crisp Border (Slate 200)
  borderDark: '#e2e8f0',
  surfaceBorderLight: '#cbd5e1', // Slate 300
  
  // High-Energy Bold Brand Crimson / Red (not light or washed out)
  primary: '#dc2626',            // Bold Crimson Red
  primaryDark: '#991b1b',        // Deep Crimson
  primaryLight: '#ef4444',       // Vibrant Accent Red
  primaryMuted: 'rgba(220, 38, 38, 0.08)',
  
  // High-Contrast Dark Slate Typography for Light Theme
  white: '#ffffff',
  textPrimary: '#0f172a',        // Slate 900 (High Contrast Charcoal Black)
  textSecondary: '#334155',      // Slate 700 (Clear readable body)
  textMuted: '#64748b',          // Slate 500
  disabled: '#cbd5e1',
  
  // Accents & Badges
  accentRose: '#e11d48',
  accentEmerald: '#059669',
  accentAmber: '#d97706',
  accentCyan: '#0891b2',
  accentLime: '#65a30d',
  
  // Statuses
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#2563eb',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const SHADOWS = {
  primary: {
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};
