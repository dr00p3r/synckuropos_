# Pantalla de Configuración (Settings) - Documentación

## Descripción General

La pantalla de configuración (`SettingsScreen`) proporciona una interfaz completa para la gestión de usuarios y configuraciones personales en la aplicación POS. Está dividida en dos secciones principales:

1. **Cambiar Mi Contraseña** - Disponible para todos los usuarios
2. **Gestión de Usuarios** - Disponible solo para administradores

## Arquitectura de Seguridad

### Hashing de Contraseñas
- ✅ **bcrypt.js**: Utiliza la librería estándar de la industria para el hashing seguro de contraseñas
- ✅ **Salt rounds**: Configurado con 10 rondas para balance entre seguridad y rendimiento
- ✅ **Nunca se almacenan contraseñas en texto plano**

### Autenticación
- ✅ **Hook useAuth()**: Maneja toda la lógica de autenticación de forma centralizada
- ✅ **localStorage**: Persistencia segura de sesión de usuario
- ✅ **Verificación de roles**: Renderizado condicional basado en permisos

## Componentes Incluidos

### 1. SettingsScreen.tsx
**Ubicación**: `src/components/Settings/SettingsScreen.tsx`

Componente principal que contiene:
- Formulario de cambio de contraseña con validaciones
- Lista de usuarios (solo para admins)
- Botón para crear nuevos usuarios (solo para admins)

**Props**: Ninguna (utiliza hooks internos)

**Hooks utilizados**:
- `useAuth()` - Para gestión de autenticación
- `useState()` - Para manejo de estado local
- `useEffect()` - Para cargar datos al montar el componente

### 2. CreateUserModal.tsx
**Ubicación**: `src/components/Settings/CreateUserModal.tsx`

Modal para la creación de nuevos usuarios que incluye:
- Formulario completo con validaciones
- Selección de rol (admin/cajero)
- Hashing automático de contraseñas

**Props**:
```typescript
interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

### 3. useAuth.tsx
**Ubicación**: `src/hooks/useAuth.tsx`

Hook personalizado que proporciona:
- `currentUser` - Usuario actualmente logueado
- `login()` - Función para iniciar sesión
- `logout()` - Función para cerrar sesión
- `updateUserPassword()` - Función para cambiar contraseñas
- `createUser()` - Función para crear nuevos usuarios
- `getAllUsers()` - Función para obtener lista de usuarios

## Instalación y Configuración

### 1. Instalar Dependencias
```bash
npm install bcryptjs @types/bcryptjs
```

### 2. Configurar Providers
Asegúrate de que tu aplicación esté envuelta con los providers necesarios:

```tsx
// App.tsx o main.tsx
import { DatabaseProvider } from './hooks/useDatabase';
import { ToastProvider } from './components/Toast/ToastProvider';
import { AuthProvider } from './hooks/useAuth';

function App() {
  return (
    <DatabaseProvider>
      <ToastProvider>
        <AuthProvider>
          {/* Tu aplicación aquí */}
        </AuthProvider>
      </ToastProvider>
    </DatabaseProvider>
  );
}
```

### 3. Importar y Usar
```tsx
import { SettingsScreen } from './components/Settings';

// En tu componente de navegación o router
<SettingsScreen />
```

## Funcionalidades Implementadas

### ✅ Cambio de Contraseña
- Verificación de contraseña actual
- Validación de nueva contraseña (mínimo 6 caracteres)
- Confirmación de contraseña
- Hashing automático con bcrypt
- Actualización en base de datos RxDB
- Notificaciones de éxito/error via toast

### ✅ Gestión de Usuarios (Solo Admins)
- Visualización de lista de usuarios
- Información mostrada: username, rol, fecha de creación, estado
- Identificación del usuario actual
- Botón para crear nuevos usuarios

### ✅ Creación de Usuarios
- Modal con formulario completo
- Validaciones de entrada:
  - Username único (mínimo 3 caracteres)
  - Contraseña segura (mínimo 6 caracteres)
  - Confirmación de contraseña
  - Selección de rol
- Hashing automático de contraseñas
- Inserción en base de datos RxDB

### ✅ Renderizado Condicional
- Sección de gestión de usuarios solo visible para admins
- Validación de permisos en tiempo real
- Interfaz adaptativa según el rol del usuario

### ✅ Validaciones de Seguridad
- Verificación de contraseñas actuales antes de cambios
- Prevención de usuarios duplicados
- Validación de longitud mínima de contraseñas
- Sanitización de entradas de formulario

### ✅ Responsive Design
- Diseño adaptativo para dispositivos móviles
- Tablas que se convierten en cards en pantallas pequeñas
- Botones y formularios optimizados para touch

## Estilos CSS

### SettingsScreen.css
- Diseño moderno con esquema de colores corporativo
- Secciones bien definidas con cards
- Tabla responsive para lista de usuarios
- Estados hover y focus para mejor UX

### CreateUserModal.css
- Modal centrado con overlay
- Animaciones suaves de entrada/salida
- Formulario bien estructurado
- Indicadores visuales de validación

## Consideraciones de Seguridad

1. **Nunca se exponen contraseñas**: Todas las contraseñas se hashean inmediatamente
2. **Verificación de permisos**: Solo admins pueden ver/crear usuarios
3. **Validación de entrada**: Sanitización y validación en cliente y lógica
4. **Sesiones seguras**: Manejo apropiado de tokens de sesión
5. **Feedback de errores**: Mensajes informativos sin exponer detalles sensibles

## Uso en Producción

### Recomendaciones:
1. **Configurar HTTPS** para proteger la transmisión de datos
2. **Implementar rate limiting** para prevenir ataques de fuerza bruta
3. **Logs de auditoría** para rastrear cambios de usuarios
4. **Políticas de contraseñas** más estrictas si es necesario
5. **Backup regular** de la base de datos de usuarios

### Extensiones Futuras:
- Recuperación de contraseñas via email
- Autenticación de dos factores
- Roles más granulares
- Historial de cambios de usuarios
- Desactivación temporal de usuarios

## Ejemplo de Integración

```tsx
// En tu componente de navegación principal
import { useAuth } from '../hooks/useAuth';
import { SettingsScreen } from '../components/Settings';

const Navigation = () => {
  const { currentUser } = useAuth();
  
  // Solo mostrar configuración si hay usuario logueado
  if (!currentUser) return <LoginScreen />;
  
  return (
    <div>
      <SideNavigation />
      <SettingsScreen />
    </div>
  );
};
```

---

**Desarrollado con 💚 siguiendo las mejores prácticas de seguridad y desarrollo frontend**