
import { useCallback, useEffect, useMemo, useState } from "react";
import groupService from "../services/groupService";

export default function useGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await groupService.getAll();
      setGroups(data);
    } catch (err) {
      console.error("Groups loading failed:", err);
      setError(err.message || "Unable to load groups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const summary = useMemo(() => {
    return groups.reduce(
      (result, group) => {
        result.totalGroups += 1;
        result.totalCustomers += group.customerCount;
        result.balanceJar += group.balanceJar;
        result.totalDue += group.totalDue;
        result.advance += group.advance;
        return result;
      },
      {
        totalGroups: 0,
        totalCustomers: 0,
        balanceJar: 0,
        totalDue: 0,
        advance: 0,
      }
    );
  }, [groups]);

  async function createGroup(values) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await groupService.create(values);
      setSuccess("Group created successfully.");
      await loadGroups();
      return true;
    } catch (err) {
      setError(err.message || "Unable to create group.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function updateGroup(id, values) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await groupService.update(id, values);
      setSuccess("Group updated successfully.");
      await loadGroups();
      return true;
    } catch (err) {
      setError(err.message || "Unable to update group.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteGroup(id) {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await groupService.delete(id);
      setSuccess("Group deleted successfully.");
      await loadGroups();
      return true;
    } catch (err) {
      setError(err.message || "Unable to delete group.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    groups,
    summary,
    loading,
    saving,
    error,
    success,
    setError,
    setSuccess,
    loadGroups,
    createGroup,
    updateGroup,
    deleteGroup,
  };
}
