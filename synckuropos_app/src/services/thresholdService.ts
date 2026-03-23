/**
 * Service for persisting metric thresholds to localStorage
 */

const STORAGE_KEY = 'metric_thresholds';

export interface ThresholdConfig {
    id: string;
    umbralAceptacion: number;
    umbralOptimo: number;
    operador: string;
}

export interface ThresholdsMap {
    [metricId: string]: ThresholdConfig;
}

/**
 * Load saved thresholds from localStorage
 */
export const loadThresholds = (): ThresholdsMap => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading thresholds from localStorage:', error);
    }
    return {};
};

/**
 * Save thresholds to localStorage
 */
export const saveThresholds = (thresholds: ThresholdsMap): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds));
    } catch (error) {
        console.error('Error saving thresholds to localStorage:', error);
    }
};

/**
 * Update a single metric's threshold and persist
 */
export const updateThreshold = (
    metricId: string,
    umbralAceptacion: number,
    umbralOptimo: number,
    operador: string
): ThresholdsMap => {
    const current = loadThresholds();
    const updated = {
        ...current,
        [metricId]: { id: metricId, umbralAceptacion, umbralOptimo, operador }
    };
    saveThresholds(updated);
    return updated;
};

/**
 * Clear all saved thresholds (reset to defaults)
 */
export const clearThresholds = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Error clearing thresholds from localStorage:', error);
    }
};

/**
 * Export thresholds as JSON string for backup
 */
export const exportThresholds = (): string => {
    return JSON.stringify(loadThresholds(), null, 2);
};

/**
 * Import thresholds from JSON string
 */
export const importThresholds = (jsonString: string): boolean => {
    try {
        const parsed = JSON.parse(jsonString);
        saveThresholds(parsed);
        return true;
    } catch (error) {
        console.error('Error importing thresholds:', error);
        return false;
    }
};
