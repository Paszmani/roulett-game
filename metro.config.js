// Configuração padrão do Metro para Expo (SDK 54+).
// Mantida explícita para facilitar customizações futuras (ex.: SVG transformer).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
