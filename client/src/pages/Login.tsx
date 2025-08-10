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
    <div className="login-container d-flex align-items-center justify-content-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-4">
            <Card className="shadow-lg">
              <CardContent className="p-5">
                <div className="text-center mb-4">
                  <i className="fas fa-cocktail fa-3x text-primary mb-3"></i>
                  <h2 className="fw-bold" style={{ color: "var(--bar-neutral-800)" }}>
                    BarManager
                  </h2>
                  <p className="text-muted">Sistema de Gestão para Bares</p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="mb-3">
                    <Label htmlFor="email" className="form-label fw-medium">
                      E-mail da Empresa
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="empresa@exemplo.com"
                      {...form.register("email")}
                      className="form-control"
                    />
                    {form.formState.errors.email && (
                      <small className="text-danger">
                        {form.formState.errors.email.message}
                      </small>
                    )}
                  </div>

                  <div className="mb-3">
                    <Label htmlFor="password" className="form-label fw-medium">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="********"
                      {...form.register("password")}
                      className="form-control"
                    />
                    {form.formState.errors.password && (
                      <small className="text-danger">
                        {form.formState.errors.password.message}
                      </small>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-100 py-2 fw-medium"
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="text-muted mb-2">Não possui uma conta?</p>
                  <Link href="/register">
                    <Button variant="outline" className="btn btn-outline-primary w-100">
                      Cadastrar Empresa
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
