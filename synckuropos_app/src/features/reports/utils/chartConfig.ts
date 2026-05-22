export const CHART_COLORS = {
    tick: 'var(--chart-tick-color, #64748b)',
    grid: 'var(--chart-grid-color, #e2e8f0)',
} as const;

export function createChartOptions(overrides?: Record<string, any>) {
    return {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: CHART_COLORS.tick,
                    font: { size: 12, weight: '500' as const },
                },
            },
        },
        scales: {
            x: {
                ticks: { color: CHART_COLORS.tick, font: { size: 11 } },
                grid: { color: CHART_COLORS.grid, border: { display: false } },
            },
            y: {
                ticks: { color: CHART_COLORS.tick, font: { size: 11 } },
                grid: { color: CHART_COLORS.grid, border: { display: false } },
            },
        },
        ...overrides,
    };
}