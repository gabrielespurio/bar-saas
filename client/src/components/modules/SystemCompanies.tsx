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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { MoreVertical, Edit, Power, PowerOff, Users } from "lucide-react";

const createCompanySchema = z.object({
  name: z.string().min(1, "Nome da empresa é obrigatório"),
  cnpj: z.string().min(14, "CNPJ deve ter pelo menos 14 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  cep: z.string().min(8, "CEP é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  addressNumber: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  website: z.string().optional(),
  businessType: z.string().min(1, "Tipo de negócio é obrigatório"),
  ownerName: z.string().min(1, "Nome do proprietário é obrigatório"),
  ownerEmail: z.string().email("Email do proprietário inválido"),
  ownerPhone: z.string().min(1, "Telefone do proprietário é obrigatório"),
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

interface CompanyUser {
  id: string;
  companyId: string;
  name: string;
  email: string;
  userType: 'company_admin';
  active: boolean;
  createdAt: string;
}

const createUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type CreateUserData = z.infer<typeof createUserSchema>;

export default function SystemCompanies() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);

  const form = useForm<CreateCompanyData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: "",
      cnpj: "",
      email: "",
      phone: "",
      cep: "",
      address: "",
      addressNumber: "",
      neighborhood: "",
      city: "",
      state: "",
      website: "",
      businessType: "",
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
    },
  });

  const userForm = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
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

  const handleOwnerPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = applyPhoneMask(e.target.value);
    form.setValue('ownerPhone', maskedValue);
  };

  const applyCepMask = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedValue = applyCepMask(e.target.value);
    form.setValue('cep', maskedValue);

    // Auto-fill address when CEP is complete (8 digits)
    const cleanCep = maskedValue.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          form.setValue('address', data.logradouro || '');
          form.setValue('neighborhood', data.bairro || '');
          form.setValue('city', data.localidade || '');
          form.setValue('state', data.uf || '');
          
          toast({
            title: "CEP encontrado",
            description: "Endereço preenchido automaticamente",
          });
        } else {
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP digitado",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        toast({
          title: "Erro ao buscar CEP",
          description: "Verifique sua conexão com a internet",
          variant: "destructive",
        });
      }
    }
  };

  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ['system/companies'],
    queryFn: async () => {
      try {
        console.log('Fetching companies...');
        const response = await api.get('/system/companies');
        console.log('Companies API response:', response.data);
        const companiesData = Array.isArray(response.data) ? response.data : [];
        console.log('Processed companies data:', companiesData);
        return companiesData;
      } catch (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: CreateCompanyData) => {
      const response = await api.post('/system/companies', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system/companies'] });
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
      const response = await api.patch(`/system/companies/${id}/status`, { active });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system/companies'] });
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

  // Buscar usuários da empresa
  const { data: companyUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['company-users', selectedCompany?.id],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const response = await api.get(`/system/companies/${selectedCompany.id}/users`);
      return response.data;
    },
    enabled: !!selectedCompany && isUsersModalOpen,
  });

  // Criar usuário da empresa
  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserData) => {
      if (!selectedCompany) throw new Error('Empresa não selecionada');
      const response = await api.post(`/system/companies/${selectedCompany.id}/users`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users', selectedCompany?.id] });
      setIsCreateUserDialogOpen(false);
      userForm.reset();
      toast({
        title: "Usuário criado",
        description: "Usuário administrador criado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.response?.data?.message || "Erro ao criar usuário",
        variant: "destructive",
      });
    },
  });

  // Alterar status do usuário
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      if (!selectedCompany) throw new Error('Empresa não selecionada');
      const response = await api.patch(`/system/companies/${selectedCompany.id}/users/${userId}/status`, { active });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users', selectedCompany?.id] });
      toast({
        title: "Status atualizado",
        description: "Status do usuário foi alterado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao alterar status",
        description: error.response?.data?.message || "Erro ao alterar status do usuário",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateCompanyData) => {
    createCompanyMutation.mutate(data);
  };

  const onSubmitUser = (data: CreateUserData) => {
    createUserMutation.mutate(data);
  };

  const handleToggleStatus = (company: Company) => {
    toggleStatusMutation.mutate({ id: company.id, active: !company.active });
  };

  const handleToggleUserStatus = (user: CompanyUser) => {
    toggleUserStatusMutation.mutate({ userId: user.id, active: !user.active });
  };

  const handleManageUsers = (company: Company) => {
    setSelectedCompany(company);
    setIsUsersModalOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    // Implementar edição da empresa
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A edição de empresas será implementada em breve",
    });
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

              {/* Informações do Proprietário */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-user text-purple-600 mr-2"></i>
                  Informações do Proprietário
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ownerName" className="text-sm font-medium text-gray-700">
                      Nome do Proprietário *
                    </Label>
                    <Input
                      id="ownerName"
                      data-testid="input-new-company-owner-name"
                      {...form.register("ownerName")}
                      placeholder="João Silva"
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form.formState.errors.ownerName && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.ownerName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="ownerEmail" className="text-sm font-medium text-gray-700">
                      Email do Proprietário *
                    </Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      data-testid="input-new-company-owner-email"
                      {...form.register("ownerEmail")}
                      placeholder="joao@empresa.com"
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form.formState.errors.ownerEmail && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.ownerEmail.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="ownerPhone" className="text-sm font-medium text-gray-700">
                      Telefone do Proprietário *
                    </Label>
                    <Input
                      id="ownerPhone"
                      data-testid="input-new-company-owner-phone"
                      value={form.watch("ownerPhone")}
                      onChange={handleOwnerPhoneChange}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form.formState.errors.ownerPhone && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.ownerPhone.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                  <i className="fas fa-phone text-green-600 mr-2"></i>
                  Informações de Contato da Empresa
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
                  <div>
                    <Label htmlFor="cep" className="text-sm font-medium text-gray-700">
                      CEP *
                    </Label>
                    <Input
                      id="cep"
                      data-testid="input-new-company-cep"
                      value={form.watch("cep")}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={9}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form.formState.errors.cep && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.cep.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Digite o CEP para preenchimento automático
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                      Logradouro *
                    </Label>
                    <Input
                      id="address"
                      data-testid="input-new-company-address"
                      value={form.watch("address")}
                      onChange={(e) => form.setValue("address", e.target.value)}
                      placeholder="Rua das Flores"
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form.formState.errors.address && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.address.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="addressNumber" className="text-sm font-medium text-gray-700">
                      Número *
                    </Label>
                    <Input
                      id="addressNumber"
                      data-testid="input-new-company-address-number"
                      {...form.register("addressNumber")}
                      placeholder="123"
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form.formState.errors.addressNumber && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.addressNumber.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="neighborhood" className="text-sm font-medium text-gray-700">
                      Bairro *
                    </Label>
                    <Input
                      id="neighborhood"
                      data-testid="input-new-company-neighborhood"
                      value={form.watch("neighborhood")}
                      onChange={(e) => form.setValue("neighborhood", e.target.value)}
                      placeholder="Centro"
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                    {form.formState.errors.neighborhood && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.neighborhood.message}
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
                      value={form.watch("city")}
                      onChange={(e) => form.setValue("city", e.target.value)}
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
                    <Input
                      id="state"
                      data-testid="input-new-company-state"
                      value={form.watch("state")}
                      onChange={(e) => form.setValue("state", e.target.value.toUpperCase())}
                      placeholder="SP"
                      maxLength={2}
                      className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
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
                        {company.userType !== 'system_admin' ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                data-testid={`dropdown-actions-${company.id}`}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleEditCompany(company)}
                                data-testid={`action-edit-${company.id}`}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(company)}
                                data-testid={`action-toggle-${company.id}`}
                              >
                                {company.active ? (
                                  <>
                                    <PowerOff className="mr-2 h-4 w-4" />
                                    Inativar
                                  </>
                                ) : (
                                  <>
                                    <Power className="mr-2 h-4 w-4" />
                                    Ativar
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleManageUsers(company)}
                                data-testid={`action-manage-users-${company.id}`}
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Gerenciar Usuários
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <span className="text-muted-small">Superadmin</span>
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

      {/* Modal de Gerenciar Usuários */}
      <Dialog open={isUsersModalOpen} onOpenChange={setIsUsersModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b pb-4 mb-6">
            <DialogTitle className="text-2xl font-semibold text-gray-800">
              Gerenciar Usuários - {selectedCompany?.name}
            </DialogTitle>
            <p className="text-gray-600 mt-2">
              Visualize e gerencie os usuários administradores desta empresa.
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Botão para criar novo usuário */}
            <div className="flex justify-end">
              <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-new-user" className="bg-blue-600 hover:bg-blue-700">
                    <Users className="mr-2 h-4 w-4" />
                    Novo Usuário Admin
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Criar Usuário Administrador</DialogTitle>
                    <p className="text-gray-600">
                      Crie um novo usuário administrador para {selectedCompany?.name}
                    </p>
                  </DialogHeader>
                  
                  <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="space-y-4">
                    <div>
                      <Label htmlFor="userName">Nome completo *</Label>
                      <Input
                        id="userName"
                        data-testid="input-user-name"
                        {...userForm.register("name")}
                        placeholder="João Silva"
                      />
                      {userForm.formState.errors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {userForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="userEmail">Email *</Label>
                      <Input
                        id="userEmail"
                        data-testid="input-user-email"
                        {...userForm.register("email")}
                        placeholder="joao@empresa.com"
                        type="email"
                      />
                      {userForm.formState.errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {userForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="userPassword">Senha *</Label>
                      <Input
                        id="userPassword"
                        data-testid="input-user-password"
                        {...userForm.register("password")}
                        placeholder="Mínimo 6 caracteres"
                        type="password"
                      />
                      {userForm.formState.errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                          {userForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateUserDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createUserMutation.isPending}
                        data-testid="button-save-user"
                      >
                        {createUserMutation.isPending ? (
                          <>
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                            Criando...
                          </>
                        ) : (
                          'Criar Usuário'
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Lista de usuários */}
            <div className="border rounded-lg">
              {isLoadingUsers ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Carregando usuários...</p>
                </div>
              ) : companyUsers.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Nenhum usuário administrador encontrado</p>
                  <p className="text-sm text-gray-500">Clique em "Novo Usuário Admin" para criar o primeiro</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nome</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Criado em</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {companyUsers.map((user: CompanyUser) => (
                        <tr key={user.id} data-testid={`user-row-${user.id}`}>
                          <td className="px-4 py-3" data-testid={`user-name-${user.id}`}>
                            {user.name}
                          </td>
                          <td className="px-4 py-3" data-testid={`user-email-${user.id}`}>
                            {user.email}
                          </td>
                          <td className="px-4 py-3" data-testid={`user-status-${user.id}`}>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500" data-testid={`user-created-${user.id}`}>
                            {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3" data-testid={`user-actions-${user.id}`}>
                            <Button
                              size="sm"
                              variant={user.active ? "destructive" : "outline"}
                              onClick={() => handleToggleUserStatus(user)}
                              disabled={toggleUserStatusMutation.isPending}
                              data-testid={`button-toggle-user-status-${user.id}`}
                            >
                              {user.active ? 'Inativar' : 'Ativar'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}