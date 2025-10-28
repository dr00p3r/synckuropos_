// Reports-specific types
export interface ReportKPIData {
  totalSales: number;
  totalCustomers: number;
  averageTicket: number;
  topProducts: Array<{
    productName: string;
    totalSold: number;
    revenue: number;
  }>;
}

export interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApply: () => void;
}

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
  };
}

export interface ReportChartData {
  date: string;
  sales: number;
  customers: number;
}

export interface ReportGlobalChartProps {
  data: ReportChartData[];
  isLoading?: boolean;
}

export interface ReportsPageProps {
  // Add props if needed
}