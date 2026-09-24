// Sistema de diseño "papel y tinta".
// Todas las pantallas deben sacar colores, tamaños y fuentes de aquí.

const palette = {
  paper: '#F4EFE6',      // fondo general
  elevated: '#FBF8F2',   // hojas, tarjetas, barra inferior
  sunken: '#EAE3D6',     // inputs y controles segmentados
  ink: '#1B1915',        // texto principal
  inkSoft: '#6E665A',    // texto secundario
  inkFaint: '#A39A8B',   // texto terciario, placeholders
  hairline: '#DCD3C3',   // filetes de 1 px
  accent: '#1F3D2F',     // verde botella: acciones y estado activo
  onAccent: '#F7F3EA',   // texto e iconos sobre el acento
  income: '#2F6B47',
  danger: '#A8432A',     // terracota: solo déficit y borrar
  warning: '#B0832A',    // ocre
};

export const THEME = {
  colors: {
    ...palette,
    scrim: 'rgba(27, 25, 21, 0.45)', // fondo detrás de hojas modales
    // Alias de la versión anterior (las pantallas antiguas aún los usan)
    background: palette.paper,
    surface: palette.elevated,
    primary: palette.elevated,
    textPrimary: palette.ink,
    textSecondary: palette.inkSoft,
    textTertiary: palette.inkFaint,
    border: palette.hairline,
    success: palette.income,
    error: palette.danger,
  },
  // Tinta con transparencia, para fondos y líneas suaves sobre el papel
  inkAlpha: (a) => `rgba(27, 25, 21, ${a})`,
  fonts: {
    display: 'Fraunces_400Regular',
    displayItalic: 'Fraunces_400Regular_Italic',
    displayStrong: 'Fraunces_600SemiBold',
    body: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    strong: 'Inter_600SemiBold',
  },
  type: {
    display: 44,
    title: 32,
    heading: 20,
    body: 15,
    small: 13,
    caption: 12,
  },
  radius: { sm: 6, md: 12, lg: 20, full: 999 },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  layout: {
    gutter: 20,
    // Espacio sobre la cabecera de cada pantalla. El hueco de la barra de
    // estado / notch ya lo añade SafeAreaView en App.js.
    screenTop: 20,
    borderRadius: 12,
  },
};

// Colores apagados para categorías
export const CATEGORY_COLORS = [
  '#B5562F', // terracota
  '#9E4A6B', // ciruela rosada
  '#3F5E7A', // azul pizarra
  '#4F7A5A', // salvia
  '#B0832A', // ocre
  '#6A4E7E', // ciruela
  '#3E7C7E', // petróleo
  '#7A8A3A', // oliva
  '#A34A45', // teja
  '#8A8272', // arena
];

export const CATEGORIES = [
  { id: 'Comida', color: '#B5562F', icon: 'restaurant-outline' },
  { id: 'Fiesta', color: '#9E4A6B', icon: 'beer-outline' },
  { id: 'Transporte', color: '#3F5E7A', icon: 'bus-outline' },
  { id: 'Supermercado', color: '#4F7A5A', icon: 'cart-outline' },
  { id: 'Otros', color: '#8A8272', icon: 'ellipsis-horizontal-outline' },
];

export const INCOME_CATEGORIES = [];
