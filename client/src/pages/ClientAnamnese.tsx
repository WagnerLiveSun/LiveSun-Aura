import { useState } from "react";
import { useRouter } from "wouter";
import { trpc } from "@/lib/trpc";

export default function ClientAnamnese() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    alergias: "",
    restricoes: "",
    observacoesClinicas: "",
    possuiCancer: false,
    emTratamentoMedico: false,
    usaMedicamentos: false,
    medicamentos: "",
    gravidez: false,
    lactante: false,
    problemasPele: false,
    problemasPeleDesc: "",
    procedimentosRecentes: false,
    procedimentosRecentesDesc: "",
    declaracaoVeracidade: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: user } = trpc.auth.me.useQuery();
  const prontuarioMutation = trpc.prontuario.update.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.declaracaoVeracidade) {
      setError("Você deve declarar que as informações são verdadeiras");
      return;
    }

    if (!user) {
      setError("Usuário não autenticado");
      return;
    }

    setLoading(true);

    try {
      // Primeiro, buscar o clienteId do usuário
      const clientesQuery = trpc.clientes.list.useQuery();
      const clientes = clientesQuery.data || [];
      const cliente = clientes.find((c: any) => c.userId === user.id);

      if (!cliente) {
        setError("Cliente não encontrado");
        return;
      }

      // Combinar todos os dados em observações clínicas
      const observacoesCompletas = [
        formData.alergias ? `Alergias: ${formData.alergias}` : null,
        formData.restricoes ? `Restrições: ${formData.restricoes}` : null,
        formData.possuiCancer ? "Possui câncer" : null,
        formData.emTratamentoMedico ? "Em tratamento médico" : null,
        formData.usaMedicamentos ? `Medicamentos: ${formData.medicamentos}` : null,
        formData.gravidez ? "Grávida" : null,
        formData.lactante ? "Lactante" : null,
        formData.problemasPele ? `Problemas de pele: ${formData.problemasPeleDesc}` : null,
        formData.procedimentosRecentes ? `Procedimentos recentes: ${formData.procedimentosRecentesDesc}` : null,
        formData.observacoesClinicas ? `Outras observações: ${formData.observacoesClinicas}` : null,
      ].filter(Boolean).join("\n");

      await prontuarioMutation.mutateAsync({
        clienteId: cliente.id,
        alergias: formData.alergias || undefined,
        restricoes: formData.restricoes || undefined,
        observacoesClinicas: observacoesCompletas,
      });

      router.navigate("/cliente-agendamento");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar anamnese");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    setFormData({ ...formData, [target.name]: value });
  };

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
        maxWidth: "700px",
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
          Anamnese Clínica
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
              Alergias conhecidas
            </label>
            <textarea
              name="alergias"
              value={formData.alergias}
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
              placeholder="Liste todas as alergias conhecidas (medicamentos, alimentos, etc.)"
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
              Restrições de saúde
            </label>
            <textarea
              name="restricoes"
              value={formData.restricoes}
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
              placeholder="Liste qualquer restrição de saúde ou condição médica relevante"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#000000",
              cursor: "pointer",
            }}>
              <input
                type="checkbox"
                name="possuiCancer"
                checked={formData.possuiCancer}
                onChange={handleChange}
                style={{ marginRight: "10px", width: "20px", height: "20px" }}
              />
              Possui ou já teve câncer
            </label>

            <label style={{
              display: "flex",
              alignItems: "center",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#000000",
              cursor: "pointer",
            }}>
              <input
                type="checkbox"
                name="emTratamentoMedico"
                checked={formData.emTratamentoMedico}
                onChange={handleChange}
                style={{ marginRight: "10px", width: "20px", height: "20px" }}
              />
              Está em tratamento médico atualmente
            </label>

            <label style={{
              display: "flex",
              alignItems: "center",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#000000",
              cursor: "pointer",
            }}>
              <input
                type="checkbox"
                name="usaMedicamentos"
                checked={formData.usaMedicamentos}
                onChange={handleChange}
                style={{ marginRight: "10px", width: "20px", height: "20px" }}
              />
              Usa medicamentos regularmente
            </label>

            {formData.usaMedicamentos && (
              <textarea
                name="medicamentos"
                value={formData.medicamentos}
                onChange={handleChange}
                rows={2}
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
                  marginLeft: "30px",
                }}
                placeholder="Liste os medicamentos que utiliza"
              />
            )}

            <label style={{
              display: "flex",
              alignItems: "center",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#000000",
              cursor: "pointer",
            }}>
              <input
                type="checkbox"
                name="gravidez"
                checked={formData.gravidez}
                onChange={handleChange}
                style={{ marginRight: "10px", width: "20px", height: "20px" }}
              />
              Está grávida
            </label>

            <label style={{
              display: "flex",
              alignItems: "center",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#000000",
              cursor: "pointer",
            }}>
              <input
                type="checkbox"
                name="lactante"
                checked={formData.lactante}
                onChange={handleChange}
                style={{ marginRight: "10px", width: "20px", height: "20px" }}
              />
              Está amamentando
            </label>

            <label style={{
              display: "flex",
              alignItems: "center",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#000000",
              cursor: "pointer",
            }}>
              <input
                type="checkbox"
                name="problemasPele"
                checked={formData.problemasPele}
                onChange={handleChange}
                style={{ marginRight: "10px", width: "20px", height: "20px" }}
              />
              Possui problemas de pele
            </label>

            {formData.problemasPele && (
              <textarea
                name="problemasPeleDesc"
                value={formData.problemasPeleDesc}
                onChange={handleChange}
                rows={2}
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
                  marginLeft: "30px",
                }}
                placeholder="Descreva os problemas de pele"
              />
            )}

            <label style={{
              display: "flex",
              alignItems: "center",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#000000",
              cursor: "pointer",
            }}>
              <input
                type="checkbox"
                name="procedimentosRecentes"
                checked={formData.procedimentosRecentes}
                onChange={handleChange}
                style={{ marginRight: "10px", width: "20px", height: "20px" }}
              />
              Fez procedimentos estéticos recentemente
            </label>

            {formData.procedimentosRecentes && (
              <textarea
                name="procedimentosRecentesDesc"
                value={formData.procedimentosRecentesDesc}
                onChange={handleChange}
                rows={2}
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
                  marginLeft: "30px",
                }}
                placeholder="Descreva os procedimentos realizados"
              />
            )}
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "5px",
              color: "#000000",
            }}>
              Outras observações clínicas
            </label>
            <textarea
              name="observacoesClinicas"
              value={formData.observacoesClinicas}
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
              placeholder="Qualquer outra informação clínica relevante"
            />
          </div>

          <label style={{
            display: "flex",
            alignItems: "center",
            fontSize: "16px",
            fontWeight: "bold",
            color: "#000000",
            cursor: "pointer",
            marginTop: "10px",
          }}>
            <input
              type="checkbox"
              name="declaracaoVeracidade"
              checked={formData.declaracaoVeracidade}
              onChange={handleChange}
              required
              style={{ marginRight: "10px", width: "20px", height: "20px" }}
            />
            Declaro que todas as informações fornecidas são verdadeiras e completas
          </label>

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
            {loading ? "Salvando..." : "Salvar Anamnese"}
          </button>
        </form>

        <div style={{
          marginTop: "20px",
          textAlign: "center",
          fontSize: "16px",
        }}>
          <button
            onClick={() => router.navigate("/cliente-dashboard")}
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
