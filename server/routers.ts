import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import {
  auditoria,
  caixasDiarios,
  clientes,
  comissoes,
  contasReceber,
  despesas,
  equipamentos,
  evolucoes,
  fotosProntuario,
  insumos,
  lembretes,
  passwordResetTokens,
  perguntas,
  profissionaisServicos,
  prontuarios,
  questionarioPerguntas,
  questionarios,
  recebimentos,
  respostas,
  respostasQuestionario,
  salas,
  servicos,
  sessoes,
  users,
} from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { storagePut } from "./storage";
import { createSessionToken } from "./_core/sdk";

const roles = z.enum(["user", "admin", "recepcao", "profissional", "cliente"]);
const sessionStatus = z.enum([
  "PENDENTE",
  "AGUARDANDO_CONFIRMACAO",
  "CONFIRMADA",
  "EM_ATENDIMENTO",
  "CONCLUIDA",
  "CANCELADA",
  "NAO_COMPARECEU",
  "BLOQUEADA",
]);
const money = z.string().regex(/^\d+(?:[.,]\d{1,2})?$/, "Informe um valor válido.");
const paymentType = z.enum(["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA", "OUTRO"]);
const staffRoles = ["admin", "recepcao", "profissional"] as const;
const managementRoles = ["admin", "recepcao"] as const;

function requireRole(allowed: readonly z.infer<typeof roles>[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!allowed.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Seu perfil não tem permissão para esta operação." });
    }
    return next({ ctx });
  });
}

const staffProcedure = requireRole(staffRoles);
const managementProcedure = requireRole(managementRoles);
const adminOnlyProcedure = requireRole(["admin"]);

function toCurrency(value: string) {
  return value.replace(",", ".");
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function requireDatabase<T>(db: T | null): T {
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
  return db;
}

async function currentClientId(userId: number) {
  const db = requireDatabase(await getDb());
  return (await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, userId)).limit(1))[0]?.id;
}

async function canAccessClient(user: { id: number; role: string }, clientId: number) {
  if (user.role === "admin" || user.role === "recepcao") return true;
  if (user.role === "cliente" || user.role === "user") return (await currentClientId(user.id)) === clientId;
  const db = requireDatabase(await getDb());
  return Boolean((await db.select({ id: sessoes.id }).from(sessoes)
    .where(and(eq(sessoes.clienteId, clientId), eq(sessoes.profissionalId, user.id))).limit(1))[0]);
}

async function audit(userId: number, entity: string, action: string, entityId?: number, clientId?: number, after?: unknown) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditoria).values({
    usuarioId: userId,
    clienteId: clientId ?? null,
    entidade: entity,
    entidadeId: entityId ?? null,
    acao: action,
    dadosDepoisJson: after ? JSON.stringify(after) : null,
  });
}

function decodeImage(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Envie uma imagem PNG, JPEG ou WEBP válida." });
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "A imagem deve ter no máximo 5 MB." });
  }
  const extension = match[1] === "image/jpeg" ? "jpg" : match[1].split("/")[1];
  return { buffer, contentType: match[1], extension };
}

export function hasScheduleConflict(
  activeSessions: Array<{ profissionalId: number; salaId: number | null; dataHoraInicio: Date; dataHoraFim: Date }>,
  input: { profissionalId: number; salaId?: number; dataHoraInicio: Date; dataHoraFim: Date },
) {
  return activeSessions.some((session) =>
    (session.profissionalId === input.profissionalId || (input.salaId && session.salaId === input.salaId))
    && input.dataHoraInicio < session.dataHoraFim
    && input.dataHoraFim > session.dataHoraInicio,
  );
}

export function filterPendingQuestionnaires<T extends { id: number; versao: number }>(
  published: T[],
  answered: Array<{ questionarioId: number; versaoQuestionario: number }>,
) {
  return published.filter((questionnaire) => !answered.some((response) => response.questionarioId === questionnaire.id && response.versaoQuestionario === questionnaire.versao));
}

