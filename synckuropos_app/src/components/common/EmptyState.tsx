import React from 'react';

interface EmptyStateProps {
    icon: string;
    iconSize?: 'sm' | 'lg';
    title: string;
    description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    iconSize = 'lg',
    title,
    description,
}) => {
    const iconFontSize = iconSize === 'sm' ? '3rem' : '4rem';
    const titleClass = iconSize === 'sm'
        ? 'text-600 text-base font-medium mb-1'
        : 'text-700 text-lg font-semibold mb-2';
    const descClass = iconSize === 'sm'
        ? 'text-500 text-sm'
        : 'text-600 text-sm';
    const paddingClass = iconSize === 'lg' ? 'px-4' : '';

    return (
        <div className={`flex flex-column align-items-center justify-content-center h-full gap-3 ${paddingClass}`}>
            <i className={`${icon} text-400`} style={{ fontSize: iconFontSize }} />
            <div className="text-center">
                <div className={titleClass}>{title}</div>
                <div className={descClass}>{description}</div>
            </div>
        </div>
    );
};