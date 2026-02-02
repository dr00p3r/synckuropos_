import React from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

interface LoadingFallbackProps {
    message?: string;
    fullScreen?: boolean;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
    message = "Cargando...",
    fullScreen = true
}) => {
    const containerClass = fullScreen
        ? "flex flex-column align-items-center justify-content-center h-screen surface-ground"
        : "flex flex-column align-items-center justify-content-center h-full p-4";

    return (
        <div className={containerClass}>
            <ProgressSpinner strokeWidth="4" />
            <span className="text-700 font-medium mt-3">{message}</span>
        </div>
    );
};
