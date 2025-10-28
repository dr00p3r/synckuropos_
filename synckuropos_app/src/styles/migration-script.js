#!/usr/bin/env node

/**
 * SCRIPT DE MIGRACIÓN - SyncKuroPOS Design System
 * Automatiza la conversión de CSS existente al nuevo sistema de diseño
 */

const fs = require('fs');
const path = require('path');

// Mapeo de valores a variables CSS
const colorMappings = {
  '#2A423E': 'var(--color-primary)',
  '#547771': 'var(--color-primary-light)',
  '#1f332f': 'var(--color-primary-dark)',
  '#456962': 'var(--color-primary-hover)',
  '#374151': 'var(--color-text-primary)',
  '#6b7280': 'var(--color-text-secondary)',
  '#9ca3af': 'var(--color-text-muted)',
  '#F0EFE7': 'var(--color-text-light)',
  '#ffffff': 'var(--color-text-white)',
  '#f8fafc': 'var(--color-bg-secondary)',
  '#f1f5f9': 'var(--color-bg-tertiary)',
  '#f9fafb': 'var(--color-bg-muted)',
  '#f5f5f5': 'var(--color-bg-dark)',
  '#16a34a': 'var(--color-success)',
  '#22c55e': 'var(--color-success-light)',
  '#f0fdf4': 'var(--color-success-bg)',
  '#bbf7d0': 'var(--color-success-border)',
  '#dc2626': 'var(--color-error)',
  '#ef4444': 'var(--color-error-light)',
  '#fef2f2': 'var(--color-error-bg)',
  '#f59e0b': 'var(--color-warning)',
  '#fffbeb': 'var(--color-warning-bg)',
  '#3b82f6': 'var(--color-info)',
  '#eff6ff': 'var(--color-info-bg)',
  '#e5e7eb': 'var(--color-gray-200)',
  '#d1d5db': 'var(--color-gray-300)',
  '#f3f4f6': 'var(--color-gray-100)',
};

const spacingMappings = {
  '4px': 'var(--spacing-xs)',
  '8px': 'var(--spacing-sm)',
  '16px': 'var(--spacing-md)',
  '24px': 'var(--spacing-lg)',
  '32px': 'var(--spacing-xl)',
  '48px': 'var(--spacing-2xl)',
  '64px': 'var(--spacing-3xl)',
  '0.25rem': 'var(--spacing-xs)',
  '0.5rem': 'var(--spacing-sm)',
  '1rem': 'var(--spacing-md)',
  '1.5rem': 'var(--spacing-lg)',
  '2rem': 'var(--spacing-xl)',
};

const borderRadiusMappings = {
  '4px': 'var(--radius-sm)',
  '6px': 'var(--radius-md)',
  '8px': 'var(--radius-lg)',
  '12px': 'var(--radius-xl)',
  '16px': 'var(--radius-2xl)',
  '50%': 'var(--radius-round)',
  '9999px': 'var(--radius-pill)',
};

const fontSizeMappings = {
  '12px': 'var(--font-size-xs)',
  '14px': 'var(--font-size-sm)',
  '16px': 'var(--font-size-base)',
  '18px': 'var(--font-size-lg)',
  '20px': 'var(--font-size-xl)',
  '24px': 'var(--font-size-2xl)',
  '30px': 'var(--font-size-3xl)',
  '32px': 'var(--font-size-4xl)',
  '0.75rem': 'var(--font-size-xs)',
  '0.875rem': 'var(--font-size-sm)',
  '1rem': 'var(--font-size-base)',
  '1.125rem': 'var(--font-size-lg)',
  '1.25rem': 'var(--font-size-xl)',
  '1.5rem': 'var(--font-size-2xl)',
  '1.875rem': 'var(--font-size-3xl)',
  '2rem': 'var(--font-size-4xl)',
};

const fontWeightMappings = {
  '400': 'var(--font-weight-normal)',
  '500': 'var(--font-weight-medium)',
  '600': 'var(--font-weight-semibold)',
  '700': 'var(--font-weight-bold)',
};

const transitionMappings = {
  'all 0.2s ease': 'var(--transition-all)',
  'all 0.3s ease': 'var(--transition-slow)',
  'background-color 0.2s ease': 'var(--transition-colors)',
  'color 0.2s ease': 'var(--transition-colors)',
  'transform 0.3s ease': 'var(--transition-transform)',
};

/**
 * Migra un archivo CSS individual
 */
