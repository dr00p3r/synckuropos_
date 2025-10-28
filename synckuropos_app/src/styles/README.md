# 🎨 Sistema de Diseño Global - SyncKuroPOS

Este archivo documenta el sistema de diseño global de SyncKuroPOS, preparado para la migración a Tailwind CSS.

## 📁 Archivos del Sistema

- `src/styles/globals.css` - Variables CSS y utilidades globales
- `src/styles/index.css` - Estilos base de la aplicación
- Este README - Documentación de uso

## 🎯 Objetivo

Crear un sistema de diseño consistente que:
1. Elimine la duplicación de estilos
2. Mantenga consistencia visual en toda la aplicación
3. Facilite la migración futura a Tailwind CSS
4. Mejore la mantenibilidad del código

## 🏗️ Estructura del Sistema

### Variables CSS Globales

Todas las variables están definidas en `:root` y organizadas por categorías:

#### Colores
```css
/* Colores principales */
--color-primary: #2A423E;           /* Verde corporativo */
--color-primary-light: #547771;     /* Verde claro */
--color-primary-dark: #1f332f;      /* Verde oscuro */

/* Colores de texto */
--color-text-primary: #374151;      /* Texto principal */
--color-text-secondary: #6b7280;    /* Texto secundario */
--color-text-muted: #9ca3af;        /* Texto atenuado */

/* Colores de estado */
--color-success: #16a34a;           /* Verde éxito */
--color-error: #dc2626;             /* Rojo error */
--color-warning: #f59e0b;           /* Amarillo advertencia */
--color-info: #3b82f6;              /* Azul información */
```

#### Espaciado
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

#### Tipografía
```css
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
```

## 🧩 Componentes Base

### Botones
```html
<!-- Botón principal -->
<button class="btn-base btn-primary">Guardar</button>

<!-- Botón secundario -->
<button class="btn-base btn-secondary">Cancelar</button>

<!-- Botón de éxito -->
<button class="btn-base btn-success">Crear</button>

<!-- Botón de error -->
<button class="btn-base btn-error">Eliminar</button>

<!-- Botón ghost -->
<button class="btn-base btn-ghost">Volver</button>

<!-- Tamaños -->
<button class="btn-base btn-primary btn-sm">Pequeño</button>
<button class="btn-base btn-primary">Normal</button>
<button class="btn-base btn-primary btn-lg">Grande</button>
```

### Formularios
```html
<div class="form-field">
  <label class="form-label">Nombre del producto</label>
  <input class="form-input" type="text" placeholder="Ingrese el nombre">
</div>

<div class="form-field">
  <label class="form-label">Descripción</label>
  <textarea class="form-input form-textarea" placeholder="Descripción del producto"></textarea>
</div>
```

### Cards
```html
<div class="card">
  <div class="card-header">
    <h3>Título de la tarjeta</h3>
  </div>
  <div class="card-body">
    <p>Contenido de la tarjeta</p>
  </div>
  <div class="card-footer">
    <button class="btn-base btn-primary">Acción</button>
  </div>
</div>
```

### Badges
```html
<span class="badge badge-success">Activo</span>
<span class="badge badge-error">Inactivo</span>
<span class="badge badge-warning">Bajo Stock</span>
<span class="badge badge-info">Información</span>
```

### Toggles/Switches
```html
<label class="toggle-container">
  <input type="checkbox" class="toggle-input">
  <span class="toggle-slider"></span>
  <span>Producto activo</span>
</label>
```

### Tablas
```html
<div class="table-container custom-scrollbar">
  <table class="table">
    <thead>
      <tr>
        <th class="table-header">Código</th>
        <th class="table-header">Nombre</th>
        <th class="table-header">Precio</th>
      </tr>
    </thead>
    <tbody>
      <tr class="table-row">
        <td class="table-cell">P001</td>
        <td class="table-cell">Producto 1</td>
        <td class="table-cell">$25.00</td>
      </tr>
    </tbody>
  </table>
</div>
```

## 🛠️ Utilidades CSS

### Tipografía
```html
<p class="text-xs">Texto extra pequeño</p>
<p class="text-sm">Texto pequeño</p>
<p class="text-base">Texto normal</p>
<p class="text-lg">Texto grande</p>

<p class="font-normal">Peso normal</p>
<p class="font-medium">Peso medio</p>
<p class="font-semibold">Peso semi-negrita</p>
<p class="font-bold">Peso negrita</p>

<p class="text-primary">Texto principal</p>
<p class="text-secondary">Texto secundario</p>
<p class="text-success">Texto éxito</p>
<p class="text-error">Texto error</p>
```

