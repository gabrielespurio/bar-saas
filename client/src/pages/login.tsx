import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginCredentials } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setIsLoading(true);
      await login(data.email, data.password);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao BarManager",
      });
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: "linear-gradient(135deg, #1976D2 0%, #1565C0 100%)"
    }}>
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🍹</div>
              <h2 className="text-2xl font-bold text-gray-800">
                BarManager
              </h2>
              <p className="text-gray-600">Sistema de Gestão para Bares</p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-mail da Empresa
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="empresa@exemplo.com"
                  {...form.register("email")}
                  className="w-full"
                  data-testid="input-email"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  {...form.register("password")}
                  className="w-full"
                  data-testid="input-password"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
                data-testid="button-submit"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Não tem conta?{" "}
                <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                  Cadastre sua empresa
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}