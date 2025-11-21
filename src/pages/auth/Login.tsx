import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useRedirect } from '@/hooks/useRedirect';
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

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  remember: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, isLoading, user, isAuthenticated } = useAuth();
  const { redirectAfterAuth } = useRedirect();

  // Efeito para redirecionar após login bem-sucedido
  useEffect(() => {
    if (loginSuccess && isAuthenticated && user) {
      redirectAfterAuth(user);
      setLoginSuccess(false);
    }
  }, [loginSuccess, redirectAfterAuth]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });
  // console.log('redirectAfterAuth', redirectAfterAuth);
  const onSubmit = async (data: LoginFormData) => {
    const success = await login({
      email: data.email,
      password: data.password,
      remember: data.remember,
    });
    if (success) {
      setLoginSuccess(true);
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
              Entre em sua conta para continuar
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-700 font-medium">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          className="border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-700 font-medium">Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Sua senha"
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="remember"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-purple-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-purple-600">
                          Lembrar de mim
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  
                  <Link
                    to="/forgot-password"
                    className="text-sm text-purple-600 hover:text-purple-800 underline font-medium"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </Form>

            <div className="text-center text-sm mt-4">
              <span className="text-purple-600">Não tem uma conta? </span>
              <Link to="/public-client-form" className="text-purple-600 underline hover:text-purple-800 font-medium">
                Cadastre-se
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}