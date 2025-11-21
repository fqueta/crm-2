import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { authService } from '@/services/authService';
import { toast } from '@/hooks/use-toast';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Senhas não coincidem",
  path: ["password_confirmation"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      password_confirmation: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!email || !token) {
      toast({
        title: "Erro",
        description: "Link de recuperação inválido.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await authService.resetPassword({
        email,
        token,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      
      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi redefinida com sucesso. Faça login com sua nova senha.",
      });
      
      navigate('/login');
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <AuthLayout title="Link Inválido">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            O link de recuperação de senha é inválido ou expirou.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link to="/forgot-password">Solicitar Novo Link</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/login">Voltar ao Login</Link>
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Nova Senha" 
      subtitle="Digite sua nova senha"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nova Senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua nova senha"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password_confirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar Nova Senha</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPasswordConfirmation ? 'text' : 'password'}
                      placeholder="Confirme sua nova senha"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                    >
                      {showPasswordConfirmation ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <Link to="/login" className="text-primary hover:underline">
          Voltar ao Login
        </Link>
      </div>
    </AuthLayout>
  );
}