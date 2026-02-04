
import axios from 'axios';

const SONAR_HOST = process.env.SONAR_HOST_URL || 'http://localhost:9000';
const SONAR_TOKEN = process.env.SONAR_TOKEN;
const PROJECT_KEY = process.env.SONAR_PROJECT_KEY || 'synckuropos';

/**
 * Fetches specific metrics from SonarQube.
 * Metrics:
 * - coverage
 * - duplicated_lines_density (duplications)
 * - cognitive_complexity
 * - cyclomatic_complexity (complexity) / files (file count)
 *   Actually Sonar metric 'files' gives number of files. 'complexity' is total.
 *   We want average complexity per file.
 * - sqale_debt_ratio (technicalDebtRatio)
 */
export const getSonarMetrics = async () => {
    try {
        const componentUrl = `${SONAR_HOST}/api/measures/component`;
        const metrics = [
            'coverage',
            'duplicated_lines_density',
            'cognitive_complexity',
            'complexity',
            'files',
            'sqale_debt_ratio'
        ].join(',');

        const response = await axios.get(componentUrl, {
            params: {
                component: PROJECT_KEY,
                metricKeys: metrics
            },
            auth: SONAR_TOKEN ? {
                username: SONAR_TOKEN,
                password: ''
            } : undefined
        });

        const measures = response.data.component.measures;

        const getMetric = (key: string) => {
            const m = measures.find((x: any) => x.metric === key);
            return m ? Number(m.value) : 0;
        };

        const totalComplexity = getMetric('complexity');
        const numberOfFiles = getMetric('files');
        const avgCyclomaticComplexity = numberOfFiles > 0 ? (totalComplexity / numberOfFiles) : 0;

        // Cognitive complexity is also usually a total. If we want average, we rely on 'functions' or 'files' count.
        // The user asked for "Media de archivos" (Average per file) for both cognitive and cyclomatic.
        const totalCognitive = getMetric('cognitive_complexity');
        const avgCognitiveComplexity = numberOfFiles > 0 ? (totalCognitive / numberOfFiles) : 0;

        return {
            coverage: getMetric('coverage'), // %
            duplications: getMetric('duplicated_lines_density'), // %
            cognitiveComplexity: parseFloat(avgCognitiveComplexity.toFixed(2)),
            cyclomaticComplexity: parseFloat(avgCyclomaticComplexity.toFixed(2)),
            technicalDebtRatio: getMetric('sqale_debt_ratio') // %
        };
    } catch (error: any) {
        console.error("Error fetching SonarQube metrics:", error.message);
        // Fallback or rethrow? 
        // User might not have Sonar running locally. Let's return error structure or defaults.
        // For compliance with typical "server is down" handling, we might return null or throw.
        // But to keep the dashboard working if just testing, maybe defaults?
        // Let's throw so the endpoint handles it.
        throw error;
    }
};
