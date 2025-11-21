import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';

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

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      await authService.forgotPassword({ email: data.email });
      setEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
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

  if (emailSent) {
    return (
      <AuthLayout 
        title="Email Enviado" 
        subtitle="Verifique sua caixa de entrada"
      >
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Enviamos um link para redefinir sua senha para o email fornecido.
          </p>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link to="/login">Voltar ao Login</Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setEmailSent(false)}
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Recuperar Senha" 
      subtitle="Digite seu email para redefinir sua senha"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    {...field}
                  />
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
            {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
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