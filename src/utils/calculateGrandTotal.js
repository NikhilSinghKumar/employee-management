export function calculateGrandTotal(employeeData, vatRate = 0.15) {
  const summaryTotals = Object.values(employeeData).reduce(
    (acc, emp) => ({
      totalCost: acc.totalCost + parseFloat(emp.totalCost || 0),
    }),
    { totalCost: 0 }
  );

  const vat = summaryTotals.totalCost * vatRate;
  const grandTotal = summaryTotals.totalCost * (1 + vatRate);

  return {
    totalCost: parseFloat(summaryTotals.totalCost.toFixed(2)),
    vat: parseFloat(vat.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
  };
}