export function reminderDeliveryUpdate(sentAt: Date) {
  return { status: "ENVIADO" as const, enviadoEm: sentAt };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
    login: publicProcedure.input(z.object({
      email: z.string().email("E-mail inválido"),
      password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
    })).mutation(async ({ input, ctx }) => {
      const db = requireDatabase(await getDb());

      // Buscar usuário por e-mail
      const user = (await db.select().from(users).where(eq(users.email, input.email)).limit(1))[0];
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos" });
      }

      // Verificar se usuário está ativo
      if (!user.ativo) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Usuário desativado" });
      }

      // Verificar se está bloqueado
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Conta temporariamente bloqueada. Tente novamente mais tarde." });
      }

      // Verificar senha
      if (!user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos" });
      }

      const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!passwordValid) {
        // Incrementar tentativas falhas
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        const updateData: any = { failedLoginAttempts: failedAttempts };

        // Bloquear após 5 tentativas por 15 minutos
        if (failedAttempts >= 5) {
          updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }

        await db.update(users).set(updateData).where(eq(users.id, user.id));
        throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos" });
      }

      // Resetar tentativas falhas e desbloquear
      await db.update(users).set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastSignedIn: new Date(),
      }).where(eq(users.id, user.id));

      // Criar sessão (usando o mesmo formato JWT existente)
      const token = await createSessionToken(user);

      // Set cookie
      ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));

      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),
    criarUsuario: adminOnlyProcedure.input(z.object({
      name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
      email: z.string().email("E-mail inválido"),
      password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
      role: roles,
      telefone: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const db = requireDatabase(await getDb());

      // Verificar se e-mail já existe
      const existing = (await db.select().from(users).where(eq(users.email, input.email)).limit(1))[0];
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado" });
      }

      // Gerar openId e hash da senha
      const openId = randomUUID();
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Criar usuário
      const [result] = await db.insert(users).values({
        openId,
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
        telefone: input.telefone || null,
        loginMethod: "local",
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });

      await audit(ctx.user.id, "usuario", "CRIADO", result.insertId, undefined, { name: input.name, email: input.email, role: input.role });

      return { success: true, userId: result.insertId };
    }),
    solicitarRedefinicao: publicProcedure.input(z.object({
      email: z.string().email("E-mail inválido"),
    })).mutation(async ({ input }) => {
      const db = requireDatabase(await getDb());

      // Buscar usuário por e-mail (não revelar se existe ou não)
      const user = (await db.select().from(users).where(eq(users.email, input.email)).limit(1))[0];
      if (!user) {
        // Retornar sucesso mesmo se usuário não existe (security by obscurity)
        return { success: true };
      }

      // Gerar token e hash
      const token = randomUUID();
      const tokenHash = await bcrypt.hash(token, 10);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Salvar token no banco
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt,
        createdAt: new Date(),
      });

      // TODO: Enviar e-mail com link de redefinição
      // Link: https://seusite.com/redefinir-senha?token=${token}

      return { success: true };
    }),
    redefinirSenha: publicProcedure.input(z.object({
      token: z.string(),
      newPassword: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
    })).mutation(async ({ input }) => {
      const db = requireDatabase(await getDb());

      // Buscar token válido e não usado
      const tokenRecord = (await db.select().from(passwordResetTokens)
        .where(and(
          sql`${passwordResetTokens.usedAt} IS NULL`,
          gte(passwordResetTokens.expiresAt, new Date())
        ))
        .limit(1))[0];

      if (!tokenRecord) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token inválido ou expirado" });
      }

      // Verificar hash do token
      const tokenValid = await bcrypt.compare(input.token, tokenRecord.tokenHash);
      if (!tokenValid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token inválido ou expirado" });
      }

      // Buscar usuário
      const user = (await db.select().from(users).where(eq(users.id, tokenRecord.userId)).limit(1))[0];
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
      }

      // Hash nova senha
      const newPasswordHash = await bcrypt.hash(input.newPassword, 10);

      // Atualizar senha e marcar token como usado
      await db.update(users).set({
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      }).where(eq(users.id, user.id));

      await db.update(passwordResetTokens).set({
        usedAt: new Date(),
      }).where(eq(passwordResetTokens.id, tokenRecord.id));

      return { success: true };
    }),
    listUsers: adminOnlyProcedure.query(async () => {
      const db = requireDatabase(await getDb());
      return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, ativo: users.ativo }).from(users).orderBy(users.name);
    }),
    updateRole: adminOnlyProcedure.input(z.object({ id: z.number().int().positive(), role: roles, ativo: z.boolean().optional() }))
      .mutation(async ({ input, ctx }) => {
        const db = requireDatabase(await getDb());
        await db.update(users).set({ role: input.role, ...(input.ativo === undefined ? {} : { ativo: input.ativo }) }).where(eq(users.id, input.id));
        await audit(ctx.user.id, "usuario", "PERFIL_ATUALIZADO", input.id, undefined, input);
        return { success: true };
      }),
    registrarCliente: publicProcedure.input(z.object({
      nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
      email: z.string().email("E-mail inválido"),
      telefone: z.string().optional(),
      password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
      dataNascimento: z.string().optional(),
    })).mutation(async ({ input }) => {
      const db = requireDatabase(await getDb());

      // Verificar se e-mail já existe
      const existingUser = (await db.select().from(users).where(eq(users.email, input.email)).limit(1))[0];
      if (existingUser) {
        throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado" });
      }

      // Gerar openId e hash da senha
      const openId = randomUUID();
      const passwordHash = await bcrypt.hash(input.password, 10);

      // Criar usuário com role "cliente"
      const [userResult] = await db.insert(users).values({
        openId,
        name: input.nome,
        email: input.email,
        passwordHash,
        role: "cliente",
        telefone: input.telefone || null,
        loginMethod: "local",
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      });

      // Criar registro de cliente
      const [clienteResult] = await db.insert(clientes).values({
        userId: userResult.insertId,
        nome: input.nome,
        email: input.email,
        telefone: input.telefone || null,
        dataNascimento: input.dataNascimento || null,
        status: "ATIVO",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Criar prontuário vazio
      await db.insert(prontuarios).values({
        clienteId: clienteResult.insertId,
        atualizadoPor: userResult.insertId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { success: true, userId: userResult.insertId, clienteId: clienteResult.insertId };
    }),
  }),

  clientes: router({
    list: staffProcedure.query(async ({ ctx }) => {
      const db = requireDatabase(await getDb());
      const list = await db.select().from(clientes).orderBy(desc(clientes.createdAt));
      if (ctx.user.role !== "profissional") return list;
      const own = await db.select({ clienteId: sessoes.clienteId }).from(sessoes).where(eq(sessoes.profissionalId, ctx.user.id));
      return list.filter((client) => own.some((session) => session.clienteId === client.id));
    }),
    get: staffProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
      if (!(await canAccessClient(ctx.user, input.id))) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a este prontuário." });
      const db = requireDatabase(await getDb());
      const client = (await db.select().from(clientes).where(eq(clientes.id, input.id)).limit(1))[0];
      if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado." });
      const record = (await db.select().from(prontuarios).where(eq(prontuarios.clienteId, input.id)).limit(1))[0] ?? null;
      const history = await db.select().from(sessoes).where(eq(sessoes.clienteId, input.id)).orderBy(desc(sessoes.dataHoraInicio));
      const photos = await db.select().from(fotosProntuario).where(eq(fotosProntuario.clienteId, input.id)).orderBy(desc(fotosProntuario.createdAt));
      return { client, record, history, photos: photos.map((photo) => ({ ...photo, url: `/storage/${photo.storageKey}` })) };
    }),
    create: managementProcedure.input(z.object({
      nome: z.string().trim().min(3).max(250), email: z.string().email().optional().or(z.literal("")),
      telefone: z.string().trim().max(32).optional(), cpfHash: z.string().max(128).optional(), cpfEncrypted: z.string().optional(),
      dataNascimento: z.string().max(16).optional(), observacoesInternas: z.string().max(5000).optional(),
    })).mutation(async ({ input, ctx }) => {
      const db = requireDatabase(await getDb());
      const [result] = await db.insert(clientes).values({
        nome: input.nome, email: input.email || null, telefone: input.telefone || null, cpfHash: input.cpfHash || null,
        cpfEncrypted: input.cpfEncrypted || null, dataNascimento: input.dataNascimento || null, observacoesInternas: input.observacoesInternas || null,
      });
      await db.insert(prontuarios).values({ clienteId: result.insertId, atualizadoPor: ctx.user.id });
      await audit(ctx.user.id, "cliente", "CRIADO", result.insertId, result.insertId, { nome: input.nome });
      return { success: true, id: result.insertId };
    }),
    update: managementProcedure.input(z.object({ id: z.number().int().positive(), nome: z.string().trim().min(3).max(250), email: z.string().email().optional().or(z.literal("")), telefone: z.string().trim().max(32).optional(), dataNascimento: z.string().max(16).optional(), observacoesInternas: z.string().max(5000).optional(), status: z.enum(["ATIVO", "INATIVO", "BLOQUEADO"]).optional() }))
      .mutation(async ({ input, ctx }) => {
        const db = requireDatabase(await getDb());
        await db.update(clientes).set({ nome: input.nome, email: input.email || null, telefone: input.telefone || null, dataNascimento: input.dataNascimento || null, observacoesInternas: input.observacoesInternas || null, ...(input.status ? { status: input.status } : {}) }).where(eq(clientes.id, input.id));
        await audit(ctx.user.id, "cliente", "ATUALIZADO", input.id, input.id, input);
        return { success: true };
      }),
  }),

  prontuario: router({
    update: staffProcedure.input(z.object({ clienteId: z.number().int().positive(), alergias: z.string().max(4000).optional(), restricoes: z.string().max(4000).optional(), observacoesClinicas: z.string().max(8000).optional() }))
      .mutation(async ({ input, ctx }) => {
        if (!(await canAccessClient(ctx.user, input.clienteId))) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a este prontuário." });
        const db = requireDatabase(await getDb());
        await db.insert(prontuarios).values({ ...input, atualizadoPor: ctx.user.id }).onDuplicateKeyUpdate({ set: { alergias: input.alergias ?? null, restricoes: input.restricoes ?? null, observacoesClinicas: input.observacoesClinicas ?? null, atualizadoPor: ctx.user.id } });
        await audit(ctx.user.id, "prontuario", "ATUALIZADO", undefined, input.clienteId);
        return { success: true };
      }),
    addEvolution: staffProcedure.input(z.object({ clienteId: z.number().int().positive(), sessaoId: z.number().int().positive(), observacoes: z.string().trim().min(3).max(8000) }))
      .mutation(async ({ input, ctx }) => {
        if (!(await canAccessClient(ctx.user, input.clienteId))) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a este prontuário." });
        const db = requireDatabase(await getDb());
        const session = (await db.select().from(sessoes).where(eq(sessoes.id, input.sessaoId)).limit(1))[0];
        if (!session || session.clienteId !== input.clienteId) throw new TRPCError({ code: "BAD_REQUEST", message: "Sessão inválida para esta evolução." });
        if (ctx.user.role === "profissional" && session.profissionalId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "A evolução deve pertencer à sua sessão." });
        await db.insert(evolucoes).values({ ...input, profissionalId: ctx.user.id }).onDuplicateKeyUpdate({ set: { observacoes: input.observacoes, profissionalId: ctx.user.id } });
        return { success: true };
      }),
    uploadPhoto: staffProcedure.input(z.object({ clienteId: z.number().int().positive(), sessaoId: z.number().int().positive().optional(), categoria: z.enum(["ANTES", "DEPOIS", "EVOLUCAO"]), legenda: z.string().max(250).optional(), dataUrl: z.string().min(20) }))
      .mutation(async ({ input, ctx }) => {
        if (!(await canAccessClient(ctx.user, input.clienteId))) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a este prontuário." });
        const db = requireDatabase(await getDb());
        const image = decodeImage(input.dataUrl);
        const uploaded = await storagePut(`clinica/prontuarios/${input.clienteId}/${crypto.randomUUID()}.${image.extension}`, image.buffer, image.contentType);
        const [result] = await db.insert(fotosProntuario).values({ clienteId: input.clienteId, sessaoId: input.sessaoId ?? null, categoria: input.categoria, legenda: input.legenda || null, storageKey: uploaded.key, enviadoPor: ctx.user.id });
        await audit(ctx.user.id, "foto_prontuario", "ENVIADA", result.insertId, input.clienteId);
        return { success: true, id: result.insertId, url: uploaded.url };
      }),
  }),

  servicos: router({
    list: protectedProcedure.query(async () => requireDatabase(await getDb()).select().from(servicos).where(eq(servicos.ativo, true)).orderBy(servicos.nome)),
    create: adminOnlyProcedure.input(z.object({ nome: z.string().trim().min(3).max(250), descricao: z.string().max(3000).optional(), duracaoMin: z.number().int().min(10).max(600).default(60), valor: money, tipoServico: z.string().trim().max(64).default("procedimento"), exigeQuestionario: z.boolean().default(true) }))
      .mutation(async ({ input, ctx }) => {
        const db = requireDatabase(await getDb());
        const [result] = await db.insert(servicos).values({ ...input, valor: toCurrency(input.valor), descricao: input.descricao || null });
        await audit(ctx.user.id, "servico", "CRIADO", result.insertId, undefined, input);
        return { success: true, id: result.insertId };
      }),
  }),

  profissionais: router({
    list: managementProcedure.query(async () => requireDatabase(await getDb()).select({ id: users.id, name: users.name, email: users.email, role: users.role, telefone: users.telefone }).from(users).where(inArray(users.role, ["admin", "profissional"])).orderBy(users.name)),
    habilitarServico: adminOnlyProcedure.input(z.object({ profissionalId: z.number().int().positive(), servicoId: z.number().int().positive(), comissaoPercentual: z.string().regex(/^\d{1,3}(?:[.,]\d{1,2})?$/) }))
      .mutation(async ({ input }) => {
        const db = requireDatabase(await getDb());
        await db.insert(profissionaisServicos).values({ profissionalId: input.profissionalId, servicoId: input.servicoId, comissaoPercentual: toCurrency(input.comissaoPercentual) }).onDuplicateKeyUpdate({ set: { comissaoPercentual: toCurrency(input.comissaoPercentual), ativo: true } });
        return { success: true };
      }),
  }),

  recursos: router({
    insumos: router({
      list: staffProcedure.query(async () => {
        const items = await requireDatabase(await getDb()).select().from(insumos).where(eq(insumos.ativo, true)).orderBy(insumos.nome);
        return items.map((item) => ({ ...item, abaixoDoMinimo: Number(item.estoqueAtual) <= Number(item.estoqueMinimo) }));
      }),
      create: adminOnlyProcedure.input(z.object({ nome: z.string().trim().min(2), unidade: z.string().trim().min(1).max(20), estoqueAtual: money, estoqueMinimo: money, custoUnitario: money }))
        .mutation(async ({ input, ctx }) => {
          const db = requireDatabase(await getDb());
          const [created] = await db.insert(insumos).values({ ...input, estoqueAtual: toCurrency(input.estoqueAtual), estoqueMinimo: toCurrency(input.estoqueMinimo), custoUnitario: toCurrency(input.custoUnitario) });
          await audit(ctx.user.id, "insumo", "CRIADO", created.insertId, undefined, input);
          return { success: true, id: created.insertId };
        }),
      update: adminOnlyProcedure.input(z.object({ id: z.number().int().positive(), nome: z.string().trim().min(2), unidade: z.string().trim().min(1).max(20), estoqueAtual: money, estoqueMinimo: money, custoUnitario: money, ativo: z.boolean().optional() }))
        .mutation(async ({ input, ctx }) => {
          const db = requireDatabase(await getDb());
          await db.update(insumos).set({ nome: input.nome, unidade: input.unidade, estoqueAtual: toCurrency(input.estoqueAtual), estoqueMinimo: toCurrency(input.estoqueMinimo), custoUnitario: toCurrency(input.custoUnitario), ...(input.ativo === undefined ? {} : { ativo: input.ativo }) }).where(eq(insumos.id, input.id));
          await audit(ctx.user.id, "insumo", "ATUALIZADO", input.id, undefined, input);
          return { success: true };
        }),
    }),
    equipamentos: router({
      list: staffProcedure.query(async () => requireDatabase(await getDb()).select().from(equipamentos).where(eq(equipamentos.ativo, true)).orderBy(equipamentos.nome)),
      create: adminOnlyProcedure.input(z.object({ nome: z.string().trim().min(3), descricao: z.string().max(3000).optional(), tipo: z.string().max(64).optional(), localizacao: z.string().max(128).optional() }))
        .mutation(async ({ input }) => { const db = requireDatabase(await getDb()); const [result] = await db.insert(equipamentos).values({ ...input, descricao: input.descricao || null, tipo: input.tipo || null, localizacao: input.localizacao || null }); return { success: true, id: result.insertId }; }),
      update: adminOnlyProcedure.input(z.object({ id: z.number().int().positive(), nome: z.string().trim().min(3), descricao: z.string().max(3000).optional(), tipo: z.string().max(64).optional(), localizacao: z.string().max(128).optional(), ativo: z.boolean().optional(), proximaManutencaoEm: z.coerce.date().optional() }))
        .mutation(async ({ input, ctx }) => {
          const db = requireDatabase(await getDb());
          await db.update(equipamentos).set({ nome: input.nome, descricao: input.descricao || null, tipo: input.tipo || null, localizacao: input.localizacao || null, ...(input.ativo === undefined ? {} : { ativo: input.ativo }), ...(input.proximaManutencaoEm ? { proximaManutencaoEm: input.proximaManutencaoEm } : {}) }).where(eq(equipamentos.id, input.id));
          await audit(ctx.user.id, "equipamento", "ATUALIZADO", input.id, undefined, input);
          return { success: true };
        }),
    }),
    salas: router({
      list: staffProcedure.query(async () => requireDatabase(await getDb()).select().from(salas).where(eq(salas.ativa, true)).orderBy(salas.nome)),
      create: adminOnlyProcedure.input(z.object({ nome: z.string().trim().min(2), descricao: z.string().max(3000).optional() }))
        .mutation(async ({ input }) => { const db = requireDatabase(await getDb()); const [result] = await db.insert(salas).values({ nome: input.nome, descricao: input.descricao || null }); return { success: true, id: result.insertId }; }),
    }),
  }),

  sessoes: router({
    list: staffProcedure.input(z.object({ inicio: z.coerce.date().optional(), fim: z.coerce.date().optional(), profissionalId: z.number().int().positive().optional(), salaId: z.number().int().positive().optional() }).optional())
      .query(async ({ input, ctx }) => {
        const db = requireDatabase(await getDb());
        const clauses = [];
        if (input?.inicio) clauses.push(gte(sessoes.dataHoraInicio, input.inicio));
        if (input?.fim) clauses.push(lte(sessoes.dataHoraInicio, input.fim));
        if (input?.profissionalId) clauses.push(eq(sessoes.profissionalId, input.profissionalId));
        if (input?.salaId) clauses.push(eq(sessoes.salaId, input.salaId));
        if (ctx.user.role === "profissional") clauses.push(eq(sessoes.profissionalId, ctx.user.id));
        const list = await db.select().from(sessoes).where(clauses.length ? and(...clauses) : undefined).orderBy(sessoes.dataHoraInicio);
        const clientList = await db.select().from(clientes);
        const serviceList = await db.select().from(servicos);
        const professionalList = await db.select().from(users);
        const roomList = await db.select().from(salas);
        return list.map((session) => ({ ...session, clienteNome: clientList.find((client) => client.id === session.clienteId)?.nome ?? "Cliente", servicoNome: serviceList.find((service) => service.id === session.servicoId)?.nome ?? "Serviço", profissionalNome: professionalList.find((professional) => professional.id === session.profissionalId)?.name ?? "Profissional", salaNome: roomList.find((room) => room.id === session.salaId)?.nome ?? null }));
      }),
    create: protectedProcedure.input(z.object({ clienteId: z.number().int().positive().optional(), servicoId: z.number().int().positive(), profissionalId: z.number().int().positive(), salaId: z.number().int().positive().optional(), equipamentoId: z.number().int().positive().optional(), dataHoraInicio: z.coerce.date(), dataHoraFim: z.coerce.date().optional(), duracaoMin: z.number().int().min(10).max(600).optional(), observacoesInternas: z.string().max(3000).optional() }))
      .mutation(async ({ input, ctx }) => {
        // Se for cliente, só pode agendar para si mesmo
        let clienteId = input.clienteId;
        if (ctx.user.role === "cliente") {
          if (input.clienteId && input.clienteId !== (await currentClientId(ctx.user.id))) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Clientes só podem agendar para si mesmos." });
          }
          clienteId = await currentClientId(ctx.user.id);
          if (!clienteId) throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado." });
        }

        // Profissionais só podem agendar em sua própria agenda
        if (ctx.user.role === "profissional" && input.profissionalId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Profissionais só podem agendar em sua própria agenda." });
        }

        const db = requireDatabase(await getDb());
        const duracaoMin = input.duracaoMin || 60;
        const dataHoraFim = input.dataHoraFim || new Date(input.dataHoraInicio.getTime() + duracaoMin * 60_000);
        const active = await db.select().from(sessoes).where(inArray(sessoes.status, ["PENDENTE", "AGUARDANDO_CONFIRMACAO", "CONFIRMADA", "EM_ATENDIMENTO"]));
        const conflicts = hasScheduleConflict(active, { profissionalId: input.profissionalId, salaId: input.salaId, dataHoraInicio: input.dataHoraInicio, dataHoraFim });
        if (conflicts) throw new TRPCError({ code: "CONFLICT", message: "Há conflito de horário para o profissional ou sala selecionados." });
        const service = (await db.select().from(servicos).where(eq(servicos.id, input.servicoId)).limit(1))[0];
        if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "Serviço não encontrado." });
        const [created] = await db.insert(sessoes).values({ clienteId: clienteId!, servicoId: input.servicoId, profissionalId: input.profissionalId, salaId: input.salaId ?? null, equipamentoId: input.equipamentoId ?? null, dataHoraInicio: input.dataHoraInicio, dataHoraFim, duracaoMin, observacoesInternas: input.observacoesInternas || null, status: "AGUARDANDO_CONFIRMACAO" });
        await db.insert(contasReceber).values({ clienteId: clienteId!, sessaoId: created.insertId, descricao: `Serviço: ${service.nome}`, valorOriginal: service.valor, valorFinal: service.valor, dataVencimento: todayIso() });
        const reminderAt = new Date(input.dataHoraInicio.getTime() - 24 * 60 * 60_000);
        if (reminderAt > new Date()) await db.insert(lembretes).values([
          { sessaoId: created.insertId, destinatario: "CLIENTE", agendadoPara: reminderAt, conteudo: `Lembrete de atendimento em ${input.dataHoraInicio.toLocaleString("pt-BR")}.` },
          { sessaoId: created.insertId, destinatario: "PROFISSIONAL", agendadoPara: reminderAt, conteudo: `Lembrete de atendimento agendado para ${input.dataHoraInicio.toLocaleString("pt-BR")}.` },
        ]);
        await audit(ctx.user.id, "sessao", "CRIADA", created.insertId, clienteId, input);
        return { success: true, id: created.insertId };
      }),
    updateStatus: staffProcedure.input(z.object({ id: z.number().int().positive(), status: sessionStatus, motivoCancelamento: z.string().max(2000).optional() }))
      .mutation(async ({ input, ctx }) => {
        const db = requireDatabase(await getDb());
        const session = (await db.select().from(sessoes).where(eq(sessoes.id, input.id)).limit(1))[0];
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Sessão não encontrada." });
        if (ctx.user.role === "profissional" && session.profissionalId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "A sessão não pertence à sua agenda." });
        await db.update(sessoes).set({ status: input.status, ...(input.motivoCancelamento === undefined ? {} : { motivoCancelamento: input.motivoCancelamento || null }) }).where(eq(sessoes.id, input.id));
        if (input.status === "CONCLUIDA") {
          const link = (await db.select().from(profissionaisServicos).where(and(eq(profissionaisServicos.profissionalId, session.profissionalId), eq(profissionaisServicos.servicoId, session.servicoId))).limit(1))[0];
          const service = (await db.select().from(servicos).where(eq(servicos.id, session.servicoId)).limit(1))[0];
          if (link && service) {
            const value = (Number(service.valor) * Number(link.comissaoPercentual) / 100).toFixed(2);
            await db.insert(comissoes).values({ sessaoId: session.id, profissionalId: session.profissionalId, percentual: link.comissaoPercentual, valor: value }).onDuplicateKeyUpdate({ set: { percentual: link.comissaoPercentual, valor: value, status: "PENDENTE" } });
          }
        }
        await audit(ctx.user.id, "sessao", `STATUS_${input.status}`, input.id, session.clienteId);
        return { success: true };
      }),
  }),

  questionarios: router({
    list: staffProcedure.query(async () => requireDatabase(await getDb()).select().from(questionarios).orderBy(desc(questionarios.createdAt))),
    create: adminOnlyProcedure.input(z.object({
      codigo: z.string().trim().min(2).max(64), nome: z.string().trim().min(3), descricao: z.string().max(3000).optional(),
      servicoId: z.number().int().positive().optional(), tipoSessao: z.string().max(64).default("PRIMEIRA_SESSAO"),
      perguntas: z.array(z.object({ texto: z.string().trim().min(3).max(3000), tipoResposta: z.enum(["BOOLEAN", "TEXTO", "DATA", "NUMERO", "SELECAO_UNICA", "SELECAO_MULTIPLA", "TERMO_ACEITE"]), obrigatoria: z.boolean().default(true), opcoesJson: z.string().max(4000).optional() })).min(1),
    }))
      .mutation(async ({ input, ctx }) => {
        const db = requireDatabase(await getDb());
        const versions = await db.select({ versao: questionarios.versao }).from(questionarios).where(eq(questionarios.codigo, input.codigo));
        const version = Math.max(0, ...versions.map((item) => item.versao)) + 1;
        if (versions.length) await db.update(questionarios).set({ ativo: false }).where(eq(questionarios.codigo, input.codigo));
        const [created] = await db.insert(questionarios).values({ codigo: input.codigo, nome: input.nome, descricao: input.descricao || null, servicoId: input.servicoId ?? null, tipoSessao: input.tipoSessao, versao: version, criadoPor: ctx.user.id, publicadoEm: new Date(), perguntasJson: JSON.stringify(input.perguntas) });
        const createdQuestions = await Promise.all(input.perguntas.map(async (pergunta) => {
          const [question] = await db.insert(perguntas).values({ texto: pergunta.texto, tipoResposta: pergunta.tipoResposta, opcoesJson: pergunta.opcoesJson || null });
          return { id: question.insertId, obrigatoria: pergunta.obrigatoria };
        }));
        await db.insert(questionarioPerguntas).values(createdQuestions.map((question, index) => ({ questionarioId: created.insertId, perguntaId: question.id, ordem: index + 1, obrigatoria: question.obrigatoria })));
        return { success: true, id: created.insertId, versao: version };
      }),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input, ctx }) => {
      const db = requireDatabase(await getDb());
      const questionnaire = (await db.select().from(questionarios).where(eq(questionarios.id, input.id)).limit(1))[0];
      if (!questionnaire || (!questionnaire.ativo && ctx.user.role !== "admin")) throw new TRPCError({ code: "NOT_FOUND", message: "Questionário não encontrado." });
      const links = await db.select().from(questionarioPerguntas).where(eq(questionarioPerguntas.questionarioId, input.id)).orderBy(questionarioPerguntas.ordem);
      const questionIds = links.map((link) => link.perguntaId);
      const items = questionIds.length ? await db.select().from(perguntas).where(inArray(perguntas.id, questionIds)) : [];
      return { ...questionnaire, perguntas: links.map((link) => ({ ...items.find((item) => item.id === link.perguntaId), obrigatoria: link.obrigatoria, ordem: link.ordem })).filter(Boolean) };
    }),
    responder: protectedProcedure.input(z.object({ clienteId: z.number().int().positive(), sessaoId: z.number().int().positive().optional(), questionarioId: z.number().int().positive(), declaracaoVeracidade: z.literal(true), assinaturaDigital: z.string().trim().min(4).max(500000), respostas: z.array(z.object({ perguntaId: z.number().int().positive(), respostaTexto: z.string().max(8000).optional(), respostaBoolean: z.boolean().optional(), respostaNumero: z.string().regex(/^\d+(?:[.,]\d+)?$/).optional(), respostaData: z.string().max(16).optional(), respostaJson: z.string().max(8000).optional() })).min(1) }))
      .mutation(async ({ input, ctx }) => {
        if (!(await canAccessClient(ctx.user, input.clienteId))) throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a este cliente." });
        if ((ctx.user.role === "cliente" || ctx.user.role === "user") && ctx.user.name) {
          const normalizar = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
          if (normalizar(input.assinaturaDigital) !== normalizar(ctx.user.name)) throw new TRPCError({ code: "BAD_REQUEST", message: "A assinatura deve corresponder ao nome da sua conta." });
        }
        const db = requireDatabase(await getDb());
        const questionnaire = (await db.select().from(questionarios).where(eq(questionarios.id, input.questionarioId)).limit(1))[0];
        if (!questionnaire) throw new TRPCError({ code: "NOT_FOUND", message: "Questionário não encontrado." });
        const [response] = await db.insert(respostasQuestionario).values({ clienteId: input.clienteId, sessaoId: input.sessaoId ?? null, questionarioId: input.questionarioId, versaoQuestionario: questionnaire.versao, declaracaoVeracidade: true, assinaturaDigital: input.assinaturaDigital, respondidoPor: ctx.user.id, respostasJson: JSON.stringify(input.respostas) });
        await db.insert(respostas).values(input.respostas.map((answer) => ({ respostaQuestionarioId: response.insertId, perguntaId: answer.perguntaId, respostaTexto: answer.respostaTexto ?? null, respostaBoolean: answer.respostaBoolean ?? null, respostaNumero: answer.respostaNumero ? toCurrency(answer.respostaNumero) : null, respostaData: answer.respostaData ?? null, respostaJson: answer.respostaJson ?? null })));
        await audit(ctx.user.id, "questionario", "RESPONDIDO", response.insertId, input.clienteId);
        return { success: true, id: response.insertId };
      }),
  }),

  lembretes: router({
    list: managementProcedure.input(z.object({ status: z.enum(["PENDENTE", "ENVIADO", "FALHA", "CANCELADO"]).optional() }).optional())
      .query(async ({ input }) => {
        const db = requireDatabase(await getDb());
        return db.select().from(lembretes).where(input?.status ? eq(lembretes.status, input.status) : undefined).orderBy(lembretes.agendadoPara);
      }),
    marcarEnviado: adminOnlyProcedure.input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const db = requireDatabase(await getDb());
        await db.update(lembretes).set({ ...reminderDeliveryUpdate(new Date()), tentativas: sql`${lembretes.tentativas} + 1` }).where(eq(lembretes.id, input.id));
        await audit(ctx.user.id, "lembrete", "MARCADO_ENVIADO", input.id);
        return { success: true };
      }),
  }),

  financeiro: router({
    contas: managementProcedure.query(async () => {
      const db = requireDatabase(await getDb());
      const accounts = await db.select().from(contasReceber).orderBy(desc(contasReceber.createdAt));
      const customerList = await db.select().from(clientes);
      return accounts.map((account) => ({ ...account, clienteNome: customerList.find((client) => client.id === account.clienteId)?.nome ?? "Cliente" }));
    }),
    receber: managementProcedure.input(z.object({ contaReceberId: z.number().int().positive(), clienteId: z.number().int().positive(), valor: money, tipoPagamento: paymentType, observacoes: z.string().max(2000).optional() }))
      .mutation(async ({ input, ctx }) => {
        const db = requireDatabase(await getDb());
        await db.insert(recebimentos).values({ ...input, valor: toCurrency(input.valor), observacoes: input.observacoes || null, registradoPor: ctx.user.id });
        await db.update(contasReceber).set({ status: "PAGA" }).where(eq(contasReceber.id, input.contaReceberId));
        await audit(ctx.user.id, "recebimento", "REGISTRADO", input.contaReceberId, input.clienteId, input);
        return { success: true };
      }),
    despesas: managementProcedure.query(async () => requireDatabase(await getDb()).select().from(despesas).orderBy(desc(despesas.dataCompetencia))),
    criarDespesa: adminOnlyProcedure.input(z.object({ descricao: z.string().trim().min(3), categoria: z.string().trim().min(2).max(100), valor: money, dataCompetencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .mutation(async ({ input, ctx }) => { const db = requireDatabase(await getDb()); const [created] = await db.insert(despesas).values({ ...input, valor: toCurrency(input.valor), registradoPor: ctx.user.id }); return { success: true, id: created.insertId }; }),
    marcarDespesaPaga: adminOnlyProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => { const db = requireDatabase(await getDb()); await db.update(despesas).set({ status: "PAGA", pagoEm: new Date() }).where(eq(despesas.id, input.id)); return { success: true }; }),
    caixa: managementProcedure.input(z.object({ data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() }).optional()).query(async ({ input }) => {
      const db = requireDatabase(await getDb()); const data = input?.data ?? todayIso();
      const incoming = await db.select({ valor: recebimentos.valor, createdAt: recebimentos.createdAt }).from(recebimentos);
      const outgoings = await db.select({ valor: despesas.valor, pagoEm: despesas.pagoEm, status: despesas.status }).from(despesas);
      const entradas = incoming.filter((item) => item.createdAt.toISOString().slice(0, 10) === data).reduce((sum, item) => sum + Number(item.valor), 0);
      const saidas = outgoings.filter((item) => item.status === "PAGA" && item.pagoEm?.toISOString().slice(0, 10) === data).reduce((sum, item) => sum + Number(item.valor), 0);
      const cash = (await db.select().from(caixasDiarios).where(eq(caixasDiarios.dataCaixa, data)).limit(1))[0] ?? null;
      return { data, entradas, saidas, saldoCalculado: Number(cash?.saldoAbertura ?? 0) + entradas - saidas, caixa: cash };
    }),
    abrirCaixa: managementProcedure.input(z.object({ data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), saldoAbertura: money, observacoes: z.string().max(2000).optional() })).mutation(async ({ input, ctx }) => { const db = requireDatabase(await getDb()); const data = input.data ?? todayIso(); await db.insert(caixasDiarios).values({ dataCaixa: data, saldoAbertura: toCurrency(input.saldoAbertura), observacoes: input.observacoes || null, abertoPor: ctx.user.id }).onDuplicateKeyUpdate({ set: { saldoAbertura: toCurrency(input.saldoAbertura), observacoes: input.observacoes || null } }); return { success: true }; }),
    comissoes: adminOnlyProcedure.query(async () => {
      const db = requireDatabase(await getDb()); const rows = await db.select().from(comissoes).orderBy(desc(comissoes.geradaEm)); const professionalList = await db.select().from(users);
      return rows.map((commission) => ({ ...commission, profissionalNome: professionalList.find((professional) => professional.id === commission.profissionalId)?.name ?? "Profissional" }));
    }),
    dashboardStats: staffProcedure.query(async ({ ctx }) => {
      const db = requireDatabase(await getDb()); const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const end = new Date(start.getTime() + 86400000);
      const [todaySessions, allCustomers, payments, birthdates] = await Promise.all([
        db.select().from(sessoes).where(and(gte(sessoes.dataHoraInicio, start), lte(sessoes.dataHoraInicio, end), ...(ctx.user.role === "profissional" ? [eq(sessoes.profissionalId, ctx.user.id)] : []))),
        db.select({ id: clientes.id }).from(clientes).where(eq(clientes.status, "ATIVO")), db.select().from(recebimentos), db.select({ id: clientes.id, nome: clientes.nome, dataNascimento: clientes.dataNascimento }).from(clientes),
      ]);
      const monthRevenue = payments.filter((payment) => payment.createdAt.getMonth() === now.getMonth() && payment.createdAt.getFullYear() === now.getFullYear()).reduce((sum, payment) => sum + Number(payment.valor), 0);
      const attended = todaySessions.filter((session) => session.status === "CONCLUIDA").length;
      const confirmed = todaySessions.filter((session) => ["CONFIRMADA", "EM_ATENDIMENTO", "CONCLUIDA"].includes(session.status)).length;
      const birthdayKey = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const aniversariantes = birthdates.filter((client) => client.dataNascimento?.slice(5) === birthdayKey).map((client) => client.nome);
      return { faturamentoMes: monthRevenue, agendamentosHoje: todaySessions.length, sessoesRealizadas: attended, clientesTotal: allCustomers.length, taxaOcupacao: todaySessions.length ? Math.round((confirmed / todaySessions.length) * 100) : 0, aniversariantes, proximasSessoes: todaySessions.filter((session) => session.status !== "CANCELADA" && session.status !== "NAO_COMPARECEU").slice(0, 8) };
    }),
  }),

  portal: router({
    opcoesAgendamento: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "cliente" && ctx.user.role !== "user") throw new TRPCError({ code: "FORBIDDEN", message: "Este acesso é exclusivo do portal do cliente." });
      const db = requireDatabase(await getDb());
      const [serviceList, professionalList] = await Promise.all([
        db.select({ id: servicos.id, nome: servicos.nome, duracaoMin: servicos.duracaoMin, valor: servicos.valor }).from(servicos).where(eq(servicos.ativo, true)).orderBy(servicos.nome),
        db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, "profissional")).orderBy(users.name),
      ]);
      return { servicos: serviceList, profissionais: professionalList };
    }),
    resumo: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "cliente" && ctx.user.role !== "user") throw new TRPCError({ code: "FORBIDDEN", message: "Este acesso é exclusivo do portal do cliente." });
      const clientId = await currentClientId(ctx.user.id);
      if (!clientId) return { vinculado: false, agendamentos: [], questionariosPendentes: [] };
      const db = requireDatabase(await getDb());
      const appointments = await db.select().from(sessoes).where(eq(sessoes.clienteId, clientId)).orderBy(sessoes.dataHoraInicio);
      const [published, answered] = await Promise.all([
        db.select().from(questionarios).where(eq(questionarios.ativo, true)),
        db.select({ questionarioId: respostasQuestionario.questionarioId, versaoQuestionario: respostasQuestionario.versaoQuestionario }).from(respostasQuestionario).where(eq(respostasQuestionario.clienteId, clientId)),
      ]);
      const pending = filterPendingQuestionnaires(published, answered);
      return { vinculado: true, clientId, agendamentos: appointments, questionariosPendentes: pending };
    }),
    solicitarAgendamento: protectedProcedure.input(z.object({ servicoId: z.number().int().positive(), profissionalId: z.number().int().positive(), dataHoraInicio: z.coerce.date(), duracaoMin: z.number().int().min(10).max(600) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "cliente" && ctx.user.role !== "user") throw new TRPCError({ code: "FORBIDDEN", message: "Este acesso é exclusivo do portal do cliente." });
        const clientId = await currentClientId(ctx.user.id); if (!clientId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seu acesso ainda não está vinculado a um cadastro de cliente." });
        const db = requireDatabase(await getDb()); const end = new Date(input.dataHoraInicio.getTime() + input.duracaoMin * 60_000);
        const [created] = await db.insert(sessoes).values({ ...input, clienteId: clientId, dataHoraFim: end, status: "PENDENTE" });
        return { success: true, id: created.insertId };
      }),
  }),
});

export type AppRouter = typeof appRouter;
