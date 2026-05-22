import React from 'react';

interface PageCardProps {
    shadow?: '1' | '2';
    variant?: 'white' | 'surface';
    padding?: '2' | '3' | '4';
    className?: string;
    children: React.ReactNode;
}

export const PageCard: React.FC<PageCardProps> = ({
    shadow = '1',
    variant = 'white',
    padding = '3',
    className = '',
    children,
}) => {
    const bgClass = variant === 'white' ? 'bg-white' : 'surface-card';
    const shadowClass = `shadow-${shadow}`;
    const paddingClass = `p-${padding}`;
    const baseClasses = `${bgClass} ${shadowClass} ${paddingClass} border-round-xl`;

    const isFlexColumn = className.includes('flex-column') || className.includes('flex flex-column');

    return (
        <div className={`${baseClasses} ${className}`.trim()}>
            {children}
        </div>
    );
};