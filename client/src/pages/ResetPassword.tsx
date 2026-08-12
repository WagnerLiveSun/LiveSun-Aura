import { useState } from "react";
import { useRouter, useSearchParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2 } from "lucide-react";

export function ResetPassword() {
  const router = useRouter();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetPasswordMutation = trpc.auth.redefinirSenha.useMutation({
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (err) => {
      setError(err.message || "Erro ao redefinir senha");
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (!token) {
      setError("Token inválido. Solicite uma nova redefinição de senha.");
      return;
    }

    setIsLoading(true);

    try {
      await resetPasswordMutation.mutateAsync({ token, newPassword: password });
    } catch (err) {
      // Error is handled in onError callback
    }
  };

  if (success) {
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
            <CardTitle style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              textAlign: 'center',
              color: '#000000',
              marginBottom: '10px'
            }}>
              Senha redefinida
            </CardTitle>
            <CardDescription style={{ 
              textAlign: 'center',
              color: '#333333',
              fontSize: '14px'
            }}>
              Sua senha foi redefinida com sucesso. Você já pode fazer login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.navigate("/")}
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
              Fazer login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token) {
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
              Token inválido
            </CardTitle>
            <CardDescription style={{ 
              textAlign: 'center',
              color: '#333333',
              fontSize: '14px'
            }}>
              O link de redefinição de senha é inválido ou expirou.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.navigate("/esqueci-senha")}
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
              Solicitar nova redefinição
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            Redefinir senha
          </CardTitle>
          <CardDescription style={{ 
            textAlign: 'center',
            color: '#333333',
            fontSize: '14px'
          }}>
            Digite sua nova senha
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
              <Label htmlFor="password" style={{ 
                color: '#000000', 
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                Nova senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
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
              <Label htmlFor="confirmPassword" style={{ 
                color: '#000000', 
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                Confirmar senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
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
                  Redefinindo...
                </>
              ) : (
                "Redefinir senha"
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
              style={{ 
                color: '#0000ff',
                textDecoration: 'underline',
                fontWeight: 'bold'
              }}
            >
              Voltar para o login
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}