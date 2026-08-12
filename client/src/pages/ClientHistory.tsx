import { trpc } from "@/lib/trpc";
import { useRouter } from "wouter";

export default function ClientHistory() {
  const router = useRouter();

  const { data: user } = trpc.auth.me.useQuery();
  const { data: clientes } = trpc.clientes.list.useQuery();
  const { data: sessoes } = trpc.sessoes.list.useQuery();

  const cliente = clientes?.find((c: any) => c.userId === user?.id);
  const minhasSessoes = sessoes?.filter((s: any) => s.clienteId === cliente?.id) || [];

  if (!user || user.role !== "cliente") {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        padding: "20px",
      }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#000000", marginBottom: "20px" }}>
          Acesso Restrito
        </h1>
        <p style={{ fontSize: "18px", color: "#000000", marginBottom: "20px" }}>
          Esta área é exclusiva para clientes.
        </p>
        <button
          onClick={() => router.navigate("/entrar")}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            fontWeight: "bold",
            backgroundColor: "#000000",
            color: "#ffffff",
            border: "3px solid #000000",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Fazer Login
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: "#ffffff",
    }}>
      <header style={{
        backgroundColor: "#000000",
        color: "#ffffff",
        padding: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
            Aura LiveSun
          </h1>
          <p style={{ fontSize: "14px", margin: "5px 0 0 0", opacity: 0.9 }}>
            Histórico de Agendamentos
          </p>
        </div>
        <button
          onClick={() => router.navigate("/cliente-dashboard")}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: "#ffffff",
            color: "#000000",
            border: "2px solid #ffffff",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Voltar ao Painel
        </button>
      </header>

      <main style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        <div style={{
          backgroundColor: "#ffffff",
          padding: "30px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          border: "3px solid #000000",
        }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", color: "#000000" }}>
            Histórico Completo ({minhasSessoes.length} agendamentos)
          </h2>

          {minhasSessoes.length === 0 ? (
            <p style={{ fontSize: "16px", color: "#000000" }}>
              Nenhum agendamento encontrado.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {minhasSessoes.map((sessao: any) => (
                <div
                  key={sessao.id}
                  style={{
                    padding: "20px",
                    backgroundColor: "#f5f5f5",
                    borderRadius: "4px",
                    border: "2px solid #000000",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, color: "#000000" }}>
                      {sessao.servicoNome}
                    </h3>
                    <span style={{
                      padding: "5px 10px",
                      fontSize: "14px",
                      fontWeight: "bold",
                      backgroundColor: getStatusColor(sessao.status),
                      color: "#ffffff",
                      borderRadius: "4px",
                    }}>
                      {sessao.status}
                    </span>
                  </div>
                  <p style={{ fontSize: "16px", color: "#000000", margin: "5px 0" }}>
                    <strong>Data:</strong> {new Date(sessao.dataHoraInicio).toLocaleString("pt-BR")}
                  </p>
                  <p style={{ fontSize: "16px", color: "#000000", margin: "5px 0" }}>
                    <strong>Profissional:</strong> {sessao.profissionalNome}
                  </p>
                  <p style={{ fontSize: "16px", color: "#000000", margin: "5px 0" }}>
                    <strong>Duração:</strong> {sessao.duracaoMin} minutos
                  </p>
                  {sessao.observacoesInternas && (
                    <p style={{ fontSize: "16px", color: "#000000", margin: "5px 0" }}>
                      <strong>Observações:</strong> {sessao.observacoesInternas}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "AGUARDANDO_CONFIRMACAO":
      return "#ff9800";
    case "CONFIRMADA":
      return "#4caf50";
    case "EM_ATENDIMENTO":
      return "#2196f3";
    case "CONCLUIDA":
      return "#9e9e9e";
    case "CANCELADA":
      return "#f44336";
    default:
      return "#9e9e9e";
  }
}
