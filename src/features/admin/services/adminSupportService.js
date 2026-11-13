
import { supabase } from "../../../lib/supabase";

export const adminSupportService = {
  // Fetch all support tickets
  async getTickets() {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(`
        *,
        businesses (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  },

  // Fetch messages for a ticket
  async getTicketMessages(ticketId) {
    const { data, error } = await supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return data || [];
  },

  // Update ticket status, priority or assigned admin
  async updateTicket(ticketId, updates) {
    const payload = { ...updates };

    if (payload.status === "resolved") {
      payload.resolved_at = new Date().toISOString();
      payload.closed_at = null;
    } else if (payload.status === "closed") {
      payload.closed_at = new Date().toISOString();

      if (!payload.resolved_at) {
        payload.resolved_at = new Date().toISOString();
      }
    } else if (
      payload.status === "open" ||
      payload.status === "in_progress"
    ) {
      payload.resolved_at = null;
      payload.closed_at = null;
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .update(payload)
      .eq("id", ticketId)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  // Send admin reply
  async sendReply(ticketId, message) {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error("Admin session not found.");

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      throw new Error("Reply message cannot be empty.");
    }

    const { data, error } = await supabase
      .from("support_ticket_messages")
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_role: "admin",
        message: cleanMessage,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },
};
