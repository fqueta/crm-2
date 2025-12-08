import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Form } from '@/components/ui/form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useComponentById, useCreateComponent, useUpdateComponent } from '@/hooks/components';
import { useContentTypesList } from '@/hooks/contentTypes';
import { CreateComponentInput } from '@/types/components';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { coursesService } from '@/services/coursesService';
import { PaginatedResponse } from '@/types';
import { uploadsService } from '@/services/uploadsService';
import type { UploadRecord } from '@/types/uploads';

/**
 * schema
 * pt-BR: Validação Zod para criação/edição de componentes CMS.
 * en-US: Zod validation for CMS component create/edit.
 */
const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo_conteudo: z.string().min(1, 'Tipo de conteúdo é obrigatório'),
  // ordenar
  // pt-BR: Coerção para string, aceitando números digitados e normalizando para string.
  // en-US: Coerce to string, accepting numeric input and normalizing to string.
  ordenar: z.coerce.string().optional(),
  short_code: z.string().min(1, 'Short code é obrigatório'),
  id_curso: z.string().optional(),
  ativo: z.enum(['s', 'n']).default('s'),
  obs: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

/**
 * SiteComponentsForm
 * pt-BR: Página dedicada para cadastro e edição de componentes CMS.
 * en-US: Dedicated page for create and edit CMS components.
 */
