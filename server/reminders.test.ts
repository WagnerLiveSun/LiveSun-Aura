import { describe, expect, it } from "vitest";
import { buildBrevoReminderPayload, parseBrevoSender } from "./reminders";

describe("lembretes por e-mail", () => {
  it("separa o nome e o e-mail de um remetente configurado", () => {
    expect(parseBrevoSender("Agenda Aura <agenda@aura.com.br>")).toEqual({ name: "Agenda Aura", email: "agenda@aura.com.br" });
  });

  it("monta o conteúdo transacional sem interpolar HTML fornecido pelo usuário", () => {
    const payload = buildBrevoReminderPayload({ email: "cliente@aura.com.br", name: "Cliente" }, "Consulta <confirmada>");
    expect(payload.to[0]).toMatchObject({ email: "cliente@aura.com.br", name: "Cliente" });
    expect(payload.htmlContent).toContain("&lt;confirmada&gt;");
    expect(payload.subject).toContain("Lembrete");
  });
});
