import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2 } from "lucide-react";

export function ForgotPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  if (success) {
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
              fontSize: '32px', 
              fontWeight: 'bold', 
              textAlign: 'center',
              color: '#000000',
              marginBottom: '15px'
            }}>
              E-mail enviado
            </CardTitle>
            <CardDescription style={{ 
              textAlign: 'center',
              color: '#000000',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              Enviamos instruções para redefinir sua senha para o e-mail informado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/")}
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
              Voltar para o login
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
            Esqueci minha senha
          </CardTitle>
          <CardDescription style={{ 
            textAlign: 'center',
            color: '#000000',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            Digite seu e-mail para receber instruções de redefinição
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
                  Enviando...
                </>
              ) : (
                "Enviar instruções"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter style={{ paddingTop: '25px' }}>
          <div style={{ 
            width: '100%', 
            textAlign: 'center',
            fontSize: '16px'
          }}>
            <a
              href="/"
              style={{ 
                color: '#0000ff',
                textDecoration: 'underline',
                fontWeight: 'bold',
                fontSize: '16px'
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
