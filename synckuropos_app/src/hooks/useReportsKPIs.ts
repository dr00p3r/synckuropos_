import { useMemo, useState, useEffect } from 'react';
import { useRxQuery, useRxCollection } from 'rxdb-hooks';
import { useDatabase } from './useDatabase';
import { useDateRange } from '../contexts/DateRangeContext';
import type { DateRange } from '../contexts/DateRangeContext';

// Helper function to calculate previous period
const getPreviousPeriod = (range: DateRange): DateRange => {
  const start = new Date(range.start);
  const end = new Date(range.end);

  // Calculate the duration of the current period
  const duration = end.getTime() - start.getTime();

  // Previous period ends where current period starts, and starts duration milliseconds before that
  const previousEnd = new Date(start.getTime() - 1); // 1ms before current start
  const previousStart = new Date(previousEnd.getTime() - duration);

  return {
    start: previousStart,
    end: previousEnd
  };
};

// Helper to calculate percentage change
const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Tipos para los KPIs
export interface SalesKPIs {
  totalSales: number; // en centavos
  salesCount: number;
  averageTicket: number; // en centavos
  loading: boolean;
  error: string | null;
  // Comparación con período anterior
  previousTotalSales?: number;
  previousSalesCount?: number;
  previousAverageTicket?: number;
  totalSalesChange?: number; // porcentaje
  salesCountChange?: number; // porcentaje
  averageTicketChange?: number; // porcentaje
}

export interface ProfitabilityKPIs {
  totalRevenue: number; // en centavos (ingresos)
  totalCost: number; // en centavos (costos)
  grossProfit: number; // en centavos (ganancia bruta)
  profitMargin: number; // porcentaje decimal (ej: 0.15 = 15%)
  loading: boolean;
  error: string | null;
  // Comparación con período anterior
  previousTotalRevenue?: number;
  previousGrossProfit?: number;
  previousProfitMargin?: number;
  revenueChange?: number; // porcentaje
  profitChange?: number; // porcentaje
  marginChange?: number; // porcentaje
}

export interface InventoryKPIs {
  totalInflows: number; // unidades que entraron
  totalOutflows: number; // unidades que salieron
  netMovement: number; // entrada - salida
  loading: boolean;
  error: string | null;
  // Comparación con período anterior
  previousNetMovement?: number;
  netMovementChange?: number; // porcentaje
}

// Hook para KPIs de ventas con comparación de período
export const useSalesKPIs = (): SalesKPIs => {
  const salesCollection = useRxCollection('sales');
  const { range } = useDateRange();

  const [previousKPIs, setPreviousKPIs] = useState({
    previousTotalSales: 0,
    previousSalesCount: 0,
    previousAverageTicket: 0
  });
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  // Build reactive sales query for current period
  const salesQuery = useMemo(() => {
    if (!salesCollection) return null;

    return salesCollection.find({
      selector: {
        isActive: true,
        _deleted: false,
        createdAt: {
          $gte: range.start.toISOString(),
          $lte: range.end.toISOString()
        }
      }
    });
  }, [salesCollection, range]);

  // Reactive query for current period
  const { result: sales, isFetching: loading } = useRxQuery(salesQuery);

  // Calculate current period KPIs
  const currentKPIs = useMemo(() => {
    if (!sales) {
      return {
        totalSales: 0,
        salesCount: 0,
        averageTicket: 0
      };
    }

    const totalSales = sales.reduce((sum: number, sale: any) => sum + sale.totalAmount, 0);
    const salesCount = sales.length;
    const averageTicket = salesCount > 0 ? Math.round(totalSales / salesCount) : 0;

    return { totalSales, salesCount, averageTicket };
  }, [sales]);

  // Load previous period data for comparison
  useEffect(() => {
    const loadPreviousPeriod = async () => {
      if (!salesCollection) return;

      setIsLoadingPrevious(true);

      try {
        const previousRange = getPreviousPeriod(range);

        const previousSales = await salesCollection
          .find({
            selector: {
              isActive: true,
              _deleted: false,
              createdAt: {
                $gte: previousRange.start.toISOString(),
                $lte: previousRange.end.toISOString()
              }
            }
          })
          .exec();

        const previousTotalSales = previousSales.reduce((sum: number, sale: any) => sum + sale.totalAmount, 0);
        const previousSalesCount = previousSales.length;
        const previousAverageTicket = previousSalesCount > 0 ? Math.round(previousTotalSales / previousSalesCount) : 0;

        setPreviousKPIs({
          previousTotalSales,
          previousSalesCount,
          previousAverageTicket
        });
      } catch (error) {
        console.error('Error loading previous period sales:', error);
        setPreviousKPIs({
          previousTotalSales: 0,
          previousSalesCount: 0,
          previousAverageTicket: 0
        });
      } finally {
        setIsLoadingPrevious(false);
      }
    };

    loadPreviousPeriod();
  }, [salesCollection, range]);

  // Calculate percentage changes
  const changes = useMemo(() => {
    return {
      totalSalesChange: calculatePercentageChange(currentKPIs.totalSales, previousKPIs.previousTotalSales),
      salesCountChange: calculatePercentageChange(currentKPIs.salesCount, previousKPIs.previousSalesCount),
      averageTicketChange: calculatePercentageChange(currentKPIs.averageTicket, previousKPIs.previousAverageTicket)
    };
  }, [currentKPIs, previousKPIs]);

  return {
    ...currentKPIs,
    ...previousKPIs,
    ...changes,
    loading: loading || isLoadingPrevious,
    error: null
  };
};

