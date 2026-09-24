# VibeCash

App de control de gastos personales hecha con Expo / React Native. Se publica como web app (PWA) en Vercel.

Los datos (movimientos, nombre y categorías) se guardan **solo en el dispositivo**, en el almacenamiento local del navegador o del móvil.

## Desarrollo

```bash
npm install
npm run web
```

En Windows, si PowerShell bloquea `npm`, usa `npm.cmd run web`.

## Build para producción

```bash
npm run build
```

Genera la web en `dist/` y añade el manifest y los iconos de PWA (`scripts/patch-pwa.js`).

## Estructura

- `App.js`: estado global, carga y guardado de datos, navegación y onboarding.
- `src/screens/`: pantallas de las cuatro pestañas: Inicio (`DataEntryScreen`), Movimientos (`MovementsScreen`, que une `HistoryScreen` y `CalendarScreen`), Análisis (`ChartsScreen`) y Ajustes (`ProfileScreen`).
- `src/components/`: piezas comunes (`ScreenHeader`, `Segmented`, `Sheet`, `TransactionRow`, `TransactionSheet`, `EmptyState`) y el formulario `AddTransactionModal`.
- `src/logic/`: cálculos y periodos (`cashFlow.js`), fechas en hora local (`dates.js`), formato de importes y fechas en español (`format.js`), diálogos web/móvil (`dialogs.js`) y utilidades (`helpers.js`).
- `src/constants/theme.js`: sistema de diseño "papel y tinta" (colores, fuentes Fraunces e Inter, tamaños, espacios) y categorías por defecto. Los colores antiguos de las categorías guardadas se convierten al pintarlos (`displayColor` en `helpers.js`), sin tocar los datos.

## Datos guardados

Claves de almacenamiento: `user_transactions`, `user_name`, `user_categories`, `user_income_categories` y `has_seen_welcome`. **No cambies estas claves ni el formato de los movimientos**, o los usuarios actuales perderían sus datos al actualizar.
