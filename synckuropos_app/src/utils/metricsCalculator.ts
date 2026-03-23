import type { ThresholdsMap } from '../services/thresholdService';

export const calculateMetrics = (logs: any[] = [], sonar: any = null, lighthouse: any = null, customThresholds: ThresholdsMap = {}) => {

    // Helper to apply custom thresholds if available
    const applyThresholds = (metric: any) => {
        const custom = customThresholds[metric.id];
        if (custom) {
            return {
                ...metric,
                umbralAceptacion: custom.umbralAceptacion,
                umbralOptimo: custom.umbralOptimo,
                operador: custom.operador
            };
        }
        return metric;
    };

    // Helper to safely get value or return "-"
    // If source is null, return "-"
    // If source has data, proceed with calculation
    // All calculations should now return string | number
    const getVal = (source: any, calc: () => number) => {
        if (!source) return "-";
        if (Array.isArray(source) && source.length === 0) return "-";
        try {
            return calc();
        } catch (e) {
            return "-";
        }
    };

    // 1. Funcionalidad - Exactitud - Desviación de Redondeo
    // Promedio absoluto de la diferencia entre total registrado y total calculado por venta
    const roundingDeviation = getVal(logs, () => {
        const saleLogs = logs.filter(l => l.type === 'FINANCIAL_INTEGRITY_CHECK');
        if (saleLogs.length === 0) return 0;
        // Payload real: { diff, totalRegistered, totalCalculated }
        const totalAbsDiff = saleLogs.reduce((acc, l) => acc + Math.abs(l.data?.diff ?? 0), 0);
        return totalAbsDiff / saleLogs.length;
    });

    // 2. Fiabilidad - Disponibilidad - Tasa de Éxito Offline
    // Mide la tasa de recuperación: cuántas veces se fue offline y volvió online exitosamente
    const offlineRate = getVal(logs, () => {
        // Payload real: { status: 'online'|'offline', timestamp }
        const networkLogs = logs.filter(l => l.type === 'NETWORK_STATUS_CHANGE');
        if (networkLogs.length === 0) return 100; // Sin cambios de red = siempre online
        const offlineEvents = networkLogs.filter(l => l.data?.status === 'offline');
        const onlineEvents = networkLogs.filter(l => l.data?.status === 'online');
        if (offlineEvents.length === 0) return 100; // Nunca se fue offline
        const recovered = Math.min(onlineEvents.length, offlineEvents.length);
        return (recovered / offlineEvents.length) * 100;
    });

    // 3. Fiabilidad - Recuperabilidad - Tiempo Convergencia
    const avgConvergence = getVal(logs, () => {
        const convergenceLogs = logs.filter(l => l.type === 'SYNC_PERFORMANCE');
        return convergenceLogs.reduce((acc, curr) => acc + (curr.data?.durationMs / 1000 || 0), 0) / (convergenceLogs.length || 1);
    });

    // 4. Eficiencia - Comportamiento Temporal - TTI en Escaneo
    const avgScanTTI = getVal(logs, () => {
        const scanLogs = logs.filter(l => l.type === 'PERF_SCAN_LATENCY');
        return scanLogs.reduce((acc, curr) => acc + (curr.data?.tti || 0), 0) / (scanLogs.length || 1);
    });

    // 5. Eficiencia - Velocidad Escritura - Latencia Venta Compleja
    const avgComplexSale = getVal(logs, () => {
        const complexSaleLogs = logs.filter(l => l.type === 'PERF_WRITE_LATENCY');
        return complexSaleLogs.reduce((acc, curr) => acc + (curr.data?.durationMs || 0), 0) / (complexSaleLogs.length || 1);
    });

    // 6. Eficiencia - Busqueda - Tiempo promedio
    const avgSearch = getVal(logs, () => {
        const searchLogs = logs.filter(l => l.type === 'PERF_SEARCH_LATENCY');
        return searchLogs.reduce((acc, curr) => acc + (curr.data?.durationMs || 0), 0) / (searchLogs.length || 1);
    });

    // 7. Usabilidad - Operabilidad - Dependencia Ratón promedio
    const avgClicks = getVal(logs, () => {
        const saleInteractionLogs = logs.filter(l => l.type === 'UX_INTERACTION_METRICS');
        const mouseClicks = saleInteractionLogs.reduce((acc, curr) => acc + (curr.data?.mouseClicks || 0), 0);
        return mouseClicks / (saleInteractionLogs.length || 1);
    });

    // 8. Usabilidad - Interpretabilidad - % bloqueos formulario de inventario
    const blockRate = getVal(logs, () => {
        // Payload UX_FORM_BLOCK: { formId, errorCount, reason }
        const blockedForms = logs.filter(l => l.type === 'UX_FORM_BLOCK' && l.data?.formId === 'product-form');
        // Payload TASK_INIT: { taskName: 'INVENTORY_UPDATE'|'INVENTORY_CREATE' }
        const totalForms = logs.filter(l => l.type === 'TASK_INIT' && (l.data?.taskName === 'INVENTORY_UPDATE' || l.data?.taskName === 'INVENTORY_CREATE'));
        if (totalForms.length === 0) return 0;
        return (blockedForms.length / totalForms.length) * 100;
    });

    // 9. Seguridad - Fortaleza Auth - Intentos Fallidos por minuto
    const failedLoginRate = getVal(logs, () => {
        // Payload real AUTH_FAILURE: { attemptId, reason: 'invalid_password'|'error' }
        // Cada log tiene timestamp (epoch ms) en el documento raíz
        const loginLogs = logs.filter(l => l.type === 'AUTH_FAILURE');
        if (loginLogs.length === 0) return 0;
        // Calcular el rango de tiempo de TODOS los logs para obtener la ventana de observación
        const allTimestamps = logs.map(l => l.timestamp).filter((t): t is number => typeof t === 'number' && t > 0);
        if (allTimestamps.length < 2) return loginLogs.length; // Sin rango, retornar conteo bruto
        const minTs = Math.min(...allTimestamps);
        const maxTs = Math.max(...allTimestamps);
        const rangeMinutes = (maxTs - minTs) / 60000;
        if (rangeMinutes < 1) return loginLogs.length; // Menos de 1 min → conteo bruto
        return loginLogs.length / rangeMinutes;
    });

    // 10. Seguridad - Encriptacion
    // Payload DB_ENCRYPTION_STATUS: { isEncrypted: boolean }
    // Nota: Este evento está comentado en useDatabase. La BD SÍ usa password (encriptación).
    const encryptionRate = getVal(logs, () => {
        const encryptionLogs = logs.filter(l => l.type === 'DB_ENCRYPTION_STATUS');
        if (encryptionLogs.length === 0) return 100; // Sin checks → BD usa password = encriptada
        const encrypted = encryptionLogs.filter(l => l.data?.isEncrypted === true);
        return (encrypted.length / encryptionLogs.length) * 100;
    });

    // 11. Efectividad - Completitud Tareas Inventario
    const taskCompletionRate = getVal(logs, () => {
        // Filtrar solo tareas de inventario por taskName
        const inventoryInits = logs.filter(l => l.type === 'TASK_INIT' && (l.data?.taskName === 'INVENTORY_UPDATE' || l.data?.taskName === 'INVENTORY_CREATE'));
        const inventoryCompleted = logs.filter(l => l.type === 'TASK_COMPLETION' && (l.data?.taskName === 'INVENTORY_UPDATE' || l.data?.taskName === 'INVENTORY_CREATE'));
        if (inventoryInits.length === 0) return 100; // Sin tareas iniciadas = 100% completitud
        return (inventoryCompleted.length / inventoryInits.length) * 100;
    });

    // 12. Eficiencia - Tiempo en Tareas - Add Product -> Sale Complete
    const avgTaskTime = getVal(logs, () => {
        const taskTimeLogs = logs.filter(l => l.type === 'TASK_DURATION');
        return taskTimeLogs.reduce((acc, curr) => acc + (curr.data?.durationSeconds || 0), 0) / (taskTimeLogs.length || 1);
    });

    // Lighthouse / Sonar helpers
    const getSonar = (key: string) => getVal(sonar, () => sonar[key]);
    const getLighthouse = (key: string) => getVal(lighthouse, () => lighthouse[key]);

    return [
        {
            factor: "Funcionalidad",
            criterios: [
                {
                    nombre: "Exactitud",
                    metricas: [{ id: "func_exact", nombre: "Desviación de Redondeo", valor: roundingDeviation, unidad: "", umbralAceptacion: 0.01, umbralOptimo: 0.00, operador: "<", fuente: "Logs" }]
                }
            ]
        },
        {
            factor: "Fiabilidad",
            criterios: [
                {
                    nombre: "Disponibilidad",
                    metricas: [{ id: "fiab_disp", nombre: "Tasa de Éxito Offline", valor: offlineRate, unidad: "%", umbralAceptacion: 99.99, umbralOptimo: 100, operador: ">", fuente: "Logs" }]
                },
                {
                    nombre: "Recuperabilidad",
                    metricas: [{ id: "fiab_recup", nombre: "Tiempo Convergencia", valor: avgConvergence, unidad: "s", umbralAceptacion: 10, umbralOptimo: 5, operador: "<", fuente: "Logs" }]
                }
            ]
        },
        {
            factor: "Eficiencia de Desempeño",
            criterios: [
                {
                    nombre: "Comportamiento Temporal",
                    metricas: [
                        { id: "eff_tti", nombre: "TTI en Escaneo", valor: avgScanTTI, unidad: "ms", umbralAceptacion: 100, umbralOptimo: 50, operador: "<", fuente: "Logs" },
                        { id: "eff_tbt", nombre: "Total Blocking Time", valor: getLighthouse('tbt'), unidad: "ms", umbralAceptacion: 100, umbralOptimo: 50, operador: "<", fuente: "Lighthouse" }
                    ]
                },
                {
                    nombre: "Velocidad Escritura",
                    metricas: [
                        { id: "eff_lat", nombre: "Latencia Venta Compleja", valor: avgComplexSale, unidad: "ms", umbralAceptacion: 300, umbralOptimo: 150, operador: "<", fuente: "Logs" }
                    ]
                },
                {
                    nombre: "Rendimiento Búsqueda",
                    metricas: [
                        { id: "eff_search", nombre: "Tiempo Respuesta Búsqueda", valor: avgSearch, unidad: "ms", umbralAceptacion: 200, umbralOptimo: 100, operador: "<", fuente: "Logs" }
                    ]
                },
                {
                    nombre: "Carga Inicial",
                    metricas: [
                        { id: "eff_lcp", nombre: "LCP", valor: getLighthouse('lcp'), unidad: "s", umbralAceptacion: 8, umbralOptimo: 2.5, operador: "<", fuente: "Lighthouse" },
                        { id: "eff_fcp", nombre: "FCP", valor: getLighthouse('fcp'), unidad: "s", umbralAceptacion: 5, umbralOptimo: 1.5, operador: "<", fuente: "Lighthouse" }
                    ]
                },
                {
                    nombre: "Utilización Recursos",
                    metricas: [{ id: "eff_ram", nombre: "Memoria RAM (15min)", valor: getLighthouse('memory'), unidad: "MB", umbralAceptacion: 200, umbralOptimo: 100, operador: "<", fuente: "Lighthouse/Puppeteer" }]
                }
            ]
        },
        {
            factor: "Seguridad",
            criterios: [
                {
                    nombre: "Higiene Dependencias",
                    metricas: [{ id: "sec_vuln", nombre: "Dependencias Vulnerables", valor: getLighthouse('vulnerabilities'), unidad: "", umbralAceptacion: 0, umbralOptimo: 0, operador: "<", fuente: "NPM Audit" }]
                },
                {
                    nombre: "Fortaleza Auth",
                    metricas: [{ id: "sec_brute", nombre: "Intentos Fallidos / min", valor: failedLoginRate, unidad: "int/min", umbralAceptacion: 6, umbralOptimo: 0, operador: "<", fuente: "Logs" }]
                },
                {
                    nombre: "Seguridad en Reposo",
                    metricas: [{ id: "sec_enc", nombre: "Encriptación BD", valor: encryptionRate, unidad: "%", umbralAceptacion: 99.999, umbralOptimo: 100, operador: ">", fuente: "Logs" }]
                }
            ]
        },
        {
            factor: "Mantenibilidad",
            criterios: [
                {
                    nombre: "Testabilidad",
                    metricas: [{ id: "mant_cov", nombre: "Cobertura Código", valor: getSonar('coverage'), unidad: "%", umbralAceptacion: 80, umbralOptimo: 90, operador: ">", fuente: "SonarQube" }]
                },
                {
                    nombre: "Modularidad",
                    metricas: [
                        { id: "mant_dup", nombre: "Código Duplicado", valor: getSonar('duplications'), unidad: "%", umbralAceptacion: 5, umbralOptimo: 0, operador: "<", fuente: "SonarQube" },
                        { id: "mant_cyc", nombre: "Complejidad Ciclomática", valor: getSonar('cyclomaticComplexity'), unidad: "", umbralAceptacion: 15, umbralOptimo: 10, operador: "<", fuente: "SonarQube" }
                    ]
                },
                {
                    nombre: "Capacidad Actualización",
                    metricas: [
                        { id: "mant_cog", nombre: "Complejidad Cognitiva", valor: getSonar('cognitiveComplexity'), unidad: "", umbralAceptacion: 15, umbralOptimo: 5, operador: "<", fuente: "SonarQube" },
                        { id: "mant_debt", nombre: "Ratio Deuda", valor: getSonar('technicalDebtRatio'), unidad: "%", umbralAceptacion: 3, umbralOptimo: 1, operador: "<", fuente: "SonarQube" }
                    ]
                }
            ]
        },
        {
            factor: "Usabilidad",
            criterios: [
                {
                    nombre: "Operabilidad",
                    metricas: [{ id: "usab_mouse", nombre: "Dependencia Ratón", valor: avgClicks, unidad: "clicks", umbralAceptacion: 3, umbralOptimo: 0, operador: "<", fuente: "Logs" }]
                },
                {
                    nombre: "Interpretabilidad",
                    metricas: [{ id: "usab_lock", nombre: "% Bloqueos Form", valor: blockRate, unidad: "%", umbralAceptacion: 30, umbralOptimo: 0, operador: "<", fuente: "Logs" }]
                }
            ]
        },
        {
            factor: "Efectividad",
            criterios: [
                {
                    nombre: "Completitud Tareas",
                    metricas: [{ id: "eff_task_comp", nombre: "Tasa Completitud Inventario", valor: taskCompletionRate, unidad: "%", umbralAceptacion: 90, umbralOptimo: 100, operador: ">", fuente: "Logs" }]
                }
            ]
        },
        {
            factor: "Eficiencia",
            criterios: [
                {
                    nombre: "Tiempo en Tareas",
                    metricas: [{ id: "eff_task_time", nombre: "Tiempo Promedio Venta", valor: (avgTaskTime as any) === '-' ? '-' : (avgTaskTime as number) / 60, unidad: "min", umbralAceptacion: 3, umbralOptimo: 1, operador: "<", fuente: "Logs" }]
                }
            ]
        }
    ].map(factor => ({
        ...factor,
        criterios: factor.criterios.map(criterio => ({
            ...criterio,
            metricas: criterio.metricas.map(applyThresholds)
        }))
    }));
};
