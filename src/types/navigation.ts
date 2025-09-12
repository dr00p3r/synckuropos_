// Tipos y interfaces para el componente SideNavigation
export type UserRole = 'admin' | 'cajero';

export interface SideNavigationProps {
  userRole: UserRole;
  activeView: string;
  onNavigate?: (view: string) => void;
}

export interface MenuOption {
  id: string;
  label: string;
  icon: string; // Nombre del icono
  roles: UserRole[];
}

export type ViewType = 'venta' | 'inventario' | 'clientes' | 'reportes' | 'ajustes';