function migrateCSSFile(filePath) {
  console.log(`🔄 Migrando: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  
  // Migrar colores
  Object.entries(colorMappings).forEach(([oldColor, newVar]) => {
    const regex = new RegExp(oldColor.replace('#', '#'), 'gi');
    if (content.includes(oldColor)) {
      content = content.replace(regex, newVar);
      changes++;
    }
  });
  
  // Migrar espaciado
  Object.entries(spacingMappings).forEach(([oldSpacing, newVar]) => {
    // Para padding
    const paddingRegex = new RegExp(`padding:\\s*${oldSpacing.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    if (paddingRegex.test(content)) {
      content = content.replace(paddingRegex, `padding: ${newVar}`);
      changes++;
    }
    
    // Para margin
    const marginRegex = new RegExp(`margin:\\s*${oldSpacing.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    if (marginRegex.test(content)) {
      content = content.replace(marginRegex, `margin: ${newVar}`);
      changes++;
    }
  });
  
  // Migrar border-radius
  Object.entries(borderRadiusMappings).forEach(([oldRadius, newVar]) => {
    const regex = new RegExp(`border-radius:\\s*${oldRadius.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    if (content.includes(`border-radius: ${oldRadius}`)) {
      content = content.replace(regex, `border-radius: ${newVar}`);
      changes++;
    }
  });
  
  // Migrar font-size
  Object.entries(fontSizeMappings).forEach(([oldSize, newVar]) => {
    const regex = new RegExp(`font-size:\\s*${oldSize.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
    if (content.includes(`font-size: ${oldSize}`)) {
      content = content.replace(regex, `font-size: ${newVar}`);
      changes++;
    }
  });
  
  // Migrar font-weight
  Object.entries(fontWeightMappings).forEach(([oldWeight, newVar]) => {
    const regex = new RegExp(`font-weight:\\s*${oldWeight}`, 'gi');
    if (content.includes(`font-weight: ${oldWeight}`)) {
      content = content.replace(regex, `font-weight: ${newVar}`);
      changes++;
    }
  });
  
  // Migrar transiciones
  Object.entries(transitionMappings).forEach(([oldTransition, newVar]) => {
    if (content.includes(oldTransition)) {
      content = content.replace(new RegExp(oldTransition.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), newVar);
      changes++;
    }
  });
  
  // Crear backup y escribir archivo migrado
  if (changes > 0) {
    const backupPath = filePath + '.backup';
    fs.writeFileSync(backupPath, fs.readFileSync(filePath));
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${changes} cambios aplicados. Backup creado: ${backupPath}`);
  } else {
    console.log(`ℹ️  Sin cambios necesarios`);
  }
  
  return changes;
}

/**
 * Analiza un directorio recursivamente
 */
function analyzeDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  let totalChanges = 0;
  
  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      totalChanges += analyzeDirectory(fullPath);
    } else if (item.endsWith('.css') && !item.includes('globals.css') && !item.includes('migration-example.css')) {
      totalChanges += migrateCSSFile(fullPath);
    }
  });
  
  return totalChanges;
}

/**
 * Genera reporte de migración
 */
function generateReport(srcPath) {
  console.log('\n📊 REPORTE DE MIGRACIÓN');
  console.log('========================');
  
  const cssFiles = [];
  
  function findCSSFiles(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        findCSSFiles(fullPath);
      } else if (item.endsWith('.css') && !item.includes('globals.css')) {
        cssFiles.push({
          path: fullPath,
          size: stat.size,
          lastModified: stat.mtime
        });
      }
    });
  }
  
  findCSSFiles(srcPath);
  
  console.log(`📁 Archivos CSS encontrados: ${cssFiles.length}`);
  cssFiles.forEach(file => {
    console.log(`   • ${file.path.replace(srcPath, '')} (${(file.size / 1024).toFixed(1)}KB)`);
  });
  
  console.log('\n🎯 PATRONES A MIGRAR:');
  console.log('   • Colores: ', Object.keys(colorMappings).length, 'mappings');
  console.log('   • Espaciado: ', Object.keys(spacingMappings).length, 'mappings');
  console.log('   • Border radius: ', Object.keys(borderRadiusMappings).length, 'mappings');
  console.log('   • Font sizes: ', Object.keys(fontSizeMappings).length, 'mappings');
  console.log('   • Transiciones: ', Object.keys(transitionMappings).length, 'mappings');
}

/**
 * Función principal
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const srcPath = args[1] || './src';
  
  console.log('🎨 SISTEMA DE MIGRACIÓN - SyncKuroPOS');
  console.log('=====================================\n');
  
  switch (command) {
    case 'analyze':
      console.log('🔍 ANALIZANDO PROYECTO...\n');
      generateReport(srcPath);
      break;
      
    case 'migrate':
      console.log('🚀 INICIANDO MIGRACIÓN...\n');
      const totalChanges = analyzeDirectory(srcPath);
      console.log(`\n🎉 MIGRACIÓN COMPLETADA!`);
      console.log(`Total de cambios aplicados: ${totalChanges}`);
      console.log(`\n📋 PRÓXIMOS PASOS:`);
      console.log(`1. Revisar los archivos .backup creados`);
      console.log(`2. Testear la aplicación`);
      console.log(`3. Importar globals.css en tu aplicación`);
      console.log(`4. Refactorizar componentes para usar clases utilitarias`);
      break;
      
    case 'revert':
      console.log('⏪ REVIRTIENDO CAMBIOS...\n');
      // Lógica para revertir usando archivos .backup
      console.log('Funcionalidad de revert en desarrollo');
      break;
      
    default:
      console.log('📖 USO:');
      console.log('  node migration-script.js analyze [ruta]   - Analizar archivos CSS');
      console.log('  node migration-script.js migrate [ruta]   - Migrar archivos CSS');
      console.log('  node migration-script.js revert [ruta]    - Revertir cambios');
      console.log('');
      console.log('📁 Ruta por defecto: ./src');
      console.log('');
      console.log('💡 EJEMPLO:');
      console.log('  node migration-script.js analyze ./src/components');
      console.log('  node migration-script.js migrate ./src');
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  migrateCSSFile,
  analyzeDirectory,
  colorMappings,
  spacingMappings,
  borderRadiusMappings,
  fontSizeMappings,
  transitionMappings
};