
import { supabase } from "../../../lib/supabase/client";

import {
  getCurrentBusinessId,
} from "../../auth/services/businessAccessService";

import {
  validateEmployee,
  validateDispatch,
  validateMoney,
} from "../utils/validators";

const DOCUMENT_BUCKET = "employee-documents";

function handleResult({ data, error }) {
  if (error) throw error;
  return data;
}

async function getBusinessId() {
  return getCurrentBusinessId();
}

async function verifyEmployee(employeeId) {
  const businessId = await getBusinessId();

  const employee = handleResult(
    await supabase
      .from("staff_employees")
      .select("id")
      .eq("business_id", businessId)
      .eq("id", employeeId)
      .single()
  );

  return {
    businessId,
    employeeId: employee.id,
  };
}

async function logActivity(businessId, employeeId, action, description) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return handleResult(
    await supabase.from("staff_activity_logs").insert({
      business_id: businessId,
      employee_id: employeeId,
      actor_user_id: user?.id || null,
      action,
      description,
    })
  );
}

function applyMonthFilter(query, column, month) {
  if (!month) return query;

  const [year, monthNumber] = month.split("-").map(Number);

  const lastDay = new Date(year, monthNumber, 0).getDate();

  const start = `${month}-01`;
  const end = `${month}-${String(lastDay).padStart(2, "0")}`;

  return query.gte(column, start).lte(column, end);
}

