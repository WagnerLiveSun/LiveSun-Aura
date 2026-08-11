import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "../shared/const";
import { appRouter, filterPendingQuestionnaires, hasScheduleConflict, reminderDeliveryUpdate } from "./routers";
import type { TrpcContext } from "./_core/context";

function makeCtx(role: string, id = 1): TrpcContext {
  return {
    user: {
      id, openId: `test-${role}`, email: `${role}@clinica.com`, name: `Usuário ${role}`,
      loginMethod: "oauth", role: role as any, ativo: true, telefone: null,
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

describe("auth", () => {
  it("logout limpa o cookie de sessão e retorna sucesso", async () => {
    const cleared: string[] = [];
    const ctx: TrpcContext = {
      ...makeCtx("admin"),
      res: { clearCookie: (name: string) => cleared.push(name) } as any,
    };
    const result = await appRouter.createCaller(ctx).auth.logout();
    expect(result).toEqual({ success: true });
    expect(cleared).toContain(COOKIE_NAME);
  });

  it("me retorna null quando não autenticado", async () => {
    const ctx: TrpcContext = { user: null, req: { protocol: "https", headers: {} } as any, res: {} as any };
    const result = await appRouter.createCaller(ctx).auth.me();
    expect(result).toBeNull();
  });
});

describe("controle de acesso por perfil", () => {
  it("cliente não pode listar clientes (rota de equipe)", async () => {
    const caller = appRouter.createCaller(makeCtx("cliente"));
    await expect(caller.clientes.list()).rejects.toThrow(TRPCError);
  });

  it("profissional pode listar serviços", async () => {
    const caller = appRouter.createCaller(makeCtx("profissional"));
    const result = await caller.servicos.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("recepcao não pode criar serviços (somente admin)", async () => {
    const caller = appRouter.createCaller(makeCtx("recepcao"));
    await expect(caller.servicos.create({ nome: "Teste", valor: "100", duracaoMin: 60 })).rejects.toThrow(TRPCError);
  });

  it("admin pode acessar comissões", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.financeiro.comissoes();
    expect(Array.isArray(result)).toBe(true);
  });

  it("profissional não pode acessar comissões (somente admin)", async () => {
    const caller = appRouter.createCaller(makeCtx("profissional"));
    await expect(caller.financeiro.comissoes()).rejects.toThrow(TRPCError);
  });
});

describe("dashboard stats", () => {
  it("retorna as chaves esperadas para usuário de equipe", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const stats = await caller.financeiro.dashboardStats();
    expect(stats).toHaveProperty("faturamentoMes");
    expect(stats).toHaveProperty("agendamentosHoje");
    expect(stats).toHaveProperty("taxaOcupacao");
    expect(stats).toHaveProperty("aniversariantes");
    expect(Array.isArray(stats.aniversariantes)).toBe(true);
  });
});

describe("portal do cliente", () => {
  it("usuário com role admin não pode acessar o portal do cliente", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    await expect(caller.portal.resumo()).rejects.toThrow(TRPCError);
  });

  it("usuário com role cliente pode acessar o portal", async () => {
    const caller = appRouter.createCaller(makeCtx("cliente"));
    const result = await caller.portal.resumo();
    expect(result).toHaveProperty("vinculado");
  });
});

describe("agenda", () => {
  const session = {
    profissionalId: 7,
    salaId: 3,
    dataHoraInicio: new Date("2026-08-11T14:00:00.000Z"),
    dataHoraFim: new Date("2026-08-11T15:00:00.000Z"),
  };

  it("bloqueia sobreposição de horários do mesmo profissional", () => {
    expect(hasScheduleConflict([session], {
      profissionalId: 7,
      dataHoraInicio: new Date("2026-08-11T14:30:00.000Z"),
      dataHoraFim: new Date("2026-08-11T15:30:00.000Z"),
    })).toBe(true);
  });

  it("bloqueia sobreposição de horários da mesma sala", () => {
    expect(hasScheduleConflict([session], {
      profissionalId: 9,
      salaId: 3,
      dataHoraInicio: new Date("2026-08-11T14:30:00.000Z"),
      dataHoraFim: new Date("2026-08-11T15:30:00.000Z"),
    })).toBe(true);
  });

  it("permite horários consecutivos sem sobreposição", () => {
    expect(hasScheduleConflict([session], {
      profissionalId: 7,
      dataHoraInicio: new Date("2026-08-11T15:00:00.000Z"),
      dataHoraFim: new Date("2026-08-11T16:00:00.000Z"),
    })).toBe(false);
  });
});

describe("administração", () => {
  it("somente o administrador pode consultar usuários", async () => {
    const caller = appRouter.createCaller(makeCtx("recepcao"));
    await expect(caller.auth.listUsers()).rejects.toThrow(TRPCError);
  });

  it("profissional pode consultar os insumos ativos", async () => {
    const caller = appRouter.createCaller(makeCtx("profissional"));
    const result = await caller.recursos.insumos.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("recepção não pode cadastrar insumos", async () => {
    const caller = appRouter.createCaller(makeCtx("recepcao"));
    await expect(caller.recursos.insumos.create({ nome: "Gel condutor", unidade: "ml", estoqueAtual: "100", estoqueMinimo: "20", custoUnitario: "0,50" })).rejects.toThrow(TRPCError);
  });
});

describe("anamnese no portal", () => {
  it("mantém pendente somente a versão de questionário ainda não respondida", () => {
    const pending = filterPendingQuestionnaires(
      [{ id: 10, versao: 2 }, { id: 11, versao: 1 }],
      [{ questionarioId: 10, versaoQuestionario: 1 }, { questionarioId: 11, versaoQuestionario: 1 }],
    );
    expect(pending).toEqual([{ id: 10, versao: 2 }]);
  });
});

describe("fila de lembretes", () => {
  it("gestor consulta a fila com filtro de status", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.lembretes.list({ status: "PENDENTE" });
    expect(Array.isArray(result)).toBe(true);
    expect(result.every((item) => item.status === "PENDENTE")).toBe(true);
  });

  it("prepara a transição de um lembrete para enviado com data de processamento", () => {
    const sentAt = new Date("2026-08-11T14:00:00.000Z");
    expect(reminderDeliveryUpdate(sentAt)).toEqual({ status: "ENVIADO", enviadoEm: sentAt });
  });

  it("recepção não pode confirmar o processamento de lembretes", async () => {
    const caller = appRouter.createCaller(makeCtx("recepcao"));
    await expect(caller.lembretes.marcarEnviado({ id: 1 })).rejects.toThrow(TRPCError);
  });
});
