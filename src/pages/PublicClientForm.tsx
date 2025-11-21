import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { mascaraCpf } from '@/lib/qlib';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
// import { useGenericApi } from '@/hooks/useGenericApi';
import { 
  activeClientsService, 
  ActiveClientStep1Data, 
  ActiveClientCompleteData 
} from '@/services/activeClientsService';
import { useFormToken } from '@/hooks/useFormToken';



/**
 * Schema de validação para o formulário completo
 */
const formSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  cpf: z.string().min(14, 'CPF deve estar completo').max(14, 'CPF inválido'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Número de telefone é obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação de senha é obrigatória'),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: 'Você deve concordar com os Termos de Uso'
  }),
  privacyAccepted: z.boolean().refine(val => val === true, {
    message: 'Você deve concordar com a Política de Privacidade'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

type FormData = z.infer<typeof formSchema>;

/**
 * Componente da landing page pública para cadastro de clientes
 */
export default function PublicClientForm() {
  const { cpf } = useParams<{ cpf: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // console.log('ActiveClientsService',activeClientsService);
  
  // Hook para gerenciar token de segurança
  const { token, isLoading: tokenLoading, generateToken, isTokenValid } = useFormToken();

  /**
   * Gera token de segurança ao carregar o componente
   */
  useEffect(() => {
    generateToken();
  }, [generateToken]);

  // Estado de loading das operações
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cpf: mascaraCpf(cpf || ''),
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
      privacyAccepted: false
    },
  });

  /**
   * Função para submeter o formulário completo
   */
  const onSubmit = async (data: FormData) => {
    if (!isTokenValid()) {
      toast.error('Token de segurança inválido. Recarregue a página.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Preparar dados completos incluindo password
      const completeData: ActiveClientCompleteData = {
        name: data.name,
        cpf: data.cpf.replace(/\D/g, ''), // Remove máscara do CPF
        email: data.email,
        phone: data.phone,
        termsAccepted: data.termsAccepted,
        privacyAccepted: data.privacyAccepted,
        password: data.password
      };

      // Enviar dados completos diretamente para finalização
      const response = await activeClientsService.finalizeRegistration(completeData, token!);
      
      if (response) {
        const resAny = response as any;
        // console.log('Resposta final:', response);

        const redirect : string = resAny?.success?.redirect || '/login';
        toast.success('Conta criada com sucesso!');
        form.reset();
        
        // Aguardar 2 segundos para que o usuário veja a mensagem de sucesso antes do redirect
        if(redirect){
          setIsRedirecting(true);
          setTimeout(() => {
            window.location.href = redirect;
          }, 3000);
        }
        // Gerar novo token para próxima utilização
        // generateToken();
      }
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      
      // Verificar se é um erro de validação específico
      if (error && typeof error === 'object' && 'body' in error) {
        const errorBody = (error as any).body;
        if (errorBody?.message === 'Erro de validação' && errorBody?.errors) {
          const errors = errorBody.errors;
          if (errors.email && errors.email.includes('O e-mail já está em uso')) {
            toast.error('Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.');
            return;
          }
        }
      }      
      toast.error('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 flex items-center justify-center p-4">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-60 h-60 bg-purple-300/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/4 right-1/3 w-40 h-40 bg-purple-200/10 rounded-full blur-xl"></div>
      </div>

      <div className="relative z-10 flex w-full max-w-6xl mx-auto">
        {/* Lado esquerdo - Ícone e elementos decorativos */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative">
          <div className="text-center">
            {/* Ícone principal */}
            <div className="w-64 h-64 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 mx-auto border border-white/20">
              <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center">
                <svg className="w-20 h-20 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  <path d="M19 14v3h3v2h-3v3h-2v-3h-3v-2h3v-3h2z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Lado direito - Formulário */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
            {/* Header com botão voltar */}
            <div className="flex items-center mb-6">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-purple-700 hover:bg-purple-50 p-2"
              >
                <Link to="/">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="flex-1 text-center">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-black font-bold text-lg">Y</span>
                </div>
                <h1 className="text-xl font-bold text-purple-700">Yellow Club</h1>
              </div>
            </div>

            <p className="text-purple-600 text-sm mb-6 text-center">
              Cadastre-se e aproveite nossos benefícios
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-purple-700 font-medium">Nome completo*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome completo"
                            className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                <FormField
                  control={form.control}
                  name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-purple-700 font-medium">CPF*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="000.000.000-00"
                            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            {...field}
                            onChange={(e) => {
                              const maskedValue = mascaraCpf(e.target.value);
                              field.onChange(maskedValue);
                            }}
                            maxLength={14}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                <FormField
                  control={form.control}
                  name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-purple-700 font-medium">E-mail*</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="E-mail"
                            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                <FormField
                  control={form.control}
                  name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-purple-700 font-medium">Número de telefone*</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Número de telefone"
                            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-xs" />
                      </FormItem>
                    )}
                  />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-700 font-medium">Senha*</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Digite sua senha"
                            className="border-purple-200 focus:border-purple-500 focus:ring-purple-500 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-purple-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-purple-400" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-700 font-medium">Confirmar senha*</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirme sua senha"
                            className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs" />
                    </FormItem>
                  )}
                />

                {/* Checkboxes de termos */}
                <div className="space-y-3 pt-2">
                  <FormField
                    control={form.control}
                    name="termsAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-purple-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm text-purple-600">
                              Ao criar uma conta, você concorda com os{' '}
                              <span onClick={() => window.open('https://yellowbc.seuclubedevantagens.com.br/tu/', '_blank')} className="text-purple-600 underline cursor-pointer">
                                Termos de Uso
                              </span>
                            </FormLabel>
                            <FormMessage className="text-red-500 text-xs" />
                          </div>
                        </FormItem>
                      )}
                    />

                  <FormField
                    control={form.control}
                    name="privacyAccepted"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="border-gray-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm text-gray-600">
                              Ao criar uma conta, você concorda com a{' '}
                              <span onClick={() => window.open('https://yellowyellowbc.clubedefidelidade.com/privacy_policy', '_blank')} className="text-purple-600 underline cursor-pointer">
                                Política de Privacidade
                              </span>
                            </FormLabel>
                            <FormMessage className="text-red-500 text-xs" />
                          </div>
                        </FormItem>
                      )}
                    />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || tokenLoading || isRedirecting || !isTokenValid()}
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-3 rounded-lg mt-6"
                >
                  {tokenLoading ? 'Carregando...' : isSubmitting ? 'Criando conta...' : isRedirecting ? 'Redirecionando...' : 'Criar Conta'}
                </Button>

                <div className="text-center mt-4">
                  <Link to="/login" className="text-purple-600 text-sm underline hover:text-purple-800 font-medium">
                    Já tem uma conta? Fazer Login
                  </Link>
                </div>
              </form>
            </Form>

          </div>
        </div>
      </div>
    </div>
  );
}