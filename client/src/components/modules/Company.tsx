import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const companyUpdateSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
});

type CompanyUpdateData = z.infer<typeof companyUpdateSchema>;

export default function Company() {
  const { company } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CompanyUpdateData>({
    resolver: zodResolver(companyUpdateSchema),
    defaultValues: {
      name: company?.name || "",
      cnpj: company?.cnpj || "",
      email: company?.email || "",
      phone: "",
    },
  });

  const onSubmit = async (data: CompanyUpdateData) => {
    try {
      setIsLoading(true);
      await api.put(`/companies/${company?.id}`, data);
      toast({
        title: "Dados atualizados",
        description: "As informações da empresa foram atualizadas com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.response?.data?.message || "Erro ao atualizar dados da empresa",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 fw-bold mb-1">Administração da Empresa</h2>
          <p className="text-muted mb-0">Gerencie as informações da sua empresa</p>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Label htmlFor="name">Nome da Empresa</Label>
                    <Input
                      id="name"
                      data-testid="input-company-name"
                      {...form.register("name")}
                      placeholder="Nome da empresa"
                    />
                    {form.formState.errors.name && (
                      <small className="text-danger">
                        {form.formState.errors.name.message}
                      </small>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      data-testid="input-company-cnpj"
                      {...form.register("cnpj")}
                      placeholder="00.000.000/0000-00"
                    />
                    {form.formState.errors.cnpj && (
                      <small className="text-danger">
                        {form.formState.errors.cnpj.message}
                      </small>
                    )}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      data-testid="input-company-email"
                      {...form.register("email")}
                      placeholder="empresa@exemplo.com"
                    />
                    {form.formState.errors.email && (
                      <small className="text-danger">
                        {form.formState.errors.email.message}
                      </small>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      data-testid="input-company-phone"
                      {...form.register("phone")}
                      placeholder="(11) 99999-9999"
                    />
                    {form.formState.errors.phone && (
                      <small className="text-danger">
                        {form.formState.errors.phone.message}
                      </small>
                    )}
                  </div>
                </div>

                <div className="d-flex justify-content-end">
                  <Button
                    type="submit"
                    data-testid="button-save-company"
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Salvando...
                      </>
                    ) : (
                      "Salvar Alterações"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="col-md-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <Label>ID da Empresa</Label>
                <Input 
                  value={company?.id || ""} 
                  readOnly 
                  className="bg-light"
                  data-testid="text-company-id"
                />
              </div>
              
              <div className="mb-3">
                <Label>Data de Cadastro</Label>
                <Input 
                  value="Não disponível" 
                  readOnly 
                  className="bg-light"
                  data-testid="text-company-created"
                />
              </div>

              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <small>
                  Para alterar a senha da empresa, entre em contato com o suporte.
                </small>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-3">
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="row text-center">
                <div className="col-6 mb-3">
                  <div className="border rounded p-3">
                    <i className="fas fa-users fa-2x text-primary mb-2"></i>
                    <div className="fw-bold">1</div>
                    <small className="text-muted">Usuários</small>
                  </div>
                </div>
                <div className="col-6 mb-3">
                  <div className="border rounded p-3">
                    <i className="fas fa-calendar fa-2x text-success mb-2"></i>
                    <div className="fw-bold">Ativo</div>
                    <small className="text-muted">Status</small>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}