// Hook para KPIs de rentabilidad
export const useProfitabilityKPIs = (): ProfitabilityKPIs => {
  const salesCollection = useRxCollection('sales');
  const saleDetailsCollection = useRxCollection('saleDetails');
  const supplyingsCollection = useRxCollection('supplyings');
  const db = useDatabase();
  const { range } = useDateRange();

  const [totalCost, setTotalCost] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previousKPIs, setPreviousKPIs] = useState({
    previousTotalRevenue: 0,
    previousGrossProfit: 0,
    previousProfitMargin: 0
  });
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  // Build reactive sales query for current period
  const salesQuery = useMemo(() => {
    if (!salesCollection) return null;

    return salesCollection.find({
      selector: {
        isActive: true,
        _deleted: false,
        createdAt: {
          $gte: range.start.toISOString(),
          $lte: range.end.toISOString()
        }
      }
    });
  }, [salesCollection, range]);

  // Reactive query for sales
  const { result: sales, isFetching: loadingSales } = useRxQuery(salesQuery);

  // Calculate total revenue
  const totalRevenue = useMemo(() => {
    if (!sales) return 0;
    return sales.reduce((sum: number, sale: any) => sum + sale.totalAmount, 0);
  }, [sales]);

  // Calculate costs asynchronously when sales change
  useEffect(() => {
    const calculateCosts = async () => {
      if (!sales || sales.length === 0 || !db) {
        setTotalCost(0);
        setError(null);
        return;
      }

      setIsCalculating(true);
      setError(null);

      try {
        const saleIds = sales.map((sale: any) => sale.saleId);

        // Get all sale details for these sales
        const saleDetails = await db.saleDetails
          .find({
            selector: {
              saleId: { $in: saleIds },
              _deleted: false
            }
          })
          .exec();

        let calculatedCost = 0;
        let productsWithoutCost = 0;

        // For each sale detail, get the product's most recent supply cost
        for (const detail of saleDetails) {
          // Validate detail data
          if (!detail.productId || typeof detail.quantity !== 'number' || detail.quantity < 0) {
            console.warn('Invalid sale detail data:', detail);
            continue;
          }

          // Find the most recent supply for this product
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

          if (latestSupply && typeof latestSupply.unitCost === 'number') {
            // Cost = quantity sold × unit cost from supply
            const itemCost = detail.quantity * latestSupply.unitCost;

            // Validate calculated cost
            if (itemCost >= 0 && isFinite(itemCost)) {
              calculatedCost += itemCost;
            }
          } else {
            productsWithoutCost++;
          }
        }

        // Set warning if some products don't have cost data
        if (productsWithoutCost > 0) {
          setError(`${productsWithoutCost} producto(s) sin costo registrado`);
        }

        setTotalCost(Math.max(0, calculatedCost)); // Ensure non-negative
      } catch (err) {
        console.error('Error calculating profitability costs:', err);
        setError('Error al calcular costos de rentabilidad');
        setTotalCost(0);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateCosts();
  }, [sales, db]);

  // Load previous period data for comparison
  useEffect(() => {
    const loadPreviousPeriod = async () => {
      if (!salesCollection || !db) return;

      setIsLoadingPrevious(true);

      try {
        const previousRange = getPreviousPeriod(range);

        // Get previous period sales
        const previousSales = await salesCollection
          .find({
            selector: {
              isActive: true,
              _deleted: false,
              createdAt: {
                $gte: previousRange.start.toISOString(),
                $lte: previousRange.end.toISOString()
              }
            }
          })
          .exec();

        const previousTotalRevenue = previousSales.reduce((sum: number, sale: any) => sum + sale.totalAmount, 0);

        // Calculate previous period costs
        if (previousSales.length > 0) {
          const previousSaleIds = previousSales.map((sale: any) => sale.saleId);

          const previousSaleDetails = await db.saleDetails
            .find({
              selector: {
                saleId: { $in: previousSaleIds },
                _deleted: false
              }
            })
            .exec();

          let previousCalculatedCost = 0;

          for (const detail of previousSaleDetails) {
            if (!detail.productId || typeof detail.quantity !== 'number' || detail.quantity < 0) {
              continue;
            }

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

            if (latestSupply && typeof latestSupply.unitCost === 'number') {
              const itemCost = detail.quantity * latestSupply.unitCost;
              if (itemCost >= 0 && isFinite(itemCost)) {
                previousCalculatedCost += itemCost;
              }
            }
          }

          const previousGrossProfit = previousTotalRevenue - previousCalculatedCost;
          const previousProfitMargin = previousTotalRevenue > 0 ? previousGrossProfit / previousTotalRevenue : 0;

          setPreviousKPIs({
            previousTotalRevenue,
            previousGrossProfit,
            previousProfitMargin
          });
        } else {
          setPreviousKPIs({
            previousTotalRevenue: 0,
            previousGrossProfit: 0,
            previousProfitMargin: 0
          });
        }
      } catch (error) {
        console.error('Error loading previous period profitability:', error);
        setPreviousKPIs({
          previousTotalRevenue: 0,
          previousGrossProfit: 0,
          previousProfitMargin: 0
        });
      } finally {
        setIsLoadingPrevious(false);
      }
    };

    loadPreviousPeriod();
  }, [salesCollection, db, range]);

  // Calculate derived metrics
  const kpis = useMemo(() => {
    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      profitMargin
    };
  }, [totalRevenue, totalCost]);

  // Calculate percentage changes
  const changes = useMemo(() => {
    return {
      revenueChange: calculatePercentageChange(kpis.totalRevenue, previousKPIs.previousTotalRevenue),
      profitChange: calculatePercentageChange(kpis.grossProfit, previousKPIs.previousGrossProfit),
      marginChange: calculatePercentageChange(kpis.profitMargin, previousKPIs.previousProfitMargin)
    };
  }, [kpis, previousKPIs]);

  const loading = loadingSales || isCalculating || isLoadingPrevious;

  return { ...kpis, ...previousKPIs, ...changes, loading, error };
};

