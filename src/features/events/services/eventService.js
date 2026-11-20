
import { supabase } from "../../../lib/supabase";

const TABLE = "events";

async function getBusinessId() {
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError) throw authError;

  if (!authData?.user) {
    throw new Error("Please sign in to continue.");
  }

  const { data: business, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", authData.user.id)
    .maybeSingle();

  if (error) throw error;

  if (!business?.id) {
    throw new Error("Business profile not found.");
  }

  return business.id;
}

const numeric = (value) => Number(value || 0);

function normalizeEvent(row) {
  const delivered = numeric(row.delivered);
  const received = numeric(row.received);

  return {
    id: row.id,
    customerId: row.customer_id,
    customerName:
      row.customers?.name ||
      row.customer_name ||
      "Unknown customer",
    customerPhone: row.customers?.phone || "",
    eventName: row.event_name || "",
    startOn: row.start_on,
    endOn: row.end_on,
    status: row.status || "pending",
    paymentStatus: row.payment_status || "pending",
    eventInvoice: numeric(row.event_invoice),
    dueAmount: numeric(row.due_amount),
    advanceAmount: numeric(row.advance_amount),
    eventPayment: numeric(row.event_payment),
    delivered,
    received,
    unreceived: Math.max(
      0,
      numeric(row.unreceived ?? delivered - received)
    ),
    notes: row.notes || "",
    createdAt: row.created_at,
  };
}

const eventService = {
  // GET CUSTOMERS
  async getCustomers() {
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from("customers")
      .select("id, name, phone, area")
      .eq("business_id", businessId)
      .order("name");

    if (error) throw error;

    return data || [];
  },

  // GET ALL EVENTS
  async getAll() {
    const businessId = await getBusinessId();

    const { data, error } = await supabase
      .from(TABLE)
      .select(`
        id,
        business_id,
        customer_id,
        event_name,
        start_on,
        end_on,
        status,
        payment_status,
        event_invoice,
        due_amount,
        advance_amount,
        event_payment,
        delivered,
        received,
        unreceived,
        notes,
        created_at,
        customers(name, phone)
      `)
      .eq("business_id", businessId)
      .order("start_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map(normalizeEvent);
  },

  // CREATE EVENT
  async create(input) {
    const businessId = await getBusinessId();

    const delivered = numeric(input.delivered);
    const received = numeric(input.received);

    const payload = {
      business_id: businessId,
      customer_id: input.customerId,
      event_name: input.eventName.trim(),
      start_on: input.startOn,
      end_on: input.endOn,
      status: input.status || "pending",
      payment_status: input.paymentStatus || "pending",
      event_invoice: numeric(input.eventInvoice),
      due_amount: numeric(input.dueAmount),
      advance_amount: numeric(input.advanceAmount),
      event_payment: numeric(input.eventPayment),
      delivered,
      received,
      unreceived: Math.max(0, delivered - received),
      notes: input.notes?.trim() || null,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .insert(payload)
      .select("id")
      .single();

    if (error) throw error;

    return data;
  },

  // UPDATE EVENT
  async update(id, input) {
    const businessId = await getBusinessId();

    const delivered = numeric(input.delivered);
    const received = numeric(input.received);

    const payload = {
      customer_id: input.customerId,
      event_name: input.eventName.trim(),
      start_on: input.startOn,
      end_on: input.endOn,
      status: input.status,
      payment_status: input.paymentStatus,
      event_invoice: numeric(input.eventInvoice),
      due_amount: numeric(input.dueAmount),
      advance_amount: numeric(input.advanceAmount),
      event_payment: numeric(input.eventPayment),
      delivered,
      received,
      unreceived: Math.max(0, delivered - received),
      notes: input.notes?.trim() || null,
    };

    const { error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq("id", id)
      .eq("business_id", businessId);

    if (error) throw error;
  },

  // DELETE EVENT + RELATED RECORDS
  async remove(id) {
    if (!id) {
      throw new Error("Event ID is required.");
    }

    const { data, error } = await supabase.rpc(
      "delete_event_with_related_records",
      {
        p_event_id: id,
      }
    );

    if (error) throw error;

    if (!data?.success) {
      throw new Error(
        data?.message || "Event could not be deleted."
      );
    }

    return data;
  },
};

export default eventService;
