import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DateRangeContext, DateRangeProvider } from '@/contexts/DateRangeContext';
import type { DateRangeContextType } from '@/contexts/DateRangeContext';

// Mock component that uses DateRangeContext
const TestComponent = () => {
  const context = React.useContext(DateRangeContext) as DateRangeContextType;

  if (!context) {
    return <div>No context</div>;
  }

  return (
    <div>
      <div data-testid="start-date">{context.range.start.toISOString().split('T')[0]}</div>
      <div data-testid="end-date">{context.range.end.toISOString().split('T')[0]}</div>
      <div data-testid="current-preset">{context.currentPreset}</div>
      <button onClick={() => context.setPreset('today')} data-testid="preset-today">
        Today
      </button>
      <button onClick={() => context.setPreset('lastWeek')} data-testid="preset-week">
        Last Week
      </button>
      <button onClick={() => context.setPreset('lastMonth')} data-testid="preset-month">
        Last Month
      </button>
      <button
        onClick={() => context.setRange({
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        })}
        data-testid="set-custom"
      >
        Set Custom
      </button>
    </div>
  );
};

describe('DateRangeContext', () => {
  it('should provide default date range for today', () => {
    render(
      <DateRangeProvider>
        <TestComponent />
      </DateRangeProvider>
    );

    const preset = screen.getByTestId('current-preset');
    expect(preset.textContent).toBe('today');
  });

  it('should update preset when button is clicked', () => {
    render(
      <DateRangeProvider>
        <TestComponent />
      </DateRangeProvider>
    );

    const presetWeekButton = screen.getByTestId('preset-week');
    fireEvent.click(presetWeekButton);

    const preset = screen.getByTestId('current-preset');
    expect(preset.textContent).toBe('lastWeek');
  });

  it('should set custom date range', () => {
    render(
      <DateRangeProvider>
        <TestComponent />
      </DateRangeProvider>
    );

    const customButton = screen.getByTestId('set-custom');
    fireEvent.click(customButton);

    const startDate = screen.getByTestId('start-date');
    expect(startDate.textContent).toBe('2024-01-01');
  });

  it('should handle preset changes for lastMonth', () => {
    render(
      <DateRangeProvider>
        <TestComponent />
      </DateRangeProvider>
    );

    const presetMonthButton = screen.getByTestId('preset-month');
    fireEvent.click(presetMonthButton);

    const preset = screen.getByTestId('current-preset');
    expect(preset.textContent).toBe('lastMonth');
  });

  it('should handle preset changes for today', () => {
    render(
      <DateRangeProvider>
        <TestComponent />
      </DateRangeProvider>
    );

    const presetTodayButton = screen.getByTestId('preset-today');
    fireEvent.click(presetTodayButton);

    const preset = screen.getByTestId('current-preset');
    expect(preset.textContent).toBe('today');
  });
});