// Hook para KPIs de inventario
export const useInventoryKPIs = (): InventoryKPIs => {
  const supplyingsCollection = useRxCollection('supplyings');
  const salesCollection = useRxCollection('sales');
  const db = useDatabase();
  const { range } = useDateRange();

  const [totalOutflows, setTotalOutflows] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [previousKPIs, setPreviousKPIs] = useState({
    previousNetMovement: 0
  });
  const [isLoadingPrevious, setIsLoadingPrevious] = useState(false);

  // Build reactive supplies query (inflows)
  const suppliesQuery = useMemo(() => {
    if (!supplyingsCollection) return null;

    return supplyingsCollection.find({
      selector: {
        isActive: true,
        _deleted: false,
        supplyDate: {
          $gte: range.start.toISOString(),
          $lte: range.end.toISOString()
        }
      }
    });
  }, [supplyingsCollection, range]);

  // Build reactive sales query (to get saleIds for filtering outflows)
  const salesQuery = useMemo(() => {
    if (!salesCollection) return null;

    return salesCollection.find({
      selector: {
        isActive: true,
        _deleted: false,
        createdAt: {
          $gte: range.start.toISOString(),
          $lte: range.end.toISOString()
        }
      }
    });
  }, [salesCollection, range]);

  // Reactive queries
  const { result: supplies, isFetching: loadingSupplies } = useRxQuery(suppliesQuery);
  const { result: sales, isFetching: loadingSales } = useRxQuery(salesQuery);

  // Calculate total inflows
  const totalInflows = useMemo(() => {
    if (!supplies) return 0;
    return supplies.reduce((sum: number, supply: any) => sum + supply.quantity, 0);
  }, [supplies]);

  // Calculate outflows asynchronously when sales change
  useEffect(() => {
    const calculateOutflows = async () => {
      if (!sales || sales.length === 0 || !db) {
        setTotalOutflows(0);
        setError(null);
        return;
      }

      setIsCalculating(true);
      setError(null);

      try {
        const saleIds = sales.map((sale: any) => sale.saleId);

        // Get sale details only for sales in the date range
        const saleDetails = await db.saleDetails
          .find({
            selector: {
              saleId: { $in: saleIds },
              _deleted: false
            }
          })
          .exec();

        // Sum up the quantities from filtered sale details with validation
        const outflows = saleDetails.reduce((sum: number, detail: any) => {
          const quantity = detail.quantity;

          // Validate quantity
          if (typeof quantity !== 'number' || quantity < 0 || !isFinite(quantity)) {
            console.warn('Invalid quantity in sale detail:', detail);
            return sum;
          }

          return sum + quantity;
        }, 0);

        setTotalOutflows(Math.max(0, outflows)); // Ensure non-negative
      } catch (err) {
        console.error('Error calculating inventory outflows:', err);
        setError('Error al calcular salidas de inventario');
        setTotalOutflows(0);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateOutflows();
  }, [sales, db]);

  // Load previous period data for comparison
  useEffect(() => {
    const loadPreviousPeriod = async () => {
      if (!supplyingsCollection || !salesCollection || !db) return;

      setIsLoadingPrevious(true);

      try {
        const previousRange = getPreviousPeriod(range);

        // Get previous period supplies (inflows)
        const previousSupplies = await supplyingsCollection
          .find({
            selector: {
              isActive: true,
              _deleted: false,
              supplyDate: {
                $gte: previousRange.start.toISOString(),
                $lte: previousRange.end.toISOString()
              }
            }
          })
          .exec();

        const previousTotalInflows = previousSupplies.reduce((sum: number, supply: any) => sum + supply.quantity, 0);

        // Get previous period sales
        const previousSales = await salesCollection
          .find({
            selector: {
              isActive: true,
              _deleted: false,
              createdAt: {
                $gte: previousRange.start.toISOString(),
                $lte: previousRange.end.toISOString()
              }
            }
          })
          .exec();

        let previousTotalOutflows = 0;

        if (previousSales.length > 0) {
          const previousSaleIds = previousSales.map((sale: any) => sale.saleId);

          const previousSaleDetails = await db.saleDetails
            .find({
              selector: {
                saleId: { $in: previousSaleIds },
                _deleted: false
              }
            })
            .exec();

          previousTotalOutflows = previousSaleDetails.reduce((sum: number, detail: any) => {
            const quantity = detail.quantity;
            if (typeof quantity !== 'number' || quantity < 0 || !isFinite(quantity)) {
              return sum;
            }
            return sum + quantity;
          }, 0);
        }

        const previousNetMovement = previousTotalInflows - previousTotalOutflows;

        setPreviousKPIs({ previousNetMovement });
      } catch (error) {
        console.error('Error loading previous period inventory:', error);
        setPreviousKPIs({ previousNetMovement: 0 });
      } finally {
        setIsLoadingPrevious(false);
      }
    };

    loadPreviousPeriod();
  }, [supplyingsCollection, salesCollection, db, range]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const netMovement = totalInflows - totalOutflows;

    return {
      totalInflows,
      totalOutflows,
      netMovement
    };
  }, [totalInflows, totalOutflows]);

  // Calculate percentage changes
  const changes = useMemo(() => {
    return {
      netMovementChange: calculatePercentageChange(kpis.netMovement, previousKPIs.previousNetMovement)
    };
  }, [kpis, previousKPIs]);

  const loading = loadingSupplies || loadingSales || isCalculating || isLoadingPrevious;

  return { ...kpis, ...previousKPIs, ...changes, loading, error };
};