export const calculateTotalSalary = (employee) => {
  const basicVal = parseFloat(employee.basicSalary) || 0;

  const getAllowance = (type, value, percentage) =>
    type === "percent" ? basicVal * percentage : parseFloat(value) || 0;

  return (
    basicVal +
      getAllowance(employee.hraType, employee.hra, 0.25) +
      getAllowance(employee.traType, employee.tra, 0.1) +
      (employee.foodAllowance === "provided"
        ? 0
        : parseFloat(employee.foodAllowance) || 0) +
      parseFloat(employee.otherAllowance) || 0
  ).toFixed(2);
};