### Espaciado
```html
<div class="m-0">Sin margen</div>
<div class="m-sm">Margen pequeño</div>
<div class="m-md">Margen medio</div>

<div class="p-0">Sin padding</div>
<div class="p-sm">Padding pequeño</div>
<div class="p-md">Padding medio</div>

<div class="mb-lg">Margen inferior grande</div>
<div class="mt-xl">Margen superior extra grande</div>
```

### Layout
```html
<div class="flex items-center justify-between">
  <span>Izquierda</span>
  <span>Derecha</span>
</div>

<div class="grid grid-cols-2 gap-md">
  <div>Columna 1</div>
  <div>Columna 2</div>
</div>

<div class="w-full h-full overflow-auto">
  Contenido que llena todo el espacio
</div>
```

## 📱 Responsividad

### Breakpoints
- `--breakpoint-sm: 480px`
- `--breakpoint-md: 768px`
- `--breakpoint-lg: 1024px`
- `--breakpoint-xl: 1280px`

### Utilidades Responsive
```html
<div class="mobile-hidden">Solo visible en desktop</div>
<div class="tablet-hidden">Oculto en tablets</div>
<div class="desktop-only">Solo en desktop</div>

<div class="grid-cols-4 tablet:grid-cols-2 mobile:grid-cols-1">
  Grid responsive
</div>
```

## 🎭 Estados Especiales

### Estados de Inventario
```html
<span class="badge stock-normal">Stock Normal</span>
<span class="badge stock-low">Stock Bajo</span>
<span class="badge stock-zero">Sin Stock</span>

<tr class="table-row out-of-stock">
  <td>Producto sin stock</td>
</tr>
```

### Loading States
```html
<div class="loading-spinner"></div>

<div class="flex items-center justify-center">
  <div class="loading-spinner"></div>
  <span class="ml-sm">Cargando...</span>
</div>
```

## 🚀 Migración desde CSS Existente

### Antes (CSS individual)
```css
.my-button {
  background: linear-gradient(135deg, #2A423E 0%, #547771 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}
```

### Después (utilizando el sistema)
```html
<button class="btn-base btn-primary">Mi Botón</button>
```

### Migración Gradual
1. **Identificar componentes repetidos** en tu CSS actual
2. **Reemplazar con clases del sistema** cuando sea posible
3. **Usar variables CSS** para colores, espaciado y tipografía
4. **Mantener CSS custom** solo para casos específicos

## 🎨 Preparación para Tailwind

Este sistema está diseñado para facilitar la migración a Tailwind CSS:

### Mapeo de Clases
```
/* Sistema actual → Tailwind */
.btn-base → @apply px-6 py-3 rounded-lg font-semibold
.text-primary → text-gray-700
.bg-primary → bg-green-800
.m-md → m-4
.p-lg → p-6
.flex → flex
.items-center → items-center
```

### Variables de Color para Tailwind Config
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2A423E',
          light: '#547771',
          dark: '#1f332f',
        },
        success: '#16a34a',
        error: '#dc2626',
        warning: '#f59e0b',
        info: '#3b82f6',
      }
    }
  }
}
```

## ♿ Accesibilidad

El sistema incluye:
- **Focus visible** para navegación por teclado
- **Alto contraste** para usuarios con necesidades especiales
- **Reduced motion** para usuarios sensibles al movimiento
- **Screen reader** optimizado con clases `.sr-only`

## 🎯 Mejores Prácticas

### 1. Usar Variables CSS
```css
/* ❌ Evitar valores hardcodeados */
.my-component {
  color: #374151;
  margin: 16px;
}

/* ✅ Usar variables del sistema */
.my-component {
  color: var(--color-text-primary);
  margin: var(--spacing-md);
}
```

### 2. Componentes Base
```css
/* ❌ Crear estilos desde cero */
.custom-button {
  /* 20 líneas de CSS... */
}

/* ✅ Extender componentes base */
.custom-button {
  @extend .btn-base, .btn-primary;
  /* Solo personalizaciones específicas */
}
```

### 3. Utilidades First
```html
<!-- ❌ CSS custom para layout simple -->
<div class="my-custom-flex-container">

<!-- ✅ Utilidades de layout -->
<div class="flex items-center justify-between gap-md">
```

## 🔧 Comandos Útiles

```bash
# Buscar componentes que necesitan migración
grep -r "background.*#" src/ --include="*.css"

# Encontrar colores hardcodeados
grep -r "color.*#" src/ --include="*.css"

# Buscar espaciado manual
grep -r "padding.*px\|margin.*px" src/ --include="*.css"
```

## 📚 Referencias

- [CSS Custom Properties (Variables)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Design System Principles](https://designsystemsrepo.com/design-systems/)

---

**Próximos pasos:**
1. Implementar el sistema en componentes existentes
2. Refactorizar CSS repetitivo
3. Preparar migración a Tailwind CSS
4. Documentar componentes específicos de negocio