# Vista General de Reportes - SyncKuroPOS

## 📊 Descripción

Sistema de reportes offline-first para el POS con arquitectura modular y extensible. Esta implementación proporciona el marco base que heredarán todos los submódulos de reportes.

## 🚀 Características Implementadas

### ✅ Estado Global de Rangos de Fechas
- Context Provider para manejo centralizado de fechas
- Persistencia automática en localStorage
- Presets predefinidos: Hoy, Última semana, Último mes, Último trimestre, Último año
- Soporte para rangos personalizados con selector de fechas

### ✅ Selector de Rangos Avanzado
- Interfaz intuitiva con botones de acceso rápido
- **Selector personalizado con inputs date nativos**
- Modal/dialog para rangos personalizados con validación
- Visualización clara del rango actual con iconos SVG

### ✅ Tarjetas KPI con Acordeones
- **Ventas**: Total vendido, número de ventas, ticket promedio
- **Rentabilidad**: Ingresos, costos, ganancia, margen porcentual
- **Inventario**: Entradas, salidas, movimiento neto
- Datos en tiempo real desde RxDB
- **Iconos SVG profesionales** reemplazando emojis

### ✅ Formateo y Localización
- Formato de moneda: USD para Ecuador (es-EC)
- Formato de fechas localizadas
- Formato de cantidades y porcentajes
- Utilidades reutilizables

### ✅ Diseño Responsivo Optimizado
- **Control de altura**: El contenido nunca supera la altura de pantalla
- **Título oculto en desktop** para maximizar espacio
- Grid responsive que se adapta a cualquier pantalla
- **Colores consistentes** con el estilo de la aplicación
- Estados de carga y error
- Accesibilidad ARIA completa
- Soporte para modo oscuro y contraste alto

## 🎨 Mejoras de UX/UI

### Iconos SVG Consistentes
- ✅ Calendario para selector de fechas
- ✅ Carrito de compras para ventas  
- ✅ Símbolo de dólar para rentabilidad
- ✅ Caja 3D para inventario
- ✅ Iconos de tendencia (subida/bajada/neutral)
- ✅ Iconos de estado (expandir, contraer, advertencia)

### Control de Altura y Scroll
- Layout principal con `height: 100vh`
- Contenido principal con `overflow-y: auto` 
- Flexbox optimizado para evitar desbordamiento
- Scrollbar personalizada con estilo de la app

### Colores del Sistema
```css
--sidebar-bg: #2A423E        /* Verde principal */
--sidebar-active-bg: #547771 /* Verde activo */
--sidebar-text: #F0EFE7      /* Texto claro */
--sidebar-hover: rgba(84, 119, 113, 0.5) /* Hover */
```

## 📁 Estructura de Archivos

```
src/components/Reports/
├── ReportsPage.tsx              # Layout principal
├── ReportsPage.css             # Estilos del layout
├── DateRangePicker.tsx         # Selector de fechas
├── DateRangePicker.css         # Estilos del selector
├── KPICard.tsx                 # Componente base de tarjeta
├── KPICard.css                 # Estilos de tarjetas
├── KPICards.tsx                # Tarjetas específicas (Ventas, Rentabilidad, Inventario)
└── __tests__/
    └── reports.test.ts         # Tests básicos

src/contexts/
└── DateRangeContext.tsx        # Context global de rangos

src/hooks/
└── useReportsKPIs.ts          # Hooks para datos de KPIs

src/utils/
└── formatters.ts              # Utilidades de formato
```

## 🔧 Integración en la Aplicación

### 1. Actualizar App.tsx

Reemplaza la línea del caso 'reportes' en el switch de `renderContent()`:

```tsx
case 'reportes':
  return <ReportsPage />
```

### 2. Importar el componente

Agrega al inicio de App.tsx:

```tsx
import { ReportsPage } from './components/Reports/ReportsPage'
```

### 3. Configurar el Provider (Opcional)

Si quieres que el contexto de fechas esté disponible globalmente, envuelve tu App con DateRangeProvider:

```tsx
// En main.tsx o App.tsx
import { DateRangeProvider } from './contexts/DateRangeContext'

<DateRangeProvider>
  <App />
</DateRangeProvider>
```

## 🎯 API del Estado Global

### Context: DateRangeContext

```tsx
interface DateRangeContextType {
  range: DateRange;                    // Rango actual
  currentPreset: PresetKey | 'custom'; // Preset activo
  setRange: (range: DateRange) => void; // Cambiar rango manualmente
  setPreset: (presetKey: PresetKey) => void; // Aplicar preset
}

type PresetKey = 'today' | 'lastWeek' | 'lastMonth' | 'lastQuarter' | 'lastYear';
```

### Hook: useDateRange()

```tsx
const { range, currentPreset, setRange, setPreset } = useDateRange();
```

## 📊 Hooks de KPIs

### useSalesKPIs()
```tsx
const { totalSales, salesCount, averageTicket, loading, error } = useSalesKPIs();
```

### useProfitabilityKPIs()
```tsx
const { totalRevenue, totalCost, grossProfit, profitMargin, loading, error } = useProfitabilityKPIs();
```

### useInventoryKPIs()
```tsx
const { totalInflows, totalOutflows, netMovement, loading, error } = useInventoryKPIs();
```

## 🎨 Utilidades de Formato

```tsx
import { formatCurrency, formatDate, formatQty, formatPercentage } from './utils/formatters';

formatCurrency(1500)     // "$15.00"
formatQty(10.5)          // "10.5"
formatPercentage(0.15)   // "15.0%"
formatDate(new Date())   // "21 sep 2025"
```

## 🧪 Testing

Para ejecutar los tests básicos:

```bash
# En la consola del navegador o en Node.js
import { runAllTests } from './components/Reports/__tests__/reports.test';
runAllTests();
```

## 🔮 Próximos Pasos

Esta implementación proporciona la base para:

1. **Detalles de Ventas**: Gráficos, tablas, filtros por producto/cliente
2. **Análisis de Rentabilidad**: Costos por producto, márgenes detallados
3. **Reportes de Inventario**: Movimientos, rotación, alertas de stock
4. **Exportación**: PDF, Excel, impresión
5. **Filtros Avanzados**: Por usuario, categoría, método de pago

## 🔧 Criterios de Aceptación Cumplidos

- ✅ Rango por defecto = Hoy
- ✅ Cambiar rango actualiza KPIs automáticamente
- ✅ Estilo y API listos para reutilización
- ✅ Tarjetas como acordeones (expandibles)
- ✅ Formato es-EC USD
- ✅ Diseño mobile-first con accesibilidad
- ✅ Persistencia en localStorage
- ✅ Datos reales desde RxDB

## 🐛 Solución de Problemas

### Errores de JSX
Si ves errores de JSX, verifica que el proyecto esté configurado correctamente:
- `tsconfig.app.json` debe tener `"jsx": "react-jsx"`
- Los archivos deben tener extensión `.tsx`

### Datos no aparecen
- Verifica que la base de datos esté inicializada
- Revisa la consola para errores de consulta RxDB
- Confirma que hay datos de prueba en las colecciones

### Problemas de persistencia
- Verifica que localStorage esté habilitado
- Los datos se guardan automáticamente al cambiar rangos