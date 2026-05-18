import { calculatePayback } from './payback-calculator.component';

describe('calculatePayback', () => {
  it('calcula el payback cuando el margen acumulado supera la inversion', () => {
    const result = calculatePayback({
      investment: 10_000,
      monthlyRevenue: 5_000,
      variableCostRate: 20,
      fixedMonthlyCosts: 1_000,
      growthRate: 0,
      projectionMonths: 6,
    });

    expect(result.firstMonthMargin).toBe(3_000);
    expect(result.paybackMonth).toBe(4);
    expect(result.finalAccumulatedMargin).toBe(18_000);
  });

  it('indica cuando no se alcanza el payback dentro del horizonte', () => {
    const result = calculatePayback({
      investment: 100_000,
      monthlyRevenue: 5_000,
      variableCostRate: 20,
      fixedMonthlyCosts: 1_000,
      growthRate: 0,
      projectionMonths: 6,
    });

    expect(result.paybackMonth).toBeNull();
    expect(result.paybackLabel).toBe('No se alcanza en 6 meses');
  });
});
