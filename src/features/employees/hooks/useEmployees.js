import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { employeeService } from "../services/employeeService";

export function useEmployees() {
  const [employees, setEmployees] = useState([]);

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await employeeService.list({
        search,
        status,
      });

      setEmployees(data || []);
    } catch (err) {
      setError(
        err.message || "Could not load employees."
      );
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    employees,
    search,
    setSearch,
    status,
    setStatus,
    loading,
    error,
    refresh,
  };
}