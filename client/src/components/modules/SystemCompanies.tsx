import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const createCompanySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type CreateCompanyData = z.infer<typeof createCompanySchema>;

interface Company {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone?: string;
  userType: 'system_admin' | 'company_admin';
  active: boolean;
  createdAt: string;
}

export default function SystemCompanies() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<CreateCompanyData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: "",
      cnpj: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['/api/system/companies'],
    queryFn: async () => {
      const response = await api.get('/api/system/companies');
      return response.data;
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      const response = await api.post('/api/system/companies', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system/companies'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Empresa criada",
        description: "A nova empresa foi registrada com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar empresa",
        description: error.response?.data?.message || "Erro ao registrar nova empresa",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const response = await api.patch(`/api/system/companies/${id}/status`, { active });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system/companies'] });
      toast({
        title: "Status atualizado",
        description: "Status da empresa foi alterado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alterar status",
        description: error.response?.data?.message || "Erro ao alterar status da empresa",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateCompanyData) => {
    createCompanyMutation.mutate(data);
  };

  const handleToggleStatus = (company: Company) => {
    toggleStatusMutation.mutate({ id: company.id, active: !company.active });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 fw-bold mb-1">Gerenciar Empresas</h2>
          <p className="text-muted mb-0">Cadastre e gerencie todas as empresas do sistema</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-company" className="btn btn-primary">
              <i className="fas fa-plus me-2"></i>
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="modal-dialog">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Empresa</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <Label htmlFor="name">Nome da Empresa</Label>
                  <Input
                    id="name"
                    data-testid="input-new-company-name"
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
                    data-testid="input-new-company-cnpj"
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
                    data-testid="input-new-company-email"
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
                    data-testid="input-new-company-phone"
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

              <div className="mb-3">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="input-new-company-password"
                  {...form.register("password")}
                  placeholder="Senha de acesso"
                />
                {form.formState.errors.password && (
                  <small className="text-danger">
                    {form.formState.errors.password.message}
                  </small>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel-new-company"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  data-testid="button-save-new-company"
                  disabled={createCompanyMutation.isPending}
                  className="btn btn-primary"
                >
                  {createCompanyMutation.isPending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Criando...
                    </>
                  ) : (
                    "Criar Empresa"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas ({companies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th data-testid="table-header-name">Nome da Empresa</th>
                  <th data-testid="table-header-cnpj">CNPJ</th>
                  <th data-testid="table-header-email">Email</th>
                  <th data-testid="table-header-phone">Telefone</th>
                  <th data-testid="table-header-status">Status</th>
                  <th data-testid="table-header-created">Criado em</th>
                  <th data-testid="table-header-actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <i className="fas fa-building fa-3x text-muted mb-3"></i>
                      <p className="text-muted mb-0">Nenhuma empresa encontrada</p>
                      <small className="text-muted">Clique em "Nova Empresa" para cadastrar a primeira</small>
                    </td>
                  </tr>
                ) : (
                  companies.map((company: Company) => (
                    <tr key={company.id} data-testid={`company-row-${company.id}`}>
                      <td data-testid={`company-name-${company.id}`}>
                        <div>
                          <div className="fw-medium">{company.name}</div>
                          {company.userType === 'system_admin' && (
                            <small className="badge bg-warning">Super Admin</small>
                          )}
                        </div>
                      </td>
                      <td data-testid={`company-cnpj-${company.id}`}>{company.cnpj}</td>
                      <td data-testid={`company-email-${company.id}`}>{company.email}</td>
                      <td data-testid={`company-phone-${company.id}`}>{company.phone || '-'}</td>
                      <td data-testid={`company-status-${company.id}`}>
                        <span className={`badge ${company.active ? 'bg-success' : 'bg-danger'}`}>
                          {company.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td data-testid={`company-created-${company.id}`}>
                        {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td data-testid={`company-actions-${company.id}`}>
                        {company.userType !== 'system_admin' && (
                          <Button
                            size="sm"
                            variant={company.active ? "destructive" : "outline"}
                            onClick={() => handleToggleStatus(company)}
                            disabled={toggleStatusMutation.isPending}
                            data-testid={`button-toggle-status-${company.id}`}
                          >
                            {company.active ? (
                              <>
                                <i className="fas fa-ban me-1"></i>
                                Desativar
                              </>
                            ) : (
                              <>
                                <i className="fas fa-check me-1"></i>
                                Ativar
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}