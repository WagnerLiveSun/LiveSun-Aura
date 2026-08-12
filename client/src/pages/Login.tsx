import { useState } from "react";
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

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <Card style={{ 
        width: '100%', 
        maxWidth: '400px',
        backgroundColor: '#ffffff',
        border: '2px solid #000000',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <CardHeader style={{ paddingBottom: '20px' }}>
          <CardTitle style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            textAlign: 'center',
            color: '#000000',
            marginBottom: '10px'
          }}>
            Aura LiveSun
          </CardTitle>
          <CardDescription style={{ 
            textAlign: 'center',
            color: '#333333',
            fontSize: '14px'
          }}>
            Sistema de Gestão de Clínica de Bronzeamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <Alert style={{ 
                backgroundColor: '#fee2e2', 
                border: '2px solid #ef4444',
                color: '#000000'
              }}>
                <AlertDescription style={{ color: '#000000', fontWeight: 'bold' }}>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Label htmlFor="email" style={{ 
                color: '#000000', 
                fontWeight: 'bold',
                fontSize: '14px'
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
                  border: '2px solid #000000',
                  color: '#000000',
                  height: '45px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Label htmlFor="password" style={{ 
                color: '#000000', 
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
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
                style={{
                  backgroundColor: '#ffffff',
                  border: '2px solid #000000',
                  color: '#000000',
                  height: '45px',
                  fontSize: '16px'
                }}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                height: '50px',
                backgroundColor: '#000000',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 'bold',
                border: '2px solid #000000'
              }}
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
              style={{ 
                color: '#0000ff',
                textDecoration: 'underline',
                fontWeight: 'bold'
              }}
            >
              Esqueci minha senha
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}