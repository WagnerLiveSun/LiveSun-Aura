import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export function Login() {
  const [_, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: user } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (user) {
      if (user.role === "cliente") {
        navigate("/cliente-dashboard");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      navigate("/");
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

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#ffffff',
      padding: '20px'
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: '400px',
        backgroundColor: '#ffffff',
        border: '3px solid #000000',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
      }}>
        <CardHeader style={{ paddingBottom: '20px' }}>
          <CardTitle style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            textAlign: 'center',
            color: '#000000',
            marginBottom: '15px'
          }}>
            Aura LiveSun
          </CardTitle>
          <CardDescription style={{ 
            textAlign: 'center',
            color: '#000000',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            Sistema de Gestão de Clínica de Bronzeamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {error && (
              <Alert style={{ 
                backgroundColor: '#ff0000', 
                border: '3px solid #000000',
                color: '#ffffff',
                padding: '15px'
              }}>
                <AlertDescription style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '16px' }}>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Label htmlFor="email" style={{ 
                color: '#000000', 
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
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
                style={{
                  backgroundColor: '#ffffff',
                  border: '3px solid #000000',
                  color: '#000000',
                  height: '50px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Label htmlFor="password" style={{ 
                color: '#000000', 
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                style={{
                  backgroundColor: '#ffffff',
                  border: '3px solid #000000',
                  color: '#000000',
                  height: '50px',
                  fontSize: '18px',
                  fontWeight: 'bold'
                }}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                height: '55px',
                backgroundColor: '#000000',
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 'bold',
                border: '3px solid #000000'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ marginRight: '10px', height: '24px', width: '24px' }} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter style={{ paddingTop: '25px' }}>
          <div style={{ 
            width: '100%', 
            textAlign: 'center',
            fontSize: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <a
              href="/esqueci-senha"
              style={{ 
                color: '#0000ff',
                textDecoration: 'underline',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Esqueci minha senha
            </a>
            <p style={{ color: '#000000', fontSize: '16px' }}>
              Não tem uma conta?{" "}
              <a
                href="/cadastrar"
                style={{ 
                  color: '#0000ff',
                  textDecoration: 'underline',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                Cadastre-se
              </a>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}