export default function SiteComponentsForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '',
      tipo_conteudo: '',
      ordenar: '',
      short_code: '',
      id_curso: '',
      ativo: 's',
      obs: '',
    },
  });

  const { data: record, isLoading: loadingRecord } = useComponentById(String(id || ''), { enabled: !!id });
  const createMutation = useCreateComponent();
  const updateMutation = useUpdateComponent();
  const { data: contentTypesResp, isLoading: loadingContentTypes } = useContentTypesList({ per_page: 100 });

  /**
   * fetchCourses
   * pt-BR: Busca cursos para popular o Select de cursos.
   * en-US: Fetch courses to populate the courses Select.
   */
  const coursesQuery = useQuery({
    queryKey: ['courses', 'list', { page: 1, per_page: 200 }],
    queryFn: async () => coursesService.listCourses({ page: 1, per_page: 200 }),
    staleTime: 5 * 60 * 1000,
  });
  const courseItems = ((coursesQuery.data as PaginatedResponse<any> | undefined)?.data) || [];

  /**
   * selectedTypeValue
   * pt-BR: Valor reativo do campo `tipo_conteudo`. Usa `watch` diretamente
   *        para garantir atualização imediata ao selecionar o tipo.
   * en-US: Reactive value of `tipo_conteudo`. Uses `watch` directly to ensure
   *        immediate updates when selecting the type.
   */
  const selectedTypeValue = String(form.watch('tipo_conteudo') ?? '');
  const selectedTypeLabel = useMemo(() => {
    const list = (contentTypesResp?.data || []) as any[];
    const item = list.find((opt: any) => String(opt.id ?? opt.value ?? opt.codigo) === String(selectedTypeValue || ''));
    const label = item ? (item.nome ?? item.name ?? item.descricao ?? item.titulo ?? '') : '';
    return String(label || '').trim();
  }, [contentTypesResp?.data, selectedTypeValue]);
  /**
   * isGallery
   * pt-BR: Exibe o card quando o valor selecionado for exatamente "19".
   * en-US: Show the card when selected value equals "19" exactly.
   */
  const isGallery = String(selectedTypeValue) === '19' || Number(selectedTypeValue) === 19;

  /**
   * uploadsQuery
   * pt-BR: Lista imagens enviadas (filtradas por componente quando houver ID) quando tipo = Galeria Completa.
   * en-US: Lists uploaded images (filtered by component when ID exists) when type = Galeria Completa.
   */
  const uploadsQuery = useQuery({
    queryKey: ['uploads', { id_componente: id }],
    queryFn: async () => uploadsService.listUploads(id ? { id_componente: id } : undefined),
    enabled: isGallery,
    staleTime: 60 * 1000,
  });

  /**
   * localPreviews
   * pt-BR: Previews locais antes/ao enviar (URLs revogadas após conclusão).
   * en-US: Local previews before/while uploading (URLs revoked after completion).
   */
  const [localPreviews, setLocalPreviews] = useState<{ url: string; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * handleFilesDrop
   * pt-BR: Trata arquivos soltos/selecionados, envia para `/uploads` e atualiza listagem.
   * en-US: Handles dropped/selected files, posts to `/uploads`, and refreshes list.
   */
  const handleFilesDrop = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;
    setIsUploading(true);
    try {
      // Gera previews locais
      const previews = arr.map((f) => ({ url: URL.createObjectURL(f), name: f.name }));
      setLocalPreviews((prev) => [...prev, ...previews]);

      // Envia cada arquivo
      for (const file of arr) {
        await uploadsService.uploadFile(file, id ? { id_componente: id } : undefined);
      }

      // Atualiza grid
      await uploadsQuery.refetch();
    } catch (err: any) {
      // Tratamento de erro de API: exibe mensagem retornada
      const apiMsg = err?.body?.message || err?.message || 'Falha ao enviar arquivo.';
      toast({
        title: 'Falha no upload',
        description: String(apiMsg),
        variant: 'destructive',
      });
    } finally {
      // Revoga object URLs e limpa previews
      setLocalPreviews((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.url));
        return [];
      });
      setIsUploading(false);
    }
  }, [id, uploadsQuery]);

  /**
   * hydrateForm
   * pt-BR: Preenche formulário ao carregar registro no modo edição.
   * en-US: Hydrates form when record loads in edit mode.
   */
  useEffect(() => {
    if (record) {
      form.reset({
        nome: record.nome || '',
        tipo_conteudo: record.tipo_conteudo || '',
        // pt-BR: Normaliza ordenar para string, evitando erro "Expected string, received number".
        // en-US: Normalize ordenar to string to avoid "Expected string, received number".
        ordenar: record.ordenar !== undefined && record.ordenar !== null ? String(record.ordenar) : '',
        short_code: record.short_code || '',
        id_curso: record.id_curso || '',
        ativo: record.ativo || 's',
        obs: record.obs || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record?.id]);

  /**
   * handleSubmit
   * pt-BR: Cria ou atualiza o componente e retorna à listagem.
   * en-US: Creates or updates the component then navigates back to list.
   */
  const handleSubmit = (data: FormData) => {
    const payload: CreateComponentInput = { ...data };
    if (id) {
      updateMutation.mutate({ id: String(id), data: payload }, {
        onSuccess: () => navigate('/admin/site/conteudo-site'),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => navigate('/admin/site/conteudo-site'),
      });
    }
  };

  const goBack = () => navigate('/admin/site/conteudo-site');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{id ? 'Editar componente' : 'Cadastrar componente'}</h1>
          <p className="text-muted-foreground">Endpoint: <code>/componentes</code> — Rota: <code>/admin/site/conteudo-site{id ? `/${id}/edit` : '/create'}</code></p>
        </div>
        <Button variant="outline" onClick={goBack}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar para listagem</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do componente</CardTitle>
          <CardDescription>Preencha os campos abaixo</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRecord && id ? (
            <div className="flex items-center gap-2 text-gray-600"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="nome" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="Nome do componente" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField name="tipo_conteudo" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de conteúdo</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingContentTypes ? 'Carregando...' : 'Selecione o tipo'} />
                      </SelectTrigger>
                      <SelectContent>
                        {(contentTypesResp?.data || []).
                          filter((opt: any) => opt && (opt.id ?? opt.value ?? opt.codigo) !== undefined).
                          map((opt: any) => {
                            const value = String(opt.id ?? opt.value ?? opt.codigo);
                            const label = opt.nome ?? opt.name ?? opt.descricao ?? opt.titulo ?? value;
                            return (
                              <SelectItem key={value} value={value}>{String(label)}</SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField name="ordenar" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordenar</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} placeholder="Ex.: 67" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField name="short_code" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder="Ex.: declaracao_pi_ppa"
                        onChange={(e) => {
                          // pt-BR: Normaliza substituindo espaços por '_'.
                          // en-US: Normalize by replacing spaces with '_'.
                          const normalized = e.target.value.replace(/\s+/g, '_');
                          field.onChange(normalized);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField name="id_curso" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Curso</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={coursesQuery.isLoading ? 'Carregando...' : 'Selecione o curso'} />
                      </SelectTrigger>
                      <SelectContent>
                        {courseItems.map((c: any) => {
                          const value = String(c.id);
                          const label = String(c.nome ?? c.name ?? value);
                          return (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField name="ativo" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ativo</FormLabel>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={field.value === 's'}
                        onCheckedChange={(val) => field.onChange(val ? 's' : 'n')}
                      />
                      <span className="text-sm text-muted-foreground">{field.value === 's' ? 'Sim' : 'Não'}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField name="obs" control={form.control} render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Observações (HTML)</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Digite conteúdo HTML formatado..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {isGallery && (
                  <div className="md:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Galeria de imagens</CardTitle>
                        <CardDescription>
                          Envie e gerencie imagens para este componente.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {/* Dropzone simples com preview local e suporte a múltiplos arquivos */}
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isUploading ? 'opacity-60 cursor-wait' : 'hover:border-gray-400'}`}
                          onDragOver={(e) => { e.preventDefault(); }}
                          onDrop={(e) => { e.preventDefault(); handleFilesDrop(e.dataTransfer.files); }}
                          onClick={() => {
                            const input = document.getElementById('gallery-file-input') as HTMLInputElement | null;
                            input?.click();
                          }}
                        >
                          <p className="text-sm text-muted-foreground">Clique ou arraste arquivos aqui</p>
                          <p className="text-xs text-muted-foreground">Apenas imagens. Suporta múltiplos envios.</p>
                          <input
                            id="gallery-file-input"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => e.target.files && handleFilesDrop(e.target.files)}
                          />
                        </div>

                        {/* Previews locais em envio */}
                        {localPreviews.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            {localPreviews.map((p) => (
                              <div key={p.url} className="rounded-md overflow-hidden border">
                                <img src={p.url} alt={p.name} className="w-full h-32 object-cover" />
                                <div className="px-2 py-1 text-xs truncate">{p.name}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Lista de imagens existentes */}
                        <div className="mt-6">
                          <h3 className="text-sm font-medium">Imagens enviadas</h3>
                          {uploadsQuery.isLoading && (
                            <div className="text-sm text-muted-foreground mt-2">Carregando imagens...</div>
                          )}
                          {!uploadsQuery.isLoading && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                              {((uploadsQuery.data?.data as UploadRecord[]) || []).map((u) => (
                                <div key={u.id} className="rounded-md overflow-hidden border">
                                  <img src={u.url} alt={u.nome} className="w-full h-32 object-cover" />
                                  <div className="px-2 py-1 text-xs truncate">{u.nome}</div>
                                </div>
                              ))}
                              {(!uploadsQuery.data || (uploadsQuery.data?.data || []).length === 0) && (
                                <div className="text-sm text-muted-foreground col-span-full">Nenhuma imagem encontrada.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <div className="md:col-span-2 flex gap-3">
                  <Button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
                    {(createMutation.isLoading || updateMutation.isLoading) && (<Loader2 className="mr-2 h-4 w-4 animate-spin" />)}
                    {id ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                  <Button type="button" variant="outline" onClick={goBack}>Cancelar</Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}