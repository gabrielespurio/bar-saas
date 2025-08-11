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
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  website: z.string().optional(),
  businessType: z.string().min(1, "Tipo de negócio é obrigatório"),
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
      address: "",
      city: "",
      state: "",
      website: "",
      businessType: "",
    },
  });

  // Mask functions
  const applyCnpjMask = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const applyPhoneMask = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = applyCnpjMask(e.target.value);
    form.setValue('cnpj', maskedValue);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = applyPhoneMask(e.target.value);
    form.setValue('phone', maskedValue);
  };

  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ['/api/system/companies'],
    queryFn: async () => {
      const response = await api.get('/api/system/companies');
      console.log('Companies API response:', response.data);
      return Array.isArray(response.data) ? response.data : [];
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
        description: "A nova empresa foi registrada com sucesso. Um usuário admin pode ser criado posteriormente.",
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

  if (error) {
    console.error('Error loading companies:', error);
    return (
      <div className="p-6">
        <div className="alert alert-danger">
          <h4>Erro ao carregar empresas</h4>
          <p>Houve um problema ao carregar a lista de empresas. Verifique os logs do console.</p>
        </div>
      </div>
    );
  }

  // Ensure companies is always an array
  const companiesList = Array.isArray(companies) ? companies : [];

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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader className="border-b pb-4 mb-6">
              <DialogTitle className="text-2xl font-semibold text-gray-800">
                Cadastro de Nova Empresa
              </DialogTitle>
              <p className="text-gray-600 mt-2">
                Preencha os dados da empresa para registrar no sistema. Todos os campos marcados com * são obrigatórios.
              </p>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Informações Básicas */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-building text-blue-600 mr-2"></i>
                  Informações da Empresa
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Nome da Empresa *
                    </Label>
                    <Input
                      id="name"
                      data-testid="input-new-company-name"
                      {...form.register("name")}
                      placeholder="Ex: Bar e Restaurante Sabor Local"
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form.formState.errors.name && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="cnpj" className="text-sm font-medium text-gray-700">
                      CNPJ *
                    </Label>
                    <Input
                      id="cnpj"
                      data-testid="input-new-company-cnpj"
                      value={form.watch("cnpj")}
                      onChange={handleCnpjChange}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form.formState.errors.cnpj && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.cnpj.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="businessType" className="text-sm font-medium text-gray-700">
                      Tipo de Negócio *
                    </Label>
                    <select
                      id="businessType"
                      {...form.register("businessType")}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="bar">Bar</option>
                      <option value="restaurante">Restaurante</option>
                      <option value="lanchonete">Lanchonete</option>
                      <option value="pub">Pub</option>
                      <option value="boteco">Boteco</option>
                      <option value="casa_noturna">Casa Noturna</option>
                      <option value="choperia">Choperia</option>
                    </select>
                    {form.formState.errors.businessType && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.businessType.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-phone text-green-600 mr-2"></i>
                  Informações de Contato
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      data-testid="input-new-company-email"
                      {...form.register("email")}
                      placeholder="contato@empresa.com"
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form.formState.errors.email && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Telefone *
                    </Label>
                    <Input
                      id="phone"
                      data-testid="input-new-company-phone"
                      value={form.watch("phone")}
                      onChange={handlePhoneChange}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                      Website
                    </Label>
                    <Input
                      id="website"
                      data-testid="input-new-company-website"
                      {...form.register("website")}
                      placeholder="https://www.empresa.com"
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form.formState.errors.website && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.website.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-map-marker-alt text-red-600 mr-2"></i>
                  Endereço
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                      Endereço *
                    </Label>
                    <Input
                      id="address"
                      data-testid="input-new-company-address"
                      {...form.register("address")}
                      placeholder="Rua das Flores, 123 - Centro"
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form.formState.errors.address && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.address.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                      Cidade *
                    </Label>
                    <Input
                      id="city"
                      data-testid="input-new-company-city"
                      {...form.register("city")}
                      placeholder="São Paulo"
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form.formState.errors.city && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                      Estado *
                    </Label>
                    <select
                      id="state"
                      {...form.register("state")}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Selecione</option>
                      <option value="SP">São Paulo</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="PR">Paraná</option>
                      <option value="SC">Santa Catarina</option>
                      <option value="BA">Bahia</option>
                      <option value="GO">Goiás</option>
                      <option value="PE">Pernambuco</option>
                      <option value="CE">Ceará</option>
                    </select>
                    {form.formState.errors.state && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.state.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Informativo */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-blue-600 mt-1 mr-3"></i>
                  <div>
                    <p className="text-blue-800 text-sm">
                      <strong>Informação importante:</strong> Após criar a empresa, um usuário administrador deverá ser criado 
                      separadamente na aba "Gerenciar Usuários" para permitir o acesso ao sistema.
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  data-testid="button-cancel-new-company"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  data-testid="button-save-new-company"
                  disabled={createCompanyMutation.isPending}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium"
                >
                  {createCompanyMutation.isPending ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Criando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check mr-2"></i>
                      Criar Empresa
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas ({companiesList.length})</CardTitle>
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
                {companiesList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <i className="fas fa-building fa-3x text-muted mb-3"></i>
                      <p className="text-muted mb-0">Nenhuma empresa encontrada</p>
                      <small className="text-muted">Clique em "Nova Empresa" para cadastrar a primeira</small>
                    </td>
                  </tr>
                ) : (
                  companiesList.map((company: Company) => (
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