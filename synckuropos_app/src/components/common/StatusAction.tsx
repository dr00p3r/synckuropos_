import React from 'react';
import { Button } from 'primereact/button';

interface StatusActionProps {
    onEdit: () => void;
    onToggleStatus: () => void;
    isActive: boolean;
    editTooltip?: string;
    deactivateTooltip?: string;
    reactivateTooltip?: string;
}

export const StatusAction: React.FC<StatusActionProps> = ({
    onEdit,
    onToggleStatus,
    isActive,
    editTooltip = 'Editar',
    deactivateTooltip = 'Desactivar',
    reactivateTooltip = 'Reactivar',
}) => {
    return (
        <div className="flex gap-2 justify-content-end">
            <Button
                icon="pi pi-pencil"
                rounded
                text
                severity="info"
                onClick={onEdit}
                tooltip={editTooltip}
            />
            <Button
                icon={isActive ? 'pi pi-eye-slash' : 'pi pi-check-circle'}
                rounded
                text
                severity={isActive ? 'danger' : 'success'}
                onClick={onToggleStatus}
                tooltip={isActive ? deactivateTooltip : reactivateTooltip}
            />
        </div>
    );
};