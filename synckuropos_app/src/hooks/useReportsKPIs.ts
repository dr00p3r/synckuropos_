import { useState, useEffect } from 'react';
import { useDatabase } from './useDatabase';
import { useDateRange } from '../contexts/DateRangeContext';

// Tipos para los KPIs
export interface SalesKPIs {
  totalSales: number; // en centavos
  salesCount: number;
  averageTicket: number; // en centavos
  loading: boolean;
  error: string | null;
}

export interface ProfitabilityKPIs {
  totalRevenue: number; // en centavos (ingresos)
  totalCost: number; // en centavos (costos)
  grossProfit: number; // en centavos (ganancia bruta)
  profitMargin: number; // porcentaje decimal (ej: 0.15 = 15%)
  loading: boolean;
  error: string | null;
}

export interface InventoryKPIs {
  totalInflows: number; // unidades que entraron
  totalOutflows: number; // unidades que salieron
  netMovement: number; // entrada - salida
  loading: boolean;
  error: string | null;
}

// Hook para KPIs de ventas
export const useSalesKPIs = (): SalesKPIs => {
  const db = useDatabase();
  const { range } = useDateRange();
  const [kpis, setKpis] = useState<SalesKPIs>({
    totalSales: 0,
    salesCount: 0,
    averageTicket: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const calculateSalesKPIs = async () => {
      try {
        setKpis(prev => ({ ...prev, loading: true, error: null }));

        // Consultar ventas en el rango de fechas
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

        const totalSales = sales.reduce((sum: number, sale: any) => sum + sale.totalAmount, 0);
        const salesCount = sales.length;
        const averageTicket = salesCount > 0 ? Math.round(totalSales / salesCount) : 0;

        setKpis({
          totalSales,
          salesCount,
          averageTicket,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error calculando KPIs de ventas:', error);
        setKpis(prev => ({
          ...prev,
          loading: false,
          error: 'Error al calcular los KPIs de ventas'
        }));
      }
    };

    calculateSalesKPIs();
  }, [db, range]);

  return kpis;
};

// Hook para KPIs de rentabilidad
export const useProfitabilityKPIs = (): ProfitabilityKPIs => {
  const db = useDatabase();
  const { range } = useDateRange();
  const [kpis, setKpis] = useState<ProfitabilityKPIs>({
    totalRevenue: 0,
    totalCost: 0,
    grossProfit: 0,
    profitMargin: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const calculateProfitabilityKPIs = async () => {
      try {
        setKpis(prev => ({ ...prev, loading: true, error: null }));

        // Obtener ventas del rango
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

        const totalRevenue = sales.reduce((sum: number, sale: any) => sum + sale.totalAmount, 0);

        // Obtener detalles de ventas para calcular costos
        const saleIds = sales.map((sale: any) => sale.saleId);
        let totalCost = 0;

        if (saleIds.length > 0) {
          const saleDetails = await db.saleDetails
            .find({
              selector: {
                saleId: { $in: saleIds },
                _deleted: false
              }
            })
            .exec();

          // Para cada detalle, buscar el costo del producto en las provisiones más recientes
          for (const detail of saleDetails) {
            // Buscar la provisión más reciente del producto
            const latestSupply = await db.supplyings
              .findOne({
                selector: {
                  productId: detail.productId,
                  isActive: true,
                  _deleted: false
                },
                sort: [{ supplyDate: 'desc' }]
              })
              .exec();

            if (latestSupply) {
              totalCost += latestSupply.unitCost * detail.quantity;
            }
          }
        }

        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;

        setKpis({
          totalRevenue,
          totalCost,
          grossProfit,
          profitMargin,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error calculando KPIs de rentabilidad:', error);
        setKpis(prev => ({
          ...prev,
          loading: false,
          error: 'Error al calcular los KPIs de rentabilidad'
        }));
      }
    };

    calculateProfitabilityKPIs();
  }, [db, range]);

  return kpis;
};

// Hook para KPIs de inventario
export const useInventoryKPIs = (): InventoryKPIs => {
  const db = useDatabase();
  const { range } = useDateRange();
  const [kpis, setKpis] = useState<InventoryKPIs>({
    totalInflows: 0,
    totalOutflows: 0,
    netMovement: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const calculateInventoryKPIs = async () => {
      try {
        setKpis(prev => ({ ...prev, loading: true, error: null }));

        // Obtener entradas (provisiones) en el rango
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

        const totalInflows = supplies.reduce((sum: number, supply: any) => sum + supply.quantity, 0);

        // Obtener salidas (ventas) en el rango
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

        let totalOutflows = 0;
        if (sales.length > 0) {
          const saleIds = sales.map((sale: any) => sale.saleId);
          const saleDetails = await db.saleDetails
            .find({
              selector: {
                saleId: { $in: saleIds },
                _deleted: false
              }
            })
            .exec();

          totalOutflows = saleDetails.reduce((sum: number, detail: any) => sum + detail.quantity, 0);
        }

        const netMovement = totalInflows - totalOutflows;

        setKpis({
          totalInflows,
          totalOutflows,
          netMovement,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error calculando KPIs de inventario:', error);
        setKpis(prev => ({
          ...prev,
          loading: false,
          error: 'Error al calcular los KPIs de inventario'
        }));
      }
    };

    calculateInventoryKPIs();
  }, [db, range]);

  return kpis;
};