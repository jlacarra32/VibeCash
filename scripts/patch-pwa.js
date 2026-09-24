#!/usr/bin/env node
/**
 * patch-pwa.js
 * Script post-build: añade soporte PWA completo al index.html generado por Expo.
 * Ejecutar después de: expo export --platform web
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'images');

// --- 1. Copiar iconos al dist ---
const iconSource = path.join(ASSETS_DIR, 'icon.png');
const iconDestinations = [
  path.join(DIST_DIR, 'icon-192.png'),
  path.join(DIST_DIR, 'icon-512.png'),
  path.join(DIST_DIR, 'apple-touch-icon.png'),
];

iconDestinations.forEach((dest) => {
  fs.copyFileSync(iconSource, dest);
  console.log(`✅ Icono copiado a: ${path.basename(dest)}`);
});

// --- 2. Crear manifest.json ---
const manifest = {
  name: 'VibeCash',
  short_name: 'VibeCash',
  description: 'VibeCash - Tu control de gastos con estilo',
  start_url: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0F172A',
  theme_color: '#8B5CF6', // mismo violeta que THEME.colors.accent
  // Los tres archivos son copias de assets/images/icon.png (640x640): se
  // declara su tamaño real. Se mantienen los nombres de archivo para no
  // romper las instalaciones existentes.
  icons: [
    { src: '/icon-512.png', sizes: '640x640', type: 'image/png', purpose: 'any' },
    { src: '/icon-192.png', sizes: '640x640', type: 'image/png', purpose: 'any' },
  ],
};

fs.writeFileSync(
  path.join(DIST_DIR, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf-8'
);
console.log('✅ manifest.json creado');

// --- 3. Parchear index.html ---
const indexPath = path.join(DIST_DIR, 'index.html');
let html = fs.readFileSync(indexPath, 'utf-8');

const PWA_TAGS = `
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="VibeCash">
  <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="manifest" href="/manifest.json">`;

// Solo añadir si no están ya presentes
if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', PWA_TAGS + '\n</head>');
  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log('✅ index.html parcheado con etiquetas PWA');
} else {
  console.log('ℹ️  index.html ya tiene etiquetas PWA, sin cambios');
}

console.log('\n🚀 PWA patch completado. ¡Listo para deploy!');
