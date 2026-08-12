import { useState } from "react";
import { useRouter } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";

export function ForgotPassword() {
  const router = useRouter();
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md shadow-2xl border-4 border-purple-200 dark:border-purple-700">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full shadow-lg">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              E-mail enviado
            </CardTitle>
            <CardDescription className="text-center text-gray-700 dark:text-gray-300 text-base">
              Enviamos instruções para redefinir sua senha para o e-mail informado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.navigate("/")}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Voltar para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-4 border-purple-200 dark:border-purple-700">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Aura LiveSun
          </CardTitle>
          <CardDescription className="text-center text-gray-700 dark:text-gray-300 text-base">
            Digite seu e-mail para receber instruções de redefinição
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="border-2">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900 dark:text-gray-100 font-semibold text-base">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white dark:bg-gray-800 border-2 h-12 text-base"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar instruções"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 pt-6">
          <div className="text-sm text-center text-gray-700 dark:text-gray-300">
            <a
              href="/"
              className="hover:underline text-purple-600 dark:text-purple-400 font-medium"
            >
              Voltar para o login
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}