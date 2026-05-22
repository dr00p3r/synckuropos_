import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Ripple } from 'primereact/ripple';
import { MENU_ITEMS, SETTINGS_ITEM, type MenuItem } from '@/config/navigation';
import '@/styles/layout.css';

interface MainLayoutProps {
    children: React.ReactNode;
    userRole: string;
}

interface SidebarContentProps {
    userRole: string;
    location: ReturnType<typeof useLocation>;
    onNavigate: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ userRole, location, onNavigate }) => {
    const renderMenuItem = (item: MenuItem) => {
        if (!item.roles.includes(userRole)) return null;
        const isActive = location.pathname === item.path;
        return (
            <div key={item.id} className="mb-2">
                <Link to={item.path} className="no-underline" onClick={onNavigate}>
                    <div className={`nav-item p-ripple ${isActive ? 'active' : ''}`}>
                        <i className={`${item.icon} mr-3 text-xl`}></i>
                        <span className="font-medium">{item.label}</span>
                        <Ripple />
                    </div>
                </Link>
            </div>
        );
    };

    return (
        <div className="flex flex-column h-full">
            <div className="flex align-items-center gap-2 px-3 py-4 mb-3 border-bottom-1 border-white-alpha-10">
                <Avatar icon="pi pi-user" size="large" shape="circle" className="bg-white-alpha-20 text-white" />
                <div className="flex flex-column">
                    <span className="font-bold text-white">SyncKuro POS</span>
                    <span className="text-sm text-white-alpha-70">{userRole.toUpperCase()}</span>
                </div>
            </div>
            <div className="flex-1 px-3 overflow-y-auto">
                <span className="text-xs font-semibold text-white-alpha-50 mb-2 block uppercase">Menu</span>
                {MENU_ITEMS.map(renderMenuItem)}
            </div>
            <div className="p-3 mt-auto border-top-1 border-white-alpha-10">
                {renderMenuItem(SETTINGS_ITEM)}
            </div>
        </div>
    );
};

export const MainLayout: React.FC<MainLayoutProps> = ({
    children,
    userRole,
}) => {
    const location = useLocation();
    const [visibleMobile, setVisibleMobile] = useState(false);

    return (
        <div className="flex h-screen surface-ground overflow-hidden">
            {/* 1. CONTENIDO PRINCIPAL */}
            <div
                className="flex-1 flex flex-column min-h-0"
                style={{ marginRight: 'var(--sidebar-width)', transition: 'margin-right 0.3s ease' }}
            >
                {/* Topbar Móvil */}
                <div className="md:hidden flex align-items-center justify-content-between p-3 bg-white shadow-1 flex-shrink-0">
                    <span className="font-bold text-xl text-900">SyncKuro</span>
                    <Button icon="pi pi-bars" text rounded onClick={() => setVisibleMobile(true)} />
                </div>

                {/* Main: flex-1 + min-h-0 + overflow-hidden para que hijos controlen scroll */}
                <main className="flex-1 min-h-0 p-4 flex flex-column overflow-hidden">
                    {children}
                </main>
            </div>

            {/* 2. SIDEBAR DESKTOP */}
            <div className="hidden md:flex flex-column fixed right-0 top-0 h-full shadow-2 custom-sidebar w-18rem">
                <SidebarContent userRole={userRole} location={location} onNavigate={() => setVisibleMobile(false)} />
            </div>

            {/* Sidebar Móvil */}
            <Sidebar
                visible={visibleMobile}
                position="right"
                onHide={() => setVisibleMobile(false)}
                className="custom-sidebar w-18rem border-none"
            >
                <SidebarContent userRole={userRole} location={location} onNavigate={() => setVisibleMobile(false)} />
            </Sidebar>
        </div>
    );
};