# Sistema de Combos - Documentación

## Descripción General

El sistema de combos permite ofrecer precios especiales cuando se vende una cantidad específica de un producto. Los combos se calculan automáticamente durante el proceso de venta, optimizando el precio final para el cliente.

## Características Principales

### 1. Validación de Unicidad
- **Solo un combo por cantidad**: No se puede crear más de un combo con la misma cantidad para un producto.
- **Validación en tiempo real**: El sistema valida al intentar agregar un combo y muestra un error descriptivo si ya existe.

### 2. Cálculo Automático de Precios
El sistema aplica combos automáticamente usando un algoritmo de optimización:

```
Ejemplo con producto base $1.00:
- Combo 10 unidades = $8.00
- Combo 5 unidades = $4.50

Si vendes 17 unidades:
1. Aplica 1 combo de 10 = $8.00 (quedan 7 unidades)
2. Aplica 1 combo de 5 = $4.50 (quedan 2 unidades)
3. Las 2 restantes al precio base = $2.00
Total = $14.50 (vs $17.00 sin combos)
```

### 3. Algoritmo de Optimización
- **Ordenamiento descendente**: Los combos se evalúan de mayor a menor cantidad.
- **Aplicación greedy**: Se usa el combo más grande posible primero.
- **Residuo al precio base**: Las unidades que no completan un combo se cobran al precio unitario normal.

## Flujo de Trabajo

### Al Crear Combos (Inventario)
1. Seleccionar un producto
2. Ingresar cantidad del combo (ej: 5)
3. Ingresar precio del combo (ej: $4.50)
4. El sistema valida que no exista otro combo con la misma cantidad
5. Guardar combo

### Al Vender (POS)
1. Escanear o buscar producto
2. El sistema obtiene automáticamente los combos activos del producto
3. Calcula el precio óptimo usando el algoritmo
4. Muestra etiquetas visuales con los combos aplicados
5. Al cambiar cantidad, recalcula automáticamente

### Interfaz Visual
Los combos aplicados se muestran como etiquetas verdes debajo del nombre del producto:
```
🔵 Producto: Cerveza Pilsener
   ✅ 2×10 = $16.00
   ✅ 1×5 = $4.50
```

## Estructura de Datos

### ComboProduct (Base de Datos)
```typescript
{
  comboProductId: string;
  productId: string;
  comboQuantity: number;      // Cantidad del combo
  comboPrice: number;          // Precio en centavos
  isActive: boolean;
  _deleted: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### SaleItem (Ventas)
```typescript
{
  productId: string;
  name: string;
  unitPrice: number;           // Precio base unitario
  quantity: number;            // Cantidad total
  totalPrice: number;          // Precio calculado con combos
  combosApplied?: ComboBreakdown[]; // Detalle de combos usados
}
```

### ComboBreakdown
```typescript
{
  comboQuantity: number;       // Tamaño del combo (ej: 5)
  comboPrice: number;          // Precio del combo (ej: $4.50)
  combosUsed: number;          // Cuántas veces se aplicó (ej: 2)
}
```

## Archivos Modificados

### Backend/Repositorios
- **productRepository.ts**: 
  - `addCombo()`: Validación de unicidad
  - `getActiveCombosByProduct()`: Obtener combos ordenados

### Hooks de Ventas
- **useSalesLogic.ts**: 
  - `calculatePriceWithCombos()`: Algoritmo de optimización
  - `addProductToSale()`: Integración con combos

- **useSaleItemsLogic.ts**: 
  - `updateItemQuantity()`: Recalcular al cambiar cantidad

### Componentes UI
- **SaleItemsTable.tsx**: 
  - Visualización de combos aplicados con Tags

### Tipos
- **types.ts**: 
  - `SaleItem`: Añadido campo `combosApplied`
  - `ComboBreakdown`: Nuevo tipo para detalles

## Casos de Uso

### Caso 1: Producto sin combos
```
Precio base: $1.50
Cantidad: 3
Total: $4.50 (3 × $1.50)
```

### Caso 2: Producto con combo exacto
```
Precio base: $1.00
Combo: 6 unidades = $5.00
Cantidad: 6
Total: $5.00 (ahorro: $1.00)
```

### Caso 3: Múltiples combos
```
Precio base: $2.00
Combos:
  - 12 unidades = $20.00
  - 6 unidades = $11.00
  - 3 unidades = $5.50

Cantidad: 25
Cálculo:
  - 2×12 = $40.00 (quedan 1)
  - 0×6 = $0.00 (no alcanza)
  - 0×3 = $0.00 (no alcanza)
  - 1×$2.00 = $2.00
Total: $42.00
```

## Ventajas del Sistema

1. ✅ **Automático**: No requiere intervención del cajero
2. ✅ **Transparente**: Muestra qué combos se aplicaron
3. ✅ **Óptimo**: Siempre usa la mejor combinación
4. ✅ **Flexible**: Soporta cualquier cantidad y precio
5. ✅ **Seguro**: Valida datos antes de guardar
6. ✅ **Reactivo**: Recalcula en tiempo real al cambiar cantidad

## Consideraciones Técnicas

- Los precios se almacenan en **centavos** para evitar errores de punto flotante
- Los combos se ordenan por `comboQuantity` descendente
- La búsqueda de combos es O(n) donde n es el número de combos del producto
- Los combos se obtienen frescos de la BD en cada operación para garantizar consistencia
