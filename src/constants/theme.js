export const THEME = {
  colors: {
    background: '#0F172A', // Midnight Dark
    textPrimary: '#F8FAFC', // Slate 50
    textSecondary: '#94A3B8', // Slate 400
    primary: '#1E293B', // Slate 800
    accent: '#8B5CF6', // Violet
    success: '#10B981', // Emerald
    warning: '#F59E0B', // Amber
    error: '#EF4444', // Rose
    border: '#334155', // Slate 700
    surface: '#1E293B', // Slate 800
  },
  typography: {
    fontFamily: 'System',
    fontSize: {
      small: 12,
      regular: 15,
      large: 18,
      header: 24,
      title: 32,
    },
    fontWeight: {
      normal: '400',
      bold: '600',
      heavy: '800',
    }
  },
  layout: {
    borderWidth: 1.5,
    borderRadius: 20, // Más redondeado para look moderno
    padding: 16,
    margin: 16,
  }
};

export const CATEGORIES = [
  { id: 'Comida', color: '#F97316', icon: '🍕' },
  { id: 'Fiesta', color: '#8B5CF6', icon: '🍺' },
  { id: 'Coche', color: '#3B82F6', icon: '🚗' },
  { id: 'Supermercado', color: '#10B981', icon: '🛒' },
  { id: 'Otros', color: '#94A3B8', icon: '📦' },
];

export const INCOME_CATEGORIES = [
  { id: 'Bizum', color: '#6366F1', icon: '📱' },
  { id: 'Mes', color: '#EAB308', icon: '💰' },
  { id: 'Otros', color: '#22C55E', icon: '✨' },
];
