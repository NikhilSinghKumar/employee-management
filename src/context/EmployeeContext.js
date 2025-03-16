"use client";

import { createContext, useContext, useState, useEffect } from "react";

const EmployeeContext = createContext();

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");

      const data = await response.json();
      setEmployees(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const addEmployee = async (newEmployee) => {
    // setEmployees((prev) => [...prev, newEmployee]);
    try {
      const res = await fetch("http://localhost:3000/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEmployee),
      });

      if (res.ok) {
        const createdEmployee = await res.json();
        setEmployees((prevEmployees) => [
          ...prevEmployees,
          createdEmployee.data,
        ]);
        return { success: true, message: "Employee added successfully!" };
      } else {
        return { success: false, message: "Failed to add employee." };
      }
    } catch (error) {
      return { success: false, message: "An error occurred." };
    }
  };

  const resetEmployees = () => {
    fetchEmployees(); // Refresh from API in case of reset
  };

  return (
    <EmployeeContext.Provider
      value={{ employees, loading, error, addEmployee, resetEmployees }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployeeContext = () => {
  return useContext(EmployeeContext);
};
