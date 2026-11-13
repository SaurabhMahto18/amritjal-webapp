import {
  useCallback,
  useEffect,
  useState,
} from "react";

import eventService from "../services/eventService";

export default function useEvents() {
  const [events, setEvents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [eventRows, customerRows] = await Promise.all([
        eventService.getAll(),
        eventService.getCustomers(),
      ]);

      setEvents(eventRows);
      setCustomers(customerRows);
    } catch (err) {
      setError(err.message || "Events could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createEvent = useCallback(
    async (input) => {
      await eventService.create(input);
      await refresh();
    },
    [refresh]
  );

  const updateEvent = useCallback(
    async (id, input) => {
      await eventService.update(id, input);
      await refresh();
    },
    [refresh]
  );

  const deleteEvent = useCallback(
    async (id) => {
      await eventService.remove(id);
      await refresh();
    },
    [refresh]
  );

  return {
    events,
    customers,
    loading,
    error,
    refresh,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}