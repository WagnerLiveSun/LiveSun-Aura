import { useState, useEffect } from "react";
import { useRouter } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2 } from "lucide-react";

export function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(darkMode);
  }, []);

  const requestResetMutation = trpc.auth.solicitarRedefinicao.useMutation({
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (err) => {
      setError(err.message || "Erro ao solicitar redefinição de senha");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      await requestResetMutation.mutateAsync({ email });
    } catch (err) {
      // Error is handled in onError callback
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#1a1a2e' : '#f5f5f5',
      padding: '20px'
    },
    card: {
      width: '100%',
      maxWidth: '400px',
      backgroundColor: isDark ? '#16213e' : '#ffffff',
      border: `2px solid ${isDark ? '#ffffff' : '#000000'}`,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      textAlign: 'center',
      color: isDark ? '#ffffff' : '#000000',
      marginBottom: '10px'
    },
    description: {
      textAlign: 'center',
      color: isDark ? '#e0e0e0' : '#333333',
      fontSize: '14px'
    },
    label: {
      color: isDark ? '#ffffff' : '#000000',
      fontWeight: 'bold',
      fontSize: '14px'
    },
    input: {
      backgroundColor: isDark ? '#0f3460' : '#ffffff',
      border: `2px solid ${isDark ? '#ffffff' : '#000000'}`,
      color: isDark ? '#ffffff' : '#000000',
      height: '45px',
      fontSize: '16px'
    },
    button: {
      width: '100%',
      height: '50px',
      backgroundColor: isDark ? '#e94560' : '#000000',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: 'bold',
      border: '2px solid',
      borderColor: isDark ? '#e94560' : '#000000'
    },
    link: {
      color: isDark ? '#e94560' : '#0000ff',
      textDecoration: 'underline',
      fontWeight: 'bold'
    },
    alert: {
      backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
      border: '2px solid',
      borderColor: isDark ? '#ef4444' : '#ef4444',
      color: isDark ? '#ffffff' : '#000000'
    },
    alertText: {
      color: isDark ? '#ffffff' : '#000000',
      fontWeight: 'bold'
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <Card style={styles.card}>
          <CardHeader style={{ paddingBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#22c55e', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 style={{ height: '48px', width: '48px', color: '#ffffff' }} />
              </div>
            </div>
            <CardTitle style={styles.title}>
              E-mail enviado
            </CardTitle>
            <CardDescription style={styles.description}>
              Enviamos instruções para redefinir sua senha para o e-mail informado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.navigate("/")}
              style={styles.button}
            >
              Voltar para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        <CardHeader style={{ paddingBottom: '20px' }}>
          <CardTitle style={styles.title}>
            Esqueci minha senha
          </CardTitle>
          <CardDescription style={styles.description}>
            Digite seu e-mail para receber instruções de redefinição
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <Alert style={styles.alert}>
                <AlertDescription style={styles.alertText}>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Label htmlFor="email" style={styles.label}>
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                style={styles.input}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              style={styles.button}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ marginRight: '8px', height: '20px', width: '20px' }} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar instruções"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter style={{ paddingTop: '20px' }}>
          <div style={{ 
            width: '100%', 
            textAlign: 'center',
            fontSize: '14px'
          }}>
            <a
              href="/"
              style={styles.link}
            >
              Voltar para o login
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}