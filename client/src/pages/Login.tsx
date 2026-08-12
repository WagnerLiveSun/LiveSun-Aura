import { useState, useEffect } from "react";
import { useRouter } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Detectar tema do sistema
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(darkMode);
  }, []);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      trpc.auth.me.invalidate();
      router.navigate("/");
    },
    onError: (err) => {
      setError(err.message || "Erro ao fazer login");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await loginMutation.mutateAsync({ email, password });
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

  return (
    <div style={styles.container}>
      <Card style={styles.card}>
        <CardHeader style={{ paddingBottom: '20px' }}>
          <CardTitle style={styles.title}>
            Aura LiveSun
          </CardTitle>
          <CardDescription style={styles.description}>
            Sistema de Gestão de Clínica de Bronzeamento
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Label htmlFor="password" style={styles.label}>
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Entrando...
                </>
              ) : (
                "Entrar"
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
              href="/esqueci-senha"
              style={styles.link}
            >
              Esqueci minha senha
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}