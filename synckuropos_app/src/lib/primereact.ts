import { addLocale } from 'primereact/api';

export const configurePrimeReact = () => {

    addLocale('es', {
        firstDayOfWeek: 1,
        dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
        dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
        dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
        monthNames: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
        monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
        today: 'Hoy',
        clear: 'Limpiar',
        accept: 'Sí',
        reject: 'No',
        choose: 'Seleccionar',
        upload: 'Subir',
        cancel: 'Cancelar',
        apply: 'Aplicar',
        matchAll: 'Buscar todo',
        matchAny: 'Buscar cualquiera',
        addRule: 'Agregar regla',
        removeRule: 'Eliminar regla',
        emptyMessage: 'Sin resultados',
        emptyFilterMessage: 'Sin resultados'
    });
};