# Sistema de Gestão para Clínica Estética — Aura

## Concluído

- [x] Configurar esquema de banco de dados no Drizzle (clientes, usuários, serviços, equipamentos, sessões, questionários, contas a receber, recebimentos, auditoria, lembretes)
- [x] Implementar rotas de backend (tRPC) para autenticação e perfis de acesso (admin, recepcao, profissional, cliente, user)
- [x] Implementar rotas de backend para gestão de clientes, histórico e fotos clínicas (S3)
- [x] Implementar rotas de backend para agendamentos avançados com status e controle de conflitos
- [x] Implementar rotas de backend para questionários de anamnese versionados e assinaturas digitais
- [x] Implementar rotas de backend para procedimentos, serviços e equipamentos
- [x] Implementar rotas de backend para módulo financeiro (receitas, despesas, caixa, comissões)
- [x] Implementar rotas de backend para prontuário eletrônico e evolução de sessões
- [x] Desenvolver interface visual com sidebar lateral, paleta rosé/dourado clean e moderna (DM Serif Display + Inter)
- [x] Criar Dashboard com indicadores (faturamento, ocupação, agendamentos do dia, aniversariantes)
- [x] Criar portal do cliente para agendamento próprio e visualização de histórico
- [x] Criar painel da recepção para confirmação de presença e recebimentos
- [x] Criar painel do profissional para histórico de sessões e anamnese
- [x] Criar painel do gestor para configurações, relatórios e permissões
- [x] Escrever testes unitários em Vitest para validação das principais rotas (29/29 passando)
- [x] Reconciliar as migrações com o banco existente e restaurar a compatibilidade do usuário técnico do sistema
- [x] Aplicar autorização por perfil em cada procedimento do sistema
- [x] Implementar prontuário estruturado com fotos protegidas e evolução por sessão
- [x] Completar o financeiro com despesas, caixa diário e visão de comissões
- [x] Criar uma experiência dedicada para o portal do cliente autenticado
- [x] Estruturar a fila de lembretes para posterior integração com um canal oficial de comunicação
- [x] Layout responsivo validado (desktop 1280px e mobile 375px)

## Próximas melhorias sugeridas

- [x] Implementar e testar a validação de conflitos de agendamento por profissional, sala e intervalo de horário
- [x] Adicionar tela administrativa para criar e editar equipamentos consumindo as rotas de recursos
- [x] Implementar lógica real de questionários pendentes no portal e reforçar a assinatura nominal de aceite
- [x] Criar área do gestor para gestão de perfis e relatórios administrativos verificáveis
- [x] Adicionar testes para consulta e transição de status da fila de lembretes
- [x] Integrar o envio de lembretes por e-mail via Brevo com fila idempotente, controle de falha e callback protegido
- [ ] Publicar o site e ativar o agendamento recorrente para processar a fila de lembretes Brevo
- [x] Corrigir a consulta do portal do cliente que é executada indevidamente para perfis internos
- [x] Reorganizar o calendário semanal por profissional, sala ou procedimento e validar a lógica de agrupamento
- [x] Implementar relatório de comissões exportável em PDF
- [x] Criar módulo de controle de estoque de insumos com alertas de mínimo
