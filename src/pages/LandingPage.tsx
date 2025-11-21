import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Gift, Plus, Star, Users, Zap, ArrowRight, CheckCircle, User, LogOut, Settings, ChevronDown, Monitor } from "lucide-react";
import { Link } from "react-router-dom";
import { LoginRedirectLink } from "@/components/auth/LoginRedirectLink";
import { useAuth } from "@/contexts/AuthContext";
import { PointsStoreProps } from "@/types/products";
import { GenericApiService } from "@/services/GenericApiService";
import { toast } from "@/hooks/use-toast";
/**
 * Landing page component for Yellow Benefits Club
 * Features modern design with Yellow brand colors (yellow and purple)
 */
const LandingPage = ({ linkLoja }: PointsStoreProps) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoadingSmartlink, setIsLoadingSmartlink] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  console.log('user:', user);

  /**
   * Handle user logout
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  // Fazer requisição na API para solicitar um smartlink do clube de pontos
  const hadleStartAlloyal = async () => {
    setIsLoadingSmartlink(true);
    try {
      // Verificar se o usuário está logado e possui CPF
      if (!user?.cpf) {
        toast({
          title: "Erro",
          description: "CPF não encontrado. Faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      // Criar instância do GenericApiService para smartlink
      const smartlinkService = new GenericApiService('/smartlink');
      
      // Fazer requisição GET para /api/v1/smartlink/{cpf_user}
      const response = await smartlinkService.customGet(`/${user.cpf}`);
      
      // Verificar se a resposta contém exec e web_smart_link válidos
      if (response.exec && response.data?.web_smart_link && response.data.web_smart_link.trim() !== '') {
        // Redirecionar para o link do smartlink
        window.location.href = response.data.web_smart_link;
      } else {
        // Exibir erro se o smartlink não estiver disponível
        toast({
          title: "Erro",
          description: "Clube indisponível entre em contato com o suporte!",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao solicitar smartlink:', error);
      toast({
        title: "Erro",
        description: "Clube indisponível entre em contato com o suporte!",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSmartlink(false);
    }
  };
  const permission_id:any = user?.permission_id;
  // console.log('permission_id:', permission_id);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-yellow-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
              <img src="/logo-yellow.jpg" alt="yellow logo" className="h-16" />
            <div>
              <h1 className="text-2xl font-bold text-purple-700">Yellow</h1>
              <p className="text-sm text-purple-600">Benefits Company</p>
            </div>
          </div>
          <div className="flex space-x-4">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                    <User className="w-4 h-4 mr-2" />
                    {user.name}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {permission_id <= 5 && (
                    <>
                      <DropdownMenuLabel>Painel Administrativo</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center">
                          <Monitor className="mr-2 h-4 w-4" />
                          Acessar painel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={linkLoja} className="flex items-center">
                      <Gift className="mr-2 h-4 w-4" />
                      Loja de Pontos
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={linkLoja + '/area-cliente'} className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Área do Cliente
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={linkLoja + '/meus-resgates'} className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Meus Resgates
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? 'Saindo...' : 'Sair'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="outline" asChild className="border-purple-300 text-purple-700 hover:bg-purple-50">
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button asChild className="bg-purple-700 hover:bg-purple-800">
                  <Link to="/public-client-form">Cadastrar</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="mb-8">
            {/* <Badge className="bg-yellow-400 text-purple-700 hover:bg-yellow-500 mb-4">
              🎉 Clube de Vantagens Exclusivo
            </Badge> */}
            <h1 className="text-5xl md:text-5xl font-bold text-purple-800 mb-6">
              Bem-vindo ao
              <span className="text-yellow-500 block">Club de Vantagens Yellow</span>
            </h1>
            <p className="text-xl text-purple-600 mb-8 max-w-2xl mx-auto">
              Aqui você tem acesso ao programa de pontos Antena+  —  a Rede Credenciada Oi TV. Suas conquistas valem pontos que podem ser trocados por prêmios incríveis. 🎁
            </p>
            <p className="text-xl text-purple-600 mb-8 max-w-2xl mx-auto">
              E tem mais: por fazer parte da Rede Antena+, você também aproveita as vantagens do Yellow Club, com cashback e descontos nas melhores lojas do país. 
            </p>            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/50">
        <div className="container mx-auto">
          {/* <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-purple-800 mb-4">Por que escolher o Yellow Club?</h2>
            <p className="text-xl text-purple-600 max-w-2xl mx-auto">
              Oferecemos uma experiência única de benefícios e recompensas pensada especialmente para você.
            </p>
          </div> */}
          {/* <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <Button size="lg" className="bg-purple-700 hover:bg-purple-800 text-white" asChild>
                  <Link to="/public-client-form">
                    Começar Agora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  onClick={hadleStartAlloyal} 
                  disabled={isLoadingSmartlink}
                  className="bg-purple-700 hover:bg-purple-800 text-white px-8 py-4 text-lg font-semibold"
                >
                  {isLoadingSmartlink ? 'Carregando...' : 'Clube de Vantagens'}
                  {!isLoadingSmartlink && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              )}
              {isAuthenticated && (
                <Button size="lg" variant="outline" className="border-yellow-400 text-purple-700 hover:bg-yellow-50" asChild>
                  <LoginRedirectLink to={linkLoja} requireAuth={true}>
                    Explorar Loja 
                    <Gift className="ml-2 h-5 w-5" />
                  </LoginRedirectLink>
                </Button>
              )}
          </div> */}
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-yellow-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                 <div className="rounded-full flex items-center justify-center mx-auto mb-4">
                   <img src="/oi tv verde e preto.png" alt="oitv logo" className="h-20 w-20" />
                 </div>
                <CardTitle className="text-green-700">Trocar Pontos Antena +</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-purple-600">
                  {isAuthenticated && (
                    <Button size="lg" variant="outline" className="bg-green-700 text-white border-green-400 hover:bg-green-50" asChild>
                      <LoginRedirectLink to={linkLoja} requireAuth={true}>
                        Acessar
                        <Gift className="ml-2 h-5 w-5" />
                      </LoginRedirectLink>
                    </Button>
                  )}
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-purple-700" />
                </div>
                <CardTitle className="text-purple-800">Explorar Cashback e Descontos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-purple-600">
                  {!isAuthenticated ? (
                      <Button size="lg" className="bg-purple-700 hover:bg-purple-800 text-white" asChild>
                        <Link to="/public-client-form">
                          Começar Agora
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                      </Button>
                    ) : (
                      <Button 
                        size="lg" 
                        onClick={hadleStartAlloyal} 
                        disabled={isLoadingSmartlink}
                        className="bg-purple-700 hover:bg-purple-800 text-white px-8 py-4 text-sm font-semibold"
                      >
                        {isLoadingSmartlink ? 'Carregando...' : 'Acessar'}
                        {!isLoadingSmartlink && <ArrowRight className="ml-2 h-5 w-5" />}
                      </Button>
                    )}
                </CardDescription>
              </CardContent>
            </Card>

            {/* <Card className="border-yellow-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-8 w-8 text-purple-700" />
                </div>
                <CardTitle className="text-purple-800">Benefícios Instantâneos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-purple-600">
                  Aproveite descontos imediatos, frete grátis e condições especiais desde o primeiro dia como membro.
                </CardDescription>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-700 to-purple-800">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Pronto para começar sua jornada?</h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Para acessar e aproveitar os benefícios do Antena+ e do Clube Yellow, é importante saber:
          </p>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            1 - É necessário ser um Antenista credenciado Oi TV.
          </p>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            2 - Você deve ter realizado a primeira transferência de pontos para o cliente Yellow pelo Portal do Antenista Oi TV: <a target="_blank" href="https://parceiros.oitv.net/" className="text-yellow-400 hover:underline">https://parceiros.oitv.net/</a>
          </p>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            3 - E, por fim, fazer um cadastro simples no Clube Yellow para começar a aproveitar todas as vantagens.
          </p>
           {!isAuthenticated && (
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            👉 Clique no botão abaixo e cadastre-se gratuitamente para iniciar sua jornada!
          </p>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated && (
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-purple-800" asChild>
                <Link to="/public-client-form">
                  Cadastrar Gratuitamente
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
            {/* <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-800" asChild>
              <LoginRedirectLink to="/loja" requireAuth={true}>Explorar Produtos</LoginRedirectLink>
            </Button> */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-purple-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-purple-700 font-bold">Y</span>
                </div>
                <div>
                  <h3 className="font-bold">Yellow</h3>
                  <p className="text-sm text-purple-300">Benefits Company</p>
                </div>
              </div>
              <p className="text-purple-300 text-sm">
                Transformando cada compra em uma oportunidade de economia e recompensa.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produtos</h4>
              <ul className="space-y-2 text-sm text-purple-300">
                <li><LoginRedirectLink to={linkLoja} requireAuth={true} className="hover:text-yellow-400">Loja de Pontos</LoginRedirectLink></li>
                <li><Link to="/public-client-form" className="hover:text-yellow-400">Cadastro</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Fale conosco</h4>
              <ul className="space-y-2 text-sm text-purple-300">
                <li>contato@yellowbc.com.br</li>
                <li>
                  <a 
                    href="https://wa.me/553208000004338?text=" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-yellow-400 transition-colors"
                  >
                    <svg 
                      className="w-4 h-4" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
                    </svg>
                    0800 000 4338
                  </a>
                </li>
                {/* <li><a href="#" className="hover:text-yellow-400">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-yellow-400">Contato</a></li> */}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-purple-300">
                <li><a href="#" className="hover:text-yellow-400">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-yellow-400">Política de Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-purple-800 mt-8 pt-8 text-center text-sm text-purple-300">
            <p>&copy; {new Date().getFullYear()} Yellow Benefits Company. Todos os direitos reservados.</p> 
            <p>Desenvolvido por <a href="https://mastertechbr.com/" target="_blank">Mastertech</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;