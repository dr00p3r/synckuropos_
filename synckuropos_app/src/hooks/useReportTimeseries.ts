import { useState, useEffect, useMemo } from 'react';
import { useDatabase } from './useDatabase';
import { useDateRange } from '../contexts/DateRangeContext';

export interface SeriesPoint {
  date: string; // YYYY-MM-DD
  invested: number; // en centavos
  sold: number; // en centavos
}

export interface TimeseriesTotals {
  invested: number;
  sold: number;
  diff: number;
  ratio: number;
}

export interface UseReportTimeseriesResult {
  series: SeriesPoint[];
  totals: TimeseriesTotals;
  loading: boolean;
  error?: string;
}

/**
 * Hook para obtener datos de timeseries con agregación diaria
 * Incluye total invertido vs total vendido por día
 */
export const useReportTimeseries = (): UseReportTimeseriesResult => {
  const db = useDatabase();
  const { range } = useDateRange();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [rawData, setRawData] = useState<{
    supplies: any[];
    sales: any[];
    saleDetails: any[];
  }>({ supplies: [], sales: [], saleDetails: [] });

  // Obtener datos desde RxDB
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(undefined);

        // Obtener provisiones en el rango
        const supplies = await db.supplyings
          .find({
            selector: {
              isActive: true,
              _deleted: false,
              supplyDate: {
                $gte: range.start.toISOString(),
                $lte: range.end.toISOString()
              }
            }
          })
          .exec();

        // Obtener ventas en el rango
        const sales = await db.sales
          .find({
            selector: {
              isActive: true,
              _deleted: false,
              createdAt: {
                $gte: range.start.toISOString(),
                $lte: range.end.toISOString()
              }
            }
          })
          .exec();

        // Obtener detalles de ventas
        let saleDetails: any[] = [];
        if (sales.length > 0) {
          const saleIds = sales.map((sale: any) => sale.saleId);
          saleDetails = await db.saleDetails
            .find({
              selector: {
                saleId: { $in: saleIds },
                _deleted: false
              }
            })
            .exec();
        }

        setRawData({ supplies, sales, saleDetails });
      } catch (err) {
        console.error('Error fetching timeseries data:', err);
        setError('Error al obtener datos del timeseries');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [db, range]);

  // Procesar datos en timeseries con memoización
  const processedData = useMemo(() => {
    if (loading || error) {
      return {
        series: [],
        totals: { invested: 0, sold: 0, diff: 0, ratio: 0 }
      };
    }

    const { supplies, sales, saleDetails } = rawData;

    // Crear mapa de fechas completo (rellenar huecos)
    const startDate = new Date(range.start);
    const endDate = new Date(range.end);
    const dateMap = new Map<string, SeriesPoint>();

    // Inicializar todas las fechas con 0
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateMap.set(dateStr, {
        date: dateStr,
        invested: 0,
        sold: 0
      });
    }

    // Agregar inversiones por día
    supplies.forEach((supply: any) => {
      const supplyDate = new Date(supply.supplyDate);
      const dateStr = supplyDate.toISOString().split('T')[0];
      const point = dateMap.get(dateStr);
      if (point) {
        point.invested += supply.quantity * supply.unitCost;
      }
    });

    // Agregar ventas por día (necesitamos mapear sales con saleDetails)
    const salesByDate = new Map<string, number>();
    sales.forEach((sale: any) => {
      const saleDate = new Date(sale.createdAt);
      const dateStr = saleDate.toISOString().split('T')[0];
      
      // Sumar todos los lineTotal de los detalles de esta venta
      const saleTotal = saleDetails
        .filter((detail: any) => detail.saleId === sale.saleId)
        .reduce((sum: number, detail: any) => sum + detail.lineTotal, 0);
      
      salesByDate.set(dateStr, (salesByDate.get(dateStr) || 0) + saleTotal);
    });

    // Aplicar ventas al mapa de fechas
    salesByDate.forEach((total, dateStr) => {
      const point = dateMap.get(dateStr);
      if (point) {
        point.sold = total;
      }
    });

    // Convertir a array ordenado
    const series = Array.from(dateMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    // Calcular totales
    const totals = series.reduce(
      (acc, point) => ({
        invested: acc.invested + point.invested,
        sold: acc.sold + point.sold,
        diff: 0, // Se calculará después
        ratio: 0 // Se calculará después
      }),
      { invested: 0, sold: 0, diff: 0, ratio: 0 }
    );

    totals.diff = totals.sold - totals.invested;
    totals.ratio = totals.invested > 0 ? totals.sold / totals.invested : 0;

    return { series, totals };
  }, [rawData, range, loading, error]);

  return {
    series: processedData.series,
    totals: processedData.totals,
    loading,
    error
  };
};