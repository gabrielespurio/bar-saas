import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { register: registerCompany } = useAuth();
  const { toast } = useToast();

  const form = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterData) => {
    if (!acceptTerms) {
      toast({
        title: "Termos de uso",
        description: "Você deve aceitar os termos de uso para continuar",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await registerCompany(data);
      toast({
        title: "Empresa cadastrada com sucesso!",
        description: "Bem-vindo ao BarManager",
      });
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #1976D2 0%, #1565C0 100%)",
      minHeight: "100vh"
    }} className="d-flex align-items-center justify-content-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <Card className="shadow-lg fade-in">
              <CardContent className="p-5">
                <div className="text-center mb-4">
                  <i className="fas fa-cocktail fa-3x text-primary mb-3"></i>
                  <h2 className="fw-bold" style={{ color: "#424242" }}>
                    Cadastrar Empresa
                  </h2>
                  <p className="text-muted">Registre sua empresa e comece a usar o BarManager</p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <Label htmlFor="name" className="form-label fw-medium">
                        Nome da Empresa
                      </Label>
                      <Input
                        id="name"
                        placeholder="Meu Bar Ltda"
                        {...form.register("name")}
                        className={`form-control ${form.formState.errors.name ? 'is-invalid' : ''}`}
                      />
                      {form.formState.errors.name && (
                        <small className="text-danger">
                          {form.formState.errors.name.message}
                        </small>
                      )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <Label htmlFor="cnpj" className="form-label fw-medium">
                        CNPJ
                      </Label>
                      <Input
                        id="cnpj"
                        placeholder="00.000.000/0001-00"
                        {...form.register("cnpj")}
                        className={`form-control ${form.formState.errors.cnpj ? 'is-invalid' : ''}`}
                      />
                      {form.formState.errors.cnpj && (
                        <small className="text-danger">
                          {form.formState.errors.cnpj.message}
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <Label htmlFor="email" className="form-label fw-medium">
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@meubar.com"
                      {...form.register("email")}
                      className={`form-control ${form.formState.errors.email ? 'is-invalid' : ''}`}
                    />
                    {form.formState.errors.email && (
                      <small className="text-danger">
                        {form.formState.errors.email.message}
                      </small>
                    )}
                  </div>

                  <div className="mb-3">
                    <Label htmlFor="phone" className="form-label fw-medium">
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      {...form.register("phone")}
                      className={`form-control ${form.formState.errors.phone ? 'is-invalid' : ''}`}
                    />
                    {form.formState.errors.phone && (
                      <small className="text-danger">
                        {form.formState.errors.phone.message}
                      </small>
                    )}
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <Label htmlFor="password" className="form-label fw-medium">
                        Senha
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="********"
                        {...form.register("password")}
                        className={`form-control ${form.formState.errors.password ? 'is-invalid' : ''}`}
                      />
                      {form.formState.errors.password && (
                        <small className="text-danger">
                          {form.formState.errors.password.message}
                        </small>
                      )}
                    </div>
                    <div className="col-md-6 mb-3">
                      <Label htmlFor="confirmPassword" className="form-label fw-medium">
                        Confirmar Senha
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="********"
                        {...form.register("confirmPassword")}
                        className={`form-control ${form.formState.errors.confirmPassword ? 'is-invalid' : ''}`}
                      />
                      {form.formState.errors.confirmPassword && (
                        <small className="text-danger">
                          {form.formState.errors.confirmPassword.message}
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="mb-3 form-check d-flex align-items-center gap-2">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    />
                    <Label htmlFor="terms" className="form-check-label">
                      Aceito os{" "}
                      <a href="#" className="text-primary">
                        termos de uso
                      </a>{" "}
                      e{" "}
                      <a href="#" className="text-primary">
                        política de privacidade
                      </a>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-100 py-2 fw-medium"
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Cadastrando...
                      </>
                    ) : (
                      "Cadastrar Empresa"
                    )}
                  </Button>
                </form>

                <hr className="my-4" />

                <div className="text-center">
                  <Link href="/">
                    <Button variant="outline" className="btn btn-outline-secondary">
                      <i className="fas fa-arrow-left me-2"></i>Voltar para Login
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
