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
- `src/screens/`: pantallas (Inicio, Análisis, Calendario, Historial, Perfil).
- `src/components/AddTransactionModal.js`: formulario para crear y editar movimientos.
- `src/logic/`: cálculos (`cashFlow.js`), fechas en hora local (`dates.js`), diálogos web/móvil (`dialogs.js`) y utilidades (`helpers.js`).
- `src/constants/theme.js`: colores, tipografía y categorías por defecto.

## Datos guardados

Claves de almacenamiento: `user_transactions`, `user_name`, `user_categories`, `user_income_categories` y `has_seen_welcome`. **No cambies estas claves ni el formato de los movimientos**, o los usuarios actuales perderían sus datos al actualizar.