export const employeeService = {
  // EMPLOYEE LIST
  async list({ search = "", status = "all" } = {}) {
    const businessId = await getBusinessId();

    let query = supabase
      .from("staff_employees")
      .select("*")
      .eq("business_id", businessId)
      .order("name");

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (search.trim()) {
      const safeSearch = search.trim().replace(/[,%()]/g, "");

      query = query.or(
        `name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%`
      );
    }

    return handleResult(await query);
  },

  // SINGLE EMPLOYEE
  async get(id) {
    const businessId = await getBusinessId();

    return handleResult(
      await supabase
        .from("staff_employees")
        .select("*")
        .eq("business_id", businessId)
        .eq("id", id)
        .single()
    );
  },

  // CREATE / UPDATE EMPLOYEE
  async save(employee) {
    const validation = validateEmployee(employee);
    if (validation) throw new Error(validation);

    const businessId = await getBusinessId();

    const payload = {
      name: employee.name.trim(),
      phone: employee.phone.trim(),
      role: employee.role || "delivery_boy",
      address: employee.address || null,
      joining_date: employee.joining_date,
      monthly_salary: Number(employee.monthly_salary),
      status: employee.status || "active",
      notes: employee.notes || null,
      updated_at: new Date().toISOString(),
    };

    const result = employee.id
      ? handleResult(
          await supabase
            .from("staff_employees")
            .update(payload)
            .eq("business_id", businessId)
            .eq("id", employee.id)
            .select()
            .single()
        )
      : handleResult(
          await supabase
            .from("staff_employees")
            .insert({
              ...payload,
              business_id: businessId,
            })
            .select()
            .single()
        );

    await logActivity(
      businessId,
      result.id,
      employee.id ? "employee_updated" : "employee_created",
      `Employee ${employee.id ? "updated" : "created"}: ${result.name}`
    );

    return result;
  },

  // DISPATCH HISTORY
  async dispatches(employeeId, month) {
    const { businessId } = await verifyEmployee(employeeId);

    const query = supabase
      .from("staff_dispatches")
      .select("*")
      .eq("business_id", businessId)
      .eq("employee_id", employeeId)
      .order("dispatch_date", { ascending: false });

    return handleResult(
      await applyMonthFilter(query, "dispatch_date", month)
    );
  },

  // SAVE DISPATCH
  async saveDispatch(input) {
    const validation = validateDispatch(input);
    if (validation) throw new Error(validation);

    const { businessId } = await verifyEmployee(input.employee_id);

    const taken = Number(input.jars_taken || 0);
    const delivered = Number(input.jars_delivered || 0);
    const returned = Number(input.jars_returned || 0);
    const damaged = Number(input.jars_damaged || 0);
    const missing = Number(input.jars_missing || 0);

    const pending =
      taken - delivered - returned - damaged - missing;

    const result = handleResult(
      await supabase
        .from("staff_dispatches")
        .insert({
          business_id: businessId,
          employee_id: input.employee_id,
          dispatch_date: input.dispatch_date,
          trip_label: input.trip_label || null,
          area: input.area || null,
          vehicle_number: input.vehicle_number || null,
          jars_taken: taken,
          jars_delivered: delivered,
          jars_returned: returned,
          jars_damaged: damaged,
          jars_missing: missing,
          pending_jars: pending,
          notes: input.notes || null,
        })
        .select()
        .single()
    );

    await logActivity(
      businessId,
      input.employee_id,
      "dispatch_created",
      `Dispatch recorded: ${delivered} jars delivered`
    );

    return result;
  },

  // SALARY TRANSACTIONS
  async transactions(employeeId) {
    const { businessId } = await verifyEmployee(employeeId);

    return handleResult(
      await supabase
        .from("staff_financial_transactions")
        .select("*")
        .eq("business_id", businessId)
        .eq("employee_id", employeeId)
        .order("transaction_date", { ascending: false })
    );
  },

  async addTransaction(input) {
    const validation = validateMoney(input);
    if (validation) throw new Error(validation);

    const { businessId } = await verifyEmployee(input.employee_id);

    const result = handleResult(
      await supabase
        .from("staff_financial_transactions")
        .insert({
          business_id: businessId,
          employee_id: input.employee_id,
          transaction_date: input.transaction_date,
          transaction_type: input.transaction_type,
          amount: Number(input.amount),
          payment_method: input.payment_method || "cash",
          reference: input.reference || null,
          notes: input.notes || null,
        })
        .select()
        .single()
    );

    await logActivity(
      businessId,
      input.employee_id,
      input.transaction_type,
      `${input.transaction_type}: ₹${input.amount}`
    );

    return result;
  },

  // ATTENDANCE
  async attendance(employeeId, month) {
    const { businessId } = await verifyEmployee(employeeId);

    const query = supabase
      .from("staff_attendance")
      .select("*")
      .eq("business_id", businessId)
      .eq("employee_id", employeeId)
      .order("attendance_date", { ascending: false });

    return handleResult(
      await applyMonthFilter(query, "attendance_date", month)
    );
  },

  async saveAttendance(input) {
    const { businessId } = await verifyEmployee(input.employee_id);

    const allowed = [
      "present",
      "absent",
      "half_day",
      "weekly_off",
      "holiday",
    ];

    if (!input.attendance_date || !allowed.includes(input.status)) {
      throw new Error("Select a valid attendance date and status.");
    }

    const result = handleResult(
      await supabase
        .from("staff_attendance")
        .upsert(
          {
            business_id: businessId,
            employee_id: input.employee_id,
            attendance_date: input.attendance_date,
            status: input.status,
            notes: input.notes || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "employee_id,attendance_date" }
        )
        .select()
        .single()
    );

    await logActivity(
      businessId,
      input.employee_id,
      "attendance_updated",
      `Attendance marked ${input.status} for ${input.attendance_date}`
    );

    return result;
  },

  // LEAVE
  async leaves(employeeId) {
    const { businessId } = await verifyEmployee(employeeId);

    return handleResult(
      await supabase
        .from("staff_leaves")
        .select("*")
        .eq("business_id", businessId)
        .eq("employee_id", employeeId)
        .order("start_date", { ascending: false })
    );
  },

  async saveLeave(input) {
    const { businessId } = await verifyEmployee(input.employee_id);

    if (
      !input.start_date ||
      !input.end_date ||
      input.end_date < input.start_date
    ) {
      throw new Error("Enter a valid leave date range.");
    }

    const result = handleResult(
      await supabase
        .from("staff_leaves")
        .insert({
          business_id: businessId,
          employee_id: input.employee_id,
          start_date: input.start_date,
          end_date: input.end_date,
          leave_type: input.leave_type || "paid",
          reason: input.reason || null,
          status: "approved",
        })
        .select()
        .single()
    );

    await logActivity(
      businessId,
      input.employee_id,
      "leave_created",
      `Leave recorded: ${input.start_date} to ${input.end_date}`
    );

    return result;
  },

  // EMPLOYEE WALLET
  async walletTransactions(employeeId) {
    const { businessId } = await verifyEmployee(employeeId);

    return handleResult(
      await supabase
        .from("staff_wallet_transactions")
        .select("*")
        .eq("business_id", businessId)
        .eq("employee_id", employeeId)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
    );
  },

  async addWalletTransaction(input) {
    const { businessId } = await verifyEmployee(input.employee_id);

    const amount = Number(input.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !["credit", "debit"].includes(input.direction) ||
      !input.transaction_date
    ) {
      throw new Error("Enter a valid wallet transaction.");
    }

    const result = handleResult(
      await supabase
        .from("staff_wallet_transactions")
        .insert({
          business_id: businessId,
          employee_id: input.employee_id,
          transaction_date: input.transaction_date,
          direction: input.direction,
          amount,
          payment_method: input.payment_method || "cash",
          description: input.description || null,
        })
        .select()
        .single()
    );

    await logActivity(
      businessId,
      input.employee_id,
      `wallet_${input.direction}`,
      `Wallet ${input.direction}: ₹${amount}`
    );

    return result;
  },

  // DOCUMENTS
  async documents(employeeId) {
    const { businessId } = await verifyEmployee(employeeId);

    return handleResult(
      await supabase
        .from("staff_employee_documents")
        .select("*")
        .eq("business_id", businessId)
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
    );
  },

  async uploadDocument(employeeId, file, metadata = {}) {
    const { businessId } = await verifyEmployee(employeeId);

    if (!file || file.size > 10 * 1024 * 1024) {
      throw new Error("Choose a file smaller than 10 MB.");
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Only PDF, JPG, PNG and WEBP files are allowed.");
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${businessId}/${employeeId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    try {
      const result = handleResult(
        await supabase
          .from("staff_employee_documents")
          .insert({
            business_id: businessId,
            employee_id: employeeId,
            storage_path: path,
            file_name: file.name,
            mime_type: file.type,
            file_size: file.size,
            document_type: metadata.document_type || "other",
            title: metadata.title || file.name,
          })
          .select()
          .single()
      );

      await logActivity(
        businessId,
        employeeId,
        "document_uploaded",
        `Document uploaded: ${metadata.title || file.name}`
      );

      return result;
    } catch (error) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove([path]);
      throw error;
    }
  },

  async documentUrl(path) {
    const businessId = await getBusinessId();

    if (!path.startsWith(`${businessId}/`)) {
      throw new Error("Invalid document path.");
    }

    const { data, error } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(path, 60);

    if (error) throw error;

    return data.signedUrl;
  },

  async deleteDocument(id) {
    const businessId = await getBusinessId();

    const doc = handleResult(
      await supabase
        .from("staff_employee_documents")
        .select("*")
        .eq("business_id", businessId)
        .eq("id", id)
        .single()
    );

    const { error } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .remove([doc.storage_path]);

    if (error) throw error;

    handleResult(
      await supabase
        .from("staff_employee_documents")
        .delete()
        .eq("business_id", businessId)
        .eq("id", id)
    );

    await logActivity(
      businessId,
      doc.employee_id,
      "document_deleted",
      `Document deleted: ${doc.title || doc.file_name}`
    );

    return true;
  },

  // ACTIVITY HISTORY
  async activity(employeeId) {
    const { businessId } = await verifyEmployee(employeeId);

    return handleResult(
      await supabase
        .from("staff_activity_logs")
        .select("*")
        .eq("business_id", businessId)
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })
        .limit(200)
    );
  },
};

