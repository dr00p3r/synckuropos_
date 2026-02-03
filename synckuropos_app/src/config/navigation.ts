export interface MenuItem {
    id: string;
    label: string;
    icon: string; // Clase de PrimeIcons (ej: 'pi pi-home')
    path: string;
    roles: string[];
}

export const MENU_ITEMS: MenuItem[] = [
    { id: 'venta', label: 'Venta', icon: 'pi pi-shopping-cart', path: '/', roles: ['admin', 'cajero'] },
    { id: 'inventario', label: 'Inventario', icon: 'pi pi-box', path: '/inventory', roles: ['admin'] },
    { id: 'clientes', label: 'Clientes', icon: 'pi pi-users', path: '/customers', roles: ['admin'] },
    { id: 'reportes', label: 'Reportes', icon: 'pi pi-chart-bar', path: '/reports', roles: ['admin'] },
];

export const SETTINGS_ITEM: MenuItem = {
    id: 'ajustes', label: 'Ajustes', icon: 'pi pi-cog', path: '/settings', roles: ['admin', 'cajero']
};