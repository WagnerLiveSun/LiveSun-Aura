import { useState } from "react";
import { useRouter } from "wouter";
import { trpc } from "@/lib/trpc";

export default function RegisterClient() {
  // useRouter retorna [location, navigate]
  const [, navigate] = useRouter();

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    password: "",
    confirmPassword: "",
    dataNascimento: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const registerMutation = trpc.auth.registrarCliente.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (formData.password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      await registerMutation.mutateAsync({
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone || undefined,
        password: formData.password,
        dataNascimento: formData.dataNascimento || undefined,
      });

      navigate("/entrar");
    } catch (err: any) {
      setError(err.message || "Erro ao realizar cadastro");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          backgroundColor: "#ffffff",
          padding: "40px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "bold",
            marginBottom: "10px",
            textAlign: "center",
            color: "#000000",
          }}
        >
          Aura LiveSun
        </h1>
        <p
          style={{
            fontSize: "18px",
            marginBottom: "30px",
            textAlign: "center",
            color: "#000000",
          }}
        >
          Sistema de Gestão de Clínica de Bronzeamento
        </p>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "20px",
            textAlign: "center",
            color: "#000000",
          }}
        >
          Cadastro de Cliente
        </h2>

        {error && (
          <div
            style={{
              backgroundColor: "#fee",
              color: "#c00",
              padding: "12px",
              borderRadius: "4px",
              marginBottom: "20px",
              fontSize: "16px",
              border: "1px solid #fcc",
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "5px",
                color: "#000000",
              }}
            >
              Nome Completo
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
              minLength={3}
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
              placeholder="Digite seu nome completo"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "5px",
                color: "#000000",
              }}
            >
              E-mail
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
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
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "5px",
                color: "#000000",
              }}
            >
              Telefone
            </label>
            <input
              type="tel"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
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
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "5px",
                color: "#000000",
              }}
            >
              Data de Nascimento
            </label>
            <input
              type="date"
              name="dataNascimento"
              value={formData.dataNascimento}
              onChange={handleChange}
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
            <label
              style={{
                display: "block",
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "5px",
                color: "#000000",
              }}
            >
              Senha
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
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
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "5px",
                color: "#000000",
              }}
            >
              Confirmar Senha
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
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
              placeholder="Digite a senha novamente"
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
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "16px",
          }}
        >
          <p style={{ color: "#000000", marginBottom: "10px" }}>
            Já tem uma conta?{" "}
            <button
              onClick={() => navigate("/entrar")}
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
              Faça login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}