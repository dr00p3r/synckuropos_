const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface MetricSummary {
    factor: string;
    criterio: string;
    nombre: string;
    valor: string | number;
    unidad: string;
    umbralAceptacion: number;
    umbralOptimo: number;
    operador: string;
    fuente: string;
}

function flattenMetrics(metricsData: any[]): MetricSummary[] {
    const flat: MetricSummary[] = [];
    for (const factor of metricsData) {
        for (const criterio of factor.criterios) {
            for (const m of criterio.metricas) {
                flat.push({
                    factor: factor.factor,
                    criterio: criterio.nombre,
                    nombre: m.nombre,
                    valor: m.valor,
                    unidad: m.unidad,
                    umbralAceptacion: m.umbralAceptacion,
                    umbralOptimo: m.umbralOptimo,
                    operador: m.operador,
                    fuente: m.fuente,
                });
            }
        }
    }
    return flat;
}

function buildPrompt(metrics: MetricSummary[]): string {
    const metricsTable = metrics.map(m => {
        const val = m.valor === '-' ? 'Sin datos' : `${m.valor} ${m.unidad}`;
        const status = m.valor === '-'
            ? '⚪ Sin datos'
            : evaluateStatus(m.valor as number, m.umbralAceptacion, m.umbralOptimo, m.operador);
        return `| ${m.factor} | ${m.criterio} | ${m.nombre} | ${val} | ${m.operador} ${m.umbralAceptacion} ${m.unidad} | ${m.operador} ${m.umbralOptimo} ${m.unidad} | ${status} |`;
    }).join('\n');

    return `Eres un experto en calidad de software ISO/IEC 25010. Analiza las siguientes métricas de calidad del sistema POS "SyncKuroPOS" y proporciona un veredicto profesional justificando los umbrales también con la competencia.

## Métricas del Sistema

| Factor | Criterio | Métrica | Valor Actual | Umbral Aceptación | Umbral Óptimo | Estado |
|--------|----------|---------|--------------|-------------------|---------------|--------|
${metricsTable}

## Instrucciones
1. Da un **veredicto general** del estado del sistema (Crítico / Necesita Atención / Aceptable / Óptimo).
2. Identifica las **métricas más preocupantes** y explica por qué.
3. Da **recomendaciones concretas** priorizadas por impacto.
4. Resalta las **métricas que están en estado óptimo** como fortalezas.
5. Sé conciso pero preciso. Usa emojis para hacer el reporte más visual.
6. Responde en español.
7. Usa formato Markdown.`;
}

function evaluateStatus(valor: number, umbralAceptacion: number, umbralOptimo: number, operador: string): string {
    const isLess = operador === '<';
    if (isLess) {
        if (valor <= umbralOptimo) return '🟢 Óptimo';
        if (valor <= umbralAceptacion) return '🟡 Aceptable';
        return '🔴 Crítico';
    } else {
        if (valor >= umbralOptimo) return '🟢 Óptimo';
        if (valor >= umbralAceptacion) return '🟡 Aceptable';
        return '🔴 Crítico';
    }
}

export async function getGeminiVerdict(metricsData: any[]): Promise<string> {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('VITE_GEMINI_API_KEY no está configurada en el archivo .env');
    }

    const metrics = flattenMetrics(metricsData);
    const prompt = buildPrompt(metrics);

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No se recibió respuesta de Gemini.';
}
