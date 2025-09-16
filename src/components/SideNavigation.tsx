import React, { useState, useEffect, useRef } from 'react';
import type { SideNavigationProps, MenuOption } from '../types/navigation';
import './SideNavigation.css';

// Componente de icono SVG reutilizable
const Icon: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
  const icons = {
    venta: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5h13M17 17a2 2 0 1 1 4 0 2 2 0 0 1-4 0ZM9 17a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z"/>
      </svg>
    ),
    inventario: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    clientes: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    reportes: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18"/>
        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
      </svg>
    ),
    ajustes: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    )
  };

  return icons[name as keyof typeof icons] || null;
};

// Configuración de las opciones del menú (sin ajustes en la lista principal)
const menuOptions: MenuOption[] = [
  {
    id: 'venta',
    label: 'Venta',
    icon: 'venta',
    roles: ['admin', 'cajero']
  },
  {
    id: 'inventario',
    label: 'Inventario',
    icon: 'inventario',
    roles: ['admin']
  },
  {
    id: 'clientes',
    label: 'Clientes',
    icon: 'clientes',
    roles: ['admin']
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: 'reportes',
    roles: ['admin']
  }
];

// Opción de ajustes separada para el footer
const settingsOption: MenuOption = {
  id: 'ajustes',
  label: 'Ajustes',
  icon: 'ajustes',
  roles: ['admin', 'cajero']
};

const SideNavigation: React.FC<SideNavigationProps> = ({
  userRole,
  activeView,
  onNavigate,
  onSidebarWidthChange
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sideNavRef = useRef<HTMLElement>(null);

  // Detectar cambios en el tamaño de la pantalla
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Verificar inicialmente
    checkIsMobile();

    // Agregar listener para cambios de tamaño
    window.addEventListener('resize', checkIsMobile);

    // Cleanup del listener
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Cerrar menú cuando se cambie a desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMenuOpen(false);
    }
  }, [isMobile]);

  // Medir y reportar el ancho de la barra lateral en desktop
  useEffect(() => {
    if (!isMobile && onSidebarWidthChange && sideNavRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          onSidebarWidthChange(entry.contentRect.width);
        }
      });

      resizeObserver.observe(sideNavRef.current);

      // Medición inicial
      onSidebarWidthChange(sideNavRef.current.offsetWidth);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [isMobile, onSidebarWidthChange]);

  // Filtrar opciones según el rol del usuario (excluyendo ajustes)
  const filteredOptions = menuOptions.filter(option => 
    option.roles.includes(userRole)
  );

  // Verificar si el usuario tiene acceso a ajustes
  const hasSettingsAccess = settingsOption.roles.includes(userRole);

  // Manejar click en una opción del menú
  const handleOptionClick = (optionId: string) => {
    if (onNavigate) {
      onNavigate(optionId);
    }
    // Cerrar menú en móvil después de seleccionar
    if (isMobile) {
      setIsMenuOpen(false);
    }
  };

  // Alternar visibilidad del menú en móvil
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Cerrar menú al hacer click fuera (solo en móvil)
  const handleOverlayClick = () => {
    if (isMobile) {
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      {/* Botón hamburguesa (solo visible en móvil) */}
      {isMobile && (
        <button 
          className={"hamburgerButton"}
          onClick={toggleMenu}
          aria-label="Abrir menú de navegación"
        >
          <span className={"hamburgerLine"}></span>
          <span className={"hamburgerLine"}></span>
          <span className={"hamburgerLine"}></span>
        </button>
      )}

      {/* Overlay para cerrar el menú en móvil */}
      {isMobile && isMenuOpen && (
        <div 
          className={"overlay"}
          onClick={handleOverlayClick}
        />
      )}

      {/* Contenedor principal del menú */}
      <nav 
        ref={sideNavRef}
        className={`${"sideNav"} ${
          isMobile 
            ? isMenuOpen 
              ? "sideNavMobileOpen"
              : "sideNavMobile"
            : "sideNavDesktop"
        }`}
      >
        {/* Botón de cerrar en móvil */}
        {isMobile && (
          <button 
            className={"closeButton"}
            onClick={toggleMenu}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        )}

        {/* Lista de opciones principales del menú */}
        <ul className={"menuList"}>
          {filteredOptions.map((option) => (
            <li key={option.id} className={"menuItem"}>
              <button
                className={`${"menuOption"} ${
                  activeView === option.id ? "menuOptionActive" : ''
                }`}
                onClick={() => handleOptionClick(option.id)}
              >
                <Icon name={option.icon} className={"menuIcon"} />
                <span className={"menuLabel"}>{option.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Botón de ajustes en la parte inferior */}
        {hasSettingsAccess && (
          <div className={"settingsContainer"}>
            <button
              className={`${"menuOption"} ${"settingsOption"} ${
                activeView === settingsOption.id ? "menuOptionActive" : ''
              }`}
              onClick={() => handleOptionClick(settingsOption.id)}
            >
              <Icon name={settingsOption.icon} className={"menuIcon"} />
              <span className={"menuLabel"}>{settingsOption.label}</span>
            </button>
          </div>
        )}
      </nav>
    </>
  );
};

export default SideNavigation;
