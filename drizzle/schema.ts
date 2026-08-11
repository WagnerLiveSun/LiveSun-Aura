import {
  boolean,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/** Identidade autenticada pela plataforma e perfis internos da clínica. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  telefone: varchar("telefone", { length: 32 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerifiedAt: timestamp("emailVerifiedAt"),
  failedLoginAttempts: int("failedLoginAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
  passwordChangedAt: timestamp("passwordChangedAt"),
  // `user` permanece por compatibilidade com contas pré-existentes da plataforma.
  role: mysqlEnum("role", ["user", "admin", "recepcao", "profissional", "cliente"]).default("user").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const clientes = mysqlTable("clientes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").unique(),
  nome: text("nome").notNull(),
  email: varchar("email", { length: 320 }),
  telefone: varchar("telefone", { length: 32 }),
  cpfHash: varchar("cpfHash", { length: 128 }),
  cpfEncrypted: text("cpfEncrypted"),
  dataNascimento: varchar("dataNascimento", { length: 16 }),
  status: mysqlEnum("status", ["ATIVO", "INATIVO", "BLOQUEADO"]).default("ATIVO").notNull(),
  observacoesInternas: text("observacoesInternas"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  statusIdx: index("clientes_status_idx").on(table.status),
}));

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;

export const prontuarios = mysqlTable("prontuarios", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("clienteId").notNull().unique(),
  alergias: text("alergias"),
  restricoes: text("restricoes"),
  observacoesClinicas: text("observacoesClinicas"),
  atualizadoPor: int("atualizadoPor"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const servicos = mysqlTable("servicos", {
  id: int("id").autoincrement().primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  duracaoMin: int("duracaoMin").default(60).notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  tipoServico: varchar("tipoServico", { length: 64 }).default("procedimento").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  exigeQuestionario: boolean("exigeQuestionario").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Servico = typeof servicos.$inferSelect;
export type InsertServico = typeof servicos.$inferInsert;

export const profissionaisServicos = mysqlTable("profissionais_servicos", {
  id: int("id").autoincrement().primaryKey(),
  profissionalId: int("profissionalId").notNull(),
  servicoId: int("servicoId").notNull(),
  comissaoPercentual: decimal("comissaoPercentual", { precision: 5, scale: 2 }).default("0.00").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
}, (table) => ({
  profissionalServicoUq: uniqueIndex("profissionais_servicos_uq").on(table.profissionalId, table.servicoId),
}));

export const insumos = mysqlTable("insumos", {
  id: int("id").autoincrement().primaryKey(),
  nome: text("nome").notNull(),
  unidade: varchar("unidade", { length: 20 }).default("un").notNull(),
  estoqueAtual: decimal("estoqueAtual", { precision: 10, scale: 2 }).default("0.00").notNull(),
  estoqueMinimo: decimal("estoqueMinimo", { precision: 10, scale: 2 }).default("0.00").notNull(),
  custoUnitario: decimal("custoUnitario", { precision: 10, scale: 2 }).default("0.00").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const servicosInsumos = mysqlTable("servicos_insumos", {
  id: int("id").autoincrement().primaryKey(),
  servicoId: int("servicoId").notNull(),
  insumoId: int("insumoId").notNull(),
  quantidade: decimal("quantidade", { precision: 10, scale: 2 }).default("1.00").notNull(),
}, (table) => ({
  servicoInsumoUq: uniqueIndex("servicos_insumos_uq").on(table.servicoId, table.insumoId),
}));

export const salas = mysqlTable("salas", {
  id: int("id").autoincrement().primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  ativa: boolean("ativa").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const equipamentos = mysqlTable("equipamentos", {
  id: int("id").autoincrement().primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  tipo: varchar("tipo", { length: 64 }),
  localizacao: varchar("localizacao", { length: 128 }),
  ativo: boolean("ativo").default(true).notNull(),
  ultimaManutencaoEm: timestamp("ultimaManutencaoEm"),
  proximaManutencaoEm: timestamp("proximaManutencaoEm"),
  observacoesInternas: text("observacoesInternas"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Equipamento = typeof equipamentos.$inferSelect;
export type InsertEquipamento = typeof equipamentos.$inferInsert;

export const sessoes = mysqlTable("sessoes", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("clienteId").notNull(),
  servicoId: int("servicoId").notNull(),
  profissionalId: int("profissionalId").notNull(),
  salaId: int("salaId"),
  equipamentoId: int("equipamentoId"),
  dataHoraInicio: timestamp("dataHoraInicio").notNull(),
  dataHoraFim: timestamp("dataHoraFim").notNull(),
  duracaoMin: int("duracaoMin").notNull(),
  status: mysqlEnum("status", [
    "PENDENTE",
    "AGUARDANDO_CONFIRMACAO",
    "CONFIRMADA",
    "EM_ATENDIMENTO",
    "CONCLUIDA",
    "CANCELADA",
    "NAO_COMPARECEU",
    "BLOQUEADA",
  ]).default("AGUARDANDO_CONFIRMACAO").notNull(),
  observacoesInternas: text("observacoesInternas"),
  observacoesAtendimento: text("observacoesAtendimento"),
  fotosAntesUrl: text("fotosAntesUrl"),
  fotosDepoisUrl: text("fotosDepoisUrl"),
  motivoCancelamento: text("motivoCancelamento"),
  googleEventId: varchar("googleEventId", { length: 128 }),
  lembreteEnviadoEm: timestamp("lembreteEnviadoEm"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  profissionalAgendaIdx: index("sessoes_profissional_inicio_idx").on(table.profissionalId, table.dataHoraInicio),
  salaAgendaIdx: index("sessoes_sala_inicio_idx").on(table.salaId, table.dataHoraInicio),
  clienteAgendaIdx: index("sessoes_cliente_inicio_idx").on(table.clienteId, table.dataHoraInicio),
}));

export type Sessao = typeof sessoes.$inferSelect;
export type InsertSessao = typeof sessoes.$inferInsert;

export const evolucoes = mysqlTable("evolucoes", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("clienteId").notNull(),
  sessaoId: int("sessaoId").notNull().unique(),
  profissionalId: int("profissionalId").notNull(),
  observacoes: text("observacoes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const fotosProntuario = mysqlTable("fotos_prontuario", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("clienteId").notNull(),
  sessaoId: int("sessaoId"),
  categoria: mysqlEnum("categoria", ["ANTES", "DEPOIS", "EVOLUCAO"]).notNull(),
  storageKey: text("storageKey").notNull(),
  legenda: varchar("legenda", { length: 250 }),
  enviadoPor: int("enviadoPor").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  clienteFotoIdx: index("fotos_prontuario_cliente_idx").on(table.clienteId, table.createdAt),
}));

export const questionarios = mysqlTable("questionarios", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 64 }),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  servicoId: int("servicoId"),
  tipoSessao: varchar("tipoSessao", { length: 64 }).default("PRIMEIRA_SESSAO").notNull(),
  versao: int("versao").default(1).notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  criadoPor: int("criadoPor"),
  publicadoEm: timestamp("publicadoEm"),
  perguntasJson: text("perguntasJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  codigoVersaoUq: uniqueIndex("questionarios_codigo_versao_uq").on(table.codigo, table.versao),
  servicoQuestionarioIdx: index("questionarios_servico_idx").on(table.servicoId),
}));

export const perguntas = mysqlTable("perguntas", {
  id: int("id").autoincrement().primaryKey(),
  texto: text("texto").notNull(),
  tipoResposta: mysqlEnum("tipoResposta", ["BOOLEAN", "TEXTO", "DATA", "NUMERO", "SELECAO_UNICA", "SELECAO_MULTIPLA", "TERMO_ACEITE"]).notNull(),
  opcoesJson: text("opcoesJson"),
  orientacaoInterna: text("orientacaoInterna"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const questionarioPerguntas = mysqlTable("questionario_perguntas", {
  id: int("id").autoincrement().primaryKey(),
  questionarioId: int("questionarioId").notNull(),
  perguntaId: int("perguntaId").notNull(),
  ordem: int("ordem").notNull(),
  obrigatoria: boolean("obrigatoria").default(true).notNull(),
}, (table) => ({
  questionarioPerguntaUq: uniqueIndex("questionario_perguntas_uq").on(table.questionarioId, table.perguntaId),
}));

export const respostasQuestionario = mysqlTable("respostas_questionario", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("clienteId").notNull(),
  sessaoId: int("sessaoId"),
  questionarioId: int("questionarioId").notNull(),
  versaoQuestionario: int("versaoQuestionario").notNull(),
  declaracaoVeracidade: boolean("declaracaoVeracidade").default(true).notNull(),
  assinaturaDigital: text("assinaturaDigital"),
  assinaturaDigitalUrl: text("assinaturaDigitalUrl"),
  respostasJson: text("respostasJson"),
  respondidoPor: int("respondidoPor"),
  respondidoEm: timestamp("respondidoEm").defaultNow().notNull(),
  retificacaoDeId: int("retificacaoDeId"),
});

export const respostas = mysqlTable("respostas", {
  id: int("id").autoincrement().primaryKey(),
  respostaQuestionarioId: int("respostaQuestionarioId").notNull(),
  perguntaId: int("perguntaId").notNull(),
  respostaTexto: text("respostaTexto"),
  respostaBoolean: boolean("respostaBoolean"),
  respostaNumero: decimal("respostaNumero", { precision: 12, scale: 2 }),
  respostaData: varchar("respostaData", { length: 16 }),
  respostaJson: text("respostaJson"),
});

export const contasReceber = mysqlTable("contas_receber", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("clienteId").notNull(),
  sessaoId: int("sessaoId"),
  descricao: text("descricao").notNull(),
  valorOriginal: decimal("valorOriginal", { precision: 10, scale: 2 }).notNull(),
  valorDesconto: decimal("valorDesconto", { precision: 10, scale: 2 }).default("0.00").notNull(),
  valorFinal: decimal("valorFinal", { precision: 10, scale: 2 }).notNull(),
  dataVencimento: varchar("dataVencimento", { length: 16 }).notNull(),
  status: mysqlEnum("status", ["ABERTA", "PARCIAL", "PAGA", "CANCELADA", "VENCIDA"]).default("ABERTA").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const recebimentos = mysqlTable("recebimentos", {
  id: int("id").autoincrement().primaryKey(),
  contaReceberId: int("contaReceberId").notNull(),
  clienteId: int("clienteId").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  tipoPagamento: mysqlEnum("tipoPagamento", ["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA", "OUTRO"]).default("PIX").notNull(),
  comprovante: text("comprovante"),
  comprovanteKey: text("comprovanteKey"),
  observacoes: text("observacoes"),
  registradoPor: int("registradoPor").notNull(),
  estornadoEm: timestamp("estornadoEm"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const despesas = mysqlTable("despesas", {
  id: int("id").autoincrement().primaryKey(),
  descricao: text("descricao").notNull(),
  categoria: varchar("categoria", { length: 100 }).notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  dataCompetencia: varchar("dataCompetencia", { length: 16 }).notNull(),
  status: mysqlEnum("status", ["ABERTA", "PAGA", "CANCELADA"]).default("ABERTA").notNull(),
  pagoEm: timestamp("pagoEm"),
  registradoPor: int("registradoPor").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const caixasDiarios = mysqlTable("caixas_diarios", {
  id: int("id").autoincrement().primaryKey(),
  dataCaixa: varchar("dataCaixa", { length: 16 }).notNull().unique(),
  saldoAbertura: decimal("saldoAbertura", { precision: 10, scale: 2 }).default("0.00").notNull(),
  saldoFechamentoInformado: decimal("saldoFechamentoInformado", { precision: 10, scale: 2 }),
  abertoPor: int("abertoPor").notNull(),
  fechadoPor: int("fechadoPor"),
  abertoEm: timestamp("abertoEm").defaultNow().notNull(),
  fechadoEm: timestamp("fechadoEm"),
  observacoes: text("observacoes"),
});

export const comissoes = mysqlTable("comissoes", {
  id: int("id").autoincrement().primaryKey(),
  sessaoId: int("sessaoId").notNull().unique(),
  profissionalId: int("profissionalId").notNull(),
  percentual: decimal("percentual", { precision: 5, scale: 2 }).notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["PENDENTE", "PAGA", "CANCELADA"]).default("PENDENTE").notNull(),
  geradaEm: timestamp("geradaEm").defaultNow().notNull(),
  pagaEm: timestamp("pagaEm"),
});

export const lembretes = mysqlTable("lembretes", {
  id: int("id").autoincrement().primaryKey(),
  sessaoId: int("sessaoId").notNull(),
  destinatario: mysqlEnum("destinatario", ["CLIENTE", "PROFISSIONAL"]).notNull(),
  canal: mysqlEnum("canal", ["INTERNO", "WHATSAPP", "EMAIL"]).default("INTERNO").notNull(),
  agendadoPara: timestamp("agendadoPara").notNull(),
  enviadoEm: timestamp("enviadoEm"),
  status: mysqlEnum("status", ["PENDENTE", "ENVIADO", "FALHA", "CANCELADO"]).default("PENDENTE").notNull(),
  conteudo: text("conteudo").notNull(),
  tentativas: int("tentativas").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  lembretePendenteIdx: index("lembretes_status_agendado_idx").on(table.status, table.agendadoPara),
}));

export const auditoria = mysqlTable("auditoria", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId"),
  clienteId: int("clienteId"),
  entidade: varchar("entidade", { length: 64 }).notNull(),
  entidadeId: int("entidadeId"),
  acao: varchar("acao", { length: 64 }).notNull(),
  detalhesJson: text("detalhesJson"),
  dadosAntesJson: text("dadosAntesJson"),
  dadosDepoisJson: text("dadosDepoisJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tokenHash: varchar("tokenHash", { length: 255 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex("password_reset_tokens_token_idx").on(table.tokenHash),
  userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
}));

export type Questionario = typeof questionarios.$inferSelect;
export type RespostaQuestionario = typeof respostasQuestionario.$inferSelect;
export type ContaReceber = typeof contasReceber.$inferSelect;
export type Recebimento = typeof recebimentos.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;
