import { describe, expect, it } from "vitest";

describe("configuração de e-mail Brevo", () => {
  it("valida a chave e o remetente configurados", async () => {
    expect(process.env.BREVO_API_KEY).toBeTruthy();
    expect(process.env.BREVO_FROM_EMAIL).toBeTruthy();

    const response = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": process.env.BREVO_API_KEY ?? "" },
    });

    expect(response.ok).toBe(true);
  }, 20_000);
});
