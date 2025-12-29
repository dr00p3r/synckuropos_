export type MenuItem = {
    id: string;
    label: string;
    icon: string; // Clase de PrimeIcons (ej: 'pi pi-home')
    roles: string[];
};

export const MENU_ITEMS: MenuItem[] = [
    { id: 'venta', label: 'Venta', icon: 'pi pi-shopping-cart', roles: ['admin', 'cajero'] },
    { id: 'inventario', label: 'Inventario', icon: 'pi pi-box', roles: ['admin'] },
    { id: 'clientes', label: 'Clientes', icon: 'pi pi-users', roles: ['admin'] },
    { id: 'reportes', label: 'Reportes', icon: 'pi pi-chart-bar', roles: ['admin'] },
];

export const SETTINGS_ITEM: MenuItem = { 
    id: 'ajustes', label: 'Ajustes', icon: 'pi pi-cog', roles: ['admin', 'cajero'] 
};