# Componente SideNavigation

Este es un componente de menú de navegación lateral totalmente funcional para React con TypeScript que implementa un sistema de navegación basado en roles para el sistema SyncKuroPOS.

## Características Principales

### 🔐 Sistema de Roles
- **Administrador ('admin')**: Acceso a todas las opciones (Venta, Inventario, Clientes, Reportes, Ajustes)
- **Cajero ('cajero')**: Acceso limitado (Venta, Ajustes)

### 📱 Diseño Responsive
- **Desktop (>768px)**: Menú siempre visible en el lado derecho (30% del ancho)
- **Móvil (≤768px)**: Menú oculto con botón hamburguesa, se desliza desde la derecha (60% del ancho)

### 🎨 Diseño Visual
- Colores corporativos: `#2A423E` (fondo), `#547771` (activo), `#F0EFE7` (texto)
- Iconos intuitivos para cada opción
- Animaciones suaves y transiciones
- Efectos hover y estados activos

## Uso del Componente

```tsx
import SideNavigation from './components/SideNavigation';
import { useState } from 'react';

function App() {
  const [currentView, setCurrentView] = useState('venta');
  const [userRole, setUserRole] = useState<'admin' | 'cajero'>('admin');

  const handleNavigation = (view: string) => {
    setCurrentView(view);
    // Aquí puedes agregar lógica adicional para cambiar vistas
  };

  return (
    <div>
      {/* Tu contenido principal */}
      <main>
        {/* Contenido de la aplicación */}
      </main>

      {/* Componente de navegación */}
      <SideNavigation 
        userRole={userRole}
        activeView={currentView}
        onNavigate={handleNavigation}
      />
    </div>
  );
}
```

## Props del Componente

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `userRole` | `'admin' \| 'cajero'` | ✅ | Define qué opciones del menú serán visibles |
| `activeView` | `string` | ✅ | Indica cuál opción está actualmente seleccionada |
| `onNavigate` | `(view: string) => void` | ❌ | Callback que se ejecuta cuando se selecciona una opción |

## Opciones del Menú

| Opción | ID | Icono | Disponible para Admin | Disponible para Cajero |
|--------|-------|-------|----------------------|----------------------|
| Venta | `'venta'` | 💰 | ✅ | ✅ |
| Inventario | `'inventario'` | 📦 | ✅ | ❌ |
| Clientes | `'clientes'` | 👥 | ✅ | ❌ |
| Reportes | `'reportes'` | 📊 | ✅ | ❌ |
| Ajustes | `'ajustes'` | ⚙️ | ✅ | ✅ |

## Archivos del Componente

```
src/
├── components/
│   ├── SideNavigation.tsx          # Componente principal
│   └── SideNavigation.module.css   # Estilos CSS Modules
└── types/
    └── navigation.ts               # Tipos TypeScript
```

## Características Técnicas

### 🛠️ Tecnologías Utilizadas
- **React 19** con Hooks (useState, useEffect)
- **TypeScript** para tipado estático
- **CSS Modules** para estilos encapsulados
- **Responsive Design** con media queries

### ♿ Accesibilidad
- Navegación por teclado completa
- Estados de foco visibles
- Labels ARIA apropiados
- Soporte para `prefers-reduced-motion`

### 📱 Características Móviles
- Botón hamburguesa estilizado
- Overlay semi-transparente
- Cierre automático al seleccionar opción
- Detección automática de tamaño de pantalla
- Prevención de scroll del body cuando está abierto

### 🎨 Efectos Visuales
- Transiciones suaves de 0.3s
- Animaciones de entrada escalonadas
- Efectos hover con transformaciones
- Backdrop blur en el overlay móvil

## Personalización

### Cambiar Colores
Edita las variables CSS en `SideNavigation.module.css`:

```css
:root {
  --sidebar-bg: #2A423E;          /* Fondo principal */
  --sidebar-active-bg: #547771;   /* Fondo opción activa */
  --sidebar-text: #F0EFE7;        /* Color del texto */
  --sidebar-hover: rgba(84, 119, 113, 0.5); /* Hover */
}
```

### Agregar Nuevas Opciones
1. Edita el array `menuOptions` en `SideNavigation.tsx`
2. Agrega el nuevo ID al tipo `ViewType` en `navigation.ts`
3. Implementa la lógica correspondiente en tu componente padre

### Cambiar Breakpoint Responsive
Modifica las media queries en el CSS:

```css
@media (max-width: 768px) { /* Cambia 768px por tu valor preferido */ }
```

## Ejemplo de Implementación Completa

El archivo `App.tsx` incluye un ejemplo completo de cómo integrar el componente con:
- Cambio dinámico de roles
- Renderizado condicional de contenido
- Gestión de estado de la vista activa
- Layout responsive apropiado

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar linter
npm run lint
```

## Navegador de Desarrollo

Una vez ejecutado `npm run dev`, visita `http://localhost:5173` para ver el componente en acción.

**Funcionalidades de prueba:**
- Botón para cambiar entre roles Admin/Cajero
- Navegación entre diferentes vistas
- Responsive design (redimensiona la ventana)
- Botón hamburguesa en móvil
