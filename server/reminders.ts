import { and, eq, isNull, lte, sql } from "drizzle-orm";
import { clientes, lembretes, sessoes, users } from "../drizzle/schema";
import { getDb } from "./db";
import { ENV } from "./_core/env";

type BrevoRecipient = { email: string; name?: string };

export function parseBrevoSender(raw: string) {
  const matched = raw.trim().match(/^(.*?)\s*<([^<>\s]+@[^<>\s]+)>$/);
  const email = matched?.[2] ?? raw.trim();
  const name = matched?.[1]?.trim() || "Aura Gestão Estética";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("BREVO_FROM_EMAIL não contém um remetente válido.");
  return { email, name };
}

export function buildBrevoReminderPayload(recipient: BrevoRecipient, content: string) {
  return {
    sender: parseBrevoSender(ENV.brevoFromEmail),
    to: [{ email: recipient.email, ...(recipient.name ? { name: recipient.name } : {}) }],
    subject: "Lembrete de atendimento — Aura Gestão Estética",
    textContent: content,
    htmlContent: `<div style="font-family:Arial,sans-serif;color:#2c2627;line-height:1.5"><p style="color:#8f3156;font-weight:700;letter-spacing:.08em">AURA GESTÃO ESTÉTICA</p><h1 style="font-family:Georgia,serif;font-size:24px">Lembrete de atendimento</h1><p>${content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p><p style="color:#776d70;font-size:13px">Em caso de necessidade, entre em contato com a clínica.</p></div>`,
  };
}

export async function sendBrevoReminder(recipient: BrevoRecipient, content: string) {
  if (!ENV.brevoApiKey) throw new Error("BREVO_API_KEY não configurada.");
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": ENV.brevoApiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(buildBrevoReminderPayload(recipient, content)),
  });
  if (!response.ok) throw new Error(`Brevo recusou o envio (${response.status}): ${(await response.text()).slice(0, 500)}`);
  return response.json().catch(() => ({}));
}

export async function dispatchDueReminderEmails() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para processar lembretes.");
  const due = await db.select().from(lembretes)
    .where(and(eq(lembretes.status, "PENDENTE"), lte(lembretes.agendadoPara, new Date()), isNull(lembretes.enviadoEm)))
    .orderBy(lembretes.agendadoPara)
    .limit(50);
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const reminder of due) {
    const claimed = await db.update(lembretes).set({ enviadoEm: new Date(), tentativas: sql`${lembretes.tentativas} + 1` })
      .where(and(eq(lembretes.id, reminder.id), eq(lembretes.status, "PENDENTE"), isNull(lembretes.enviadoEm)));
    if (!claimed[0].affectedRows) { skipped += 1; continue; }

    try {
      const session = (await db.select().from(sessoes).where(eq(sessoes.id, reminder.sessaoId)).limit(1))[0];
      if (!session) throw new Error("Sessão do lembrete não encontrada.");
      const recipient = reminder.destinatario === "CLIENTE"
        ? (await db.select({ email: clientes.email, name: clientes.nome }).from(clientes).where(eq(clientes.id, session.clienteId)).limit(1))[0]
        : (await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, session.profissionalId)).limit(1))[0];
      if (!recipient?.email) throw new Error("Destinatário sem e-mail cadastrado.");
      await sendBrevoReminder({ email: recipient.email, name: recipient.name ?? undefined }, reminder.conteudo);
      await db.update(lembretes).set({ status: "ENVIADO", canal: "EMAIL", enviadoEm: new Date() }).where(eq(lembretes.id, reminder.id));
      sent += 1;
    } catch (error) {
      await db.update(lembretes).set({ status: "FALHA", enviadoEm: null }).where(eq(lembretes.id, reminder.id));
      console.error(`[Lembretes] Falha ao enviar o lembrete ${reminder.id}:`, error);
      failed += 1;
    }
  }
  return { processed: due.length, sent, failed, skipped };
}
