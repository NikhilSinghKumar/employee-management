export const calculateTotalSalary = (employee) => {
  const basicSalary = parseFloat(employee.basicSalary) || 0;
  const hra =
    employee.hraType === "provided" ? 0 : parseFloat(employee.hra) || 0;
  const tra =
    employee.traType === "provided" ? 0 : parseFloat(employee.tra) || 0;
  const foodAllowance =
    employee.foodAllowanceType === "provided"
      ? 0
      : parseFloat(employee.foodAllowance) || 0;
  const otherAllowance = parseFloat(employee.otherAllowance) || 0;

  return (basicSalary + hra + tra + foodAllowance + otherAllowance).toFixed(2);
};
