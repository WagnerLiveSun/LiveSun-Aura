import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function ClientScheduling() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    servicoId: 0,
    profissionalId: 0,
    dataHoraInicio: "",
    observacoes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: user } = trpc.auth.me.useQuery();
  const { data: servicos } = trpc.servicos.list.useQuery();
  const { data: profissionais } = trpc.auth.listUsers.useQuery();
  const createSessionMutation = trpc.sessoes.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.servicoId) {
      setError("Selecione um serviço");
      return;
    }

    if (!formData.profissionalId) {
      setError("Selecione um profissional");
      return;
    }

    if (!formData.dataHoraInicio) {
      setError("Selecione uma data e hora");
      return;
    }

    if (!user) {
      setError("Usuário não autenticado");
      return;
    }

    setLoading(true);

    try {
      // Buscar o clienteId do usuário
      const clientesQuery = trpc.clientes.list.useQuery();
      const clientes = clientesQuery.data || [];
      const cliente = clientes.find((c: any) => c.userId === user.id);

      if (!cliente) {
        setError("Cliente não encontrado");
        return;
      }

      // Buscar detalhes do serviço para calcular duração
      const servico = servicos?.find((s: any) => s.id === formData.servicoId);
      if (!servico) {
        setError("Serviço não encontrado");
        return;
      }

      const dataInicio = new Date(formData.dataHoraInicio);
      const dataFim = new Date(dataInicio.getTime() + servico.duracaoMin * 60000);

      await createSessionMutation.mutateAsync({
        clienteId: cliente.id,
        servicoId: formData.servicoId,
        profissionalId: formData.profissionalId,
        dataHoraInicio: dataInicio.toISOString(),
        dataHoraFim: dataFim.toISOString(),
        duracaoMin: servico.duracaoMin,
        observacoesInternas: formData.observacoes || undefined,
      });

            navigate("/cliente-dashboard");
    } catch (err: any) {
      setError(err.message || "Erro ao realizar agendamento");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredProfissionais = profissionais?.filter((p: any) =>
    p.role === "profissional" || p.role === "admin"
  ) || [];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minHeight: "100vh",
      backgroundColor: "#ffffff",
      padding: "20px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "600px",
        backgroundColor: "#ffffff",
        padding: "40px",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
      }}>
        <h1 style={{
          fontSize: "32px",
          fontWeight: "bold",
          marginBottom: "10px",
          textAlign: "center",
          color: "#000000",
        }}>
          Aura LiveSun
        </h1>
        <p style={{
          fontSize: "18px",
          marginBottom: "30px",
          textAlign: "center",
          color: "#000000",
        }}>
          Sistema de Gestão de Clínica de Bronzeamento
        </p>
        <h2 style={{
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "20px",
          textAlign: "center",
          color: "#000000",
        }}>
          Agendamento de Sessão
        </h2>

        {error && (
          <div style={{
            backgroundColor: "#fee",
            color: "#c00",
            padding: "12px",
            borderRadius: "4px",
            marginBottom: "20px",
            fontSize: "16px",
            border: "1px solid #fcc",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{
              display: "block",
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "5px",
              color: "#000000",
            }}>
              Serviço
            </label>
            <select
              name="servicoId"
              value={formData.servicoId}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                border: "3px solid #000000",
                borderRadius: "4px",
                boxSizing: "border-box",
                backgroundColor: "#ffffff",
                color: "#000000",
              }}
            >
              <option value="">Selecione um serviço</option>
              {servicos?.map((servico: any) => (
                <option key={servico.id} value={servico.id}>
                  {servico.nome} - R$ {servico.valor} ({servico.duracaoMin} min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "5px",
              color: "#000000",
            }}>
              Profissional
            </label>
            <select
              name="profissionalId"
              value={formData.profissionalId}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                border: "3px solid #000000",
                borderRadius: "4px",
                boxSizing: "border-box",
                backgroundColor: "#ffffff",
                color: "#000000",
              }}
            >
              <option value="">Selecione um profissional</option>
              {filteredProfissionais.map((profissional: any) => (
                <option key={profissional.id} value={profissional.id}>
                  {profissional.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "5px",
              color: "#000000",
            }}>
              Data e Hora
            </label>
            <input
              type="datetime-local"
              name="dataHoraInicio"
              value={formData.dataHoraInicio}
              onChange={handleChange}
              required
              min={new Date().toISOString().slice(0, 16)}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                border: "3px solid #000000",
                borderRadius: "4px",
                boxSizing: "border-box",
                backgroundColor: "#ffffff",
                color: "#000000",
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "5px",
              color: "#000000",
            }}>
              Observações
            </label>
            <textarea
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                border: "3px solid #000000",
                borderRadius: "4px",
                boxSizing: "border-box",
                backgroundColor: "#ffffff",
                color: "#000000",
                fontFamily: "inherit",
              }}
              placeholder="Alguma observação para o profissional?"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "15px",
              fontSize: "18px",
              fontWeight: "bold",
              backgroundColor: "#000000",
              color: "#ffffff",
              border: "3px solid #000000",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "10px",
            }}
          >
            {loading ? "Agendando..." : "Agendar Sessão"}
          </button>
        </form>

        <div style={{
          marginTop: "20px",
          textAlign: "center",
          fontSize: "16px",
        }}>
          <button
            onClick={() => navigate("/cliente-dashboard")}
            style={{
              color: "#0000ff",
              textDecoration: "underline",
              fontWeight: "bold",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Voltar ao painel
          </button>
        </div>
      </div>
    </div>
  );
}
