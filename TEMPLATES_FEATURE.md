# Funcionalidade: Mensagens Pré-Programadas (Templates)

## Visão Geral

Esta funcionalidade permite criar, gerenciar e utilizar templates de mensagens rápidas (quick replies) no painel WhatsApp. Os templates podem conter variáveis dinâmicas que são substituídas automaticamente por dados do lead.

## Status: ✅ IMPLEMENTADO

Data de implementação: 2025-01-20

## Arquitetura

### 1. Banco de Dados

#### Tabela: `message_templates`

```sql
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  variables TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Campos:**
- `id`: Identificador único do template
- `title`: Título/nome do template
- `content`: Conteúdo da mensagem (suporta variáveis `{{nome}}`, `{{telefone}}`, etc)
- `category`: Categoria para organização (Atendimento, Vendas, Suporte, etc)
- `variables`: Array com nomes das variáveis usadas no template
- `created_at`: Data de criação
- `updated_at`: Data da última atualização (auto-atualizada via trigger)

**Migração SQL:** `supabase/migrations/20250120_create_message_templates.sql`

### 2. API Routes

#### GET `/api/templates`
Lista todos os templates ordenados por categoria e título.

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "title": "Boas-vindas",
      "content": "Olá {{nome}}! Como posso ajudá-lo?",
      "category": "Atendimento",
      "variables": ["nome"],
      "created_at": "2025-01-20T...",
      "updated_at": "2025-01-20T..."
    }
  ]
}
```

#### POST `/api/templates`
Cria um novo template.

**Request Body:**
```json
{
  "title": "Título do Template",
  "content": "Conteúdo com {{variavel}}",
  "category": "Categoria Opcional"
}
```

**Features:**
- Extrai automaticamente variáveis do conteúdo (padrão `{{variavel}}`)
- Validação de campos obrigatórios (title, content)

#### PUT `/api/templates/[id]`
Atualiza um template existente.

**Request Body:**
```json
{
  "title": "Novo Título",
  "content": "Novo conteúdo {{nome}}",
  "category": "Nova Categoria"
}
```

#### DELETE `/api/templates/[id]`
Remove um template.

### 3. Componentes React

#### `TemplateSelector` (`src/components/template-selector.tsx`)

**Uso:** Seletor de templates integrado no chat para respostas rápidas.

**Props:**
```typescript
interface TemplateSelectorProps {
  onSelectTemplate: (content: string) => void
  leadData?: Lead  // Dados do lead para substituição de variáveis
}
```

**Funcionalidades:**
- Botão com ícone de arquivo na barra de chat
- Popover com busca e filtros
- Templates agrupados por categoria
- Preview do conteúdo
- Badges de variáveis
- Substituição automática de variáveis com dados do lead
- Busca em tempo real (título, conteúdo, categoria)

**Variáveis Suportadas:**
- `{{nome}}` - Nome do lead
- `{{telefone}}` - Telefone do lead
- `{{interesse}}` - Interesse do lead
- Todas as propriedades do objeto Lead

#### `TemplateManager` (`src/components/template-manager.tsx`)

**Uso:** Página de gerenciamento completo de templates.

**Funcionalidades:**
- Tabela com todos os templates
- Botão "Novo Template"
- Modal para criar/editar templates
- Validação de campos
- Feedback visual (loading, sucesso, erro)
- Confirmação antes de excluir
- Exibição de variáveis usadas em cada template
- Categorização visual

**Campos do Formulário:**
- Título (obrigatório)
- Categoria (opcional)
- Conteúdo (obrigatório, suporta `{{variavel}}`)

### 4. Página

**Route:** `/templates`

Página dedicada ao gerenciamento de templates acessível pela sidebar.

### 5. Tipos TypeScript

```typescript
// src/lib/types.ts
export type MessageTemplate = {
  id: string
  title: string
  content: string
  category: string | null
  variables: string[]
  created_at: string
  updated_at: string
}
```

## Como Usar

### Para Usuários Finais

#### 1. Criar um Template

1. Acesse **Mensagens Rápidas** no menu lateral
2. Clique em **Novo Template**
3. Preencha:
   - **Título**: Nome descritivo (ex: "Boas-vindas")
   - **Categoria**: Organização opcional (ex: "Atendimento")
   - **Conteúdo**: Mensagem com variáveis opcionais
4. Clique em **Criar**

**Exemplo de Conteúdo:**
```
Olá {{nome}}! 👋

Obrigado por entrar em contato. Como posso ajudá-lo hoje?

Estamos à disposição no {{telefone}}.
```

#### 2. Usar Template no Chat

1. Abra uma conversa
2. Clique no ícone de **arquivo** (📄) ao lado do campo de mensagem
3. Busque ou selecione o template desejado
4. O conteúdo será inserido no campo de mensagem com variáveis substituídas automaticamente
5. Edite se necessário e envie

#### 3. Editar Template

1. Acesse **Mensagens Rápidas**
2. Clique no ícone de **editar** (✏️) na linha do template
3. Faça as alterações
4. Clique em **Salvar**

#### 4. Excluir Template

1. Acesse **Mensagens Rápidas**
2. Clique no ícone de **lixeira** (🗑️)
3. Confirme a exclusão

### Para Desenvolvedores

#### Adicionar Nova Variável

1. Certifique-se que o campo existe no tipo `Lead` (`src/lib/types.ts`)
2. A variável estará automaticamente disponível como `{{nome_do_campo}}`
3. A substituição é feita automaticamente no `TemplateSelector`

#### Customizar Categorias

As categorias são livres (text field). Para criar um select com opções fixas:

1. Edite `src/components/template-manager.tsx`
2. Substitua o `<Input>` de categoria por um `<Select>`:

```tsx
<Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
  <SelectTrigger>
    <SelectValue placeholder="Selecione uma categoria" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="Atendimento">Atendimento</SelectItem>
    <SelectItem value="Vendas">Vendas</SelectItem>
    <SelectItem value="Suporte">Suporte</SelectItem>
  </SelectContent>
</Select>
```

## Exemplos de Templates

### 1. Boas-vindas
```
Categoria: Atendimento
Conteúdo: Olá {{nome}}! 👋 Bem-vindo(a) à nossa empresa. Como posso ajudá-lo(a) hoje?
```

### 2. Horário de Funcionamento
```
Categoria: Informações
Conteúdo: Nosso horário de atendimento é de segunda a sexta-feira, das 9h às 18h. Aos sábados, das 9h às 12h.
```

### 3. Follow-up
```
Categoria: Vendas
Conteúdo: Olá {{nome}}! Vi que você tinha interesse em nossos produtos. Posso ajudar com mais alguma informação?
```

### 4. Agradecimento
```
Categoria: Atendimento
Conteúdo: Obrigado por entrar em contato, {{nome}}! Estamos à disposição para qualquer dúvida. 😊
```

## Instalação e Deploy

### 1. Executar Migração SQL

```bash
# Via Supabase CLI
supabase db push

# Ou manualmente no Dashboard do Supabase
# SQL Editor > Copiar conteúdo de supabase/migrations/20250120_create_message_templates.sql > Run
```

### 2. Verificar Dependências

Todas as dependências já estão instaladas:
- `@supabase/ssr` - Para server-side Supabase
- `@supabase/supabase-js` - Cliente Supabase
- `lucide-react` - Ícones

### 3. Build e Deploy

```bash
npm run build
npm start

# Ou deploy em produção (Vercel, etc)
```

## Componentes UI Criados

Os seguintes componentes UI foram criados para suportar esta funcionalidade:

- `src/components/ui/button.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/scroll-area.tsx`

Estes componentes são reutilizáveis em outras partes do projeto.

## Melhorias Futuras Sugeridas

- [ ] **Atalhos de teclado**: Usar `/` para abrir templates
- [ ] **Favoritos**: Marcar templates mais usados
- [ ] **Histórico de uso**: Ordenar por frequência de uso
- [ ] **Preview antes de enviar**: Visualizar mensagem completa
- [ ] **Templates compartilhados**: Templates por usuário vs globais
- [ ] **Importação/Exportação**: Backup de templates em JSON
- [ ] **Editor rico**: Formatação (negrito, itálico, emojis)
- [ ] **Variáveis condicionais**: `{{nome|Cliente}}` (fallback se vazio)
- [ ] **Templates multilíngue**: Suporte a múltiplos idiomas
- [ ] **Analytics**: Rastrear templates mais usados

## Troubleshooting

### Templates não aparecem no chat

1. Verifique se a migração SQL foi executada
2. Confirme que há templates criados em `/templates`
3. Verifique o console do navegador para erros de API

### Variáveis não são substituídas

1. Certifique-se que o formato é `{{variavel}}` (chaves duplas)
2. Verifique se a propriedade existe no objeto Lead
3. Confirme que o lead está carregado na conversa (`conversation?.lead`)

### Erro ao criar template

1. Verifique conexão com Supabase
2. Confirme que as credenciais estão corretas no `.env.local`
3. Verifique permissões da tabela no Supabase (RLS policies)

## Segurança

- ✅ Validação de campos obrigatórios no backend
- ✅ Sanitização automática de inputs
- ✅ Proteção contra XSS (variáveis são escapadas)
- ⚠️ **Importante**: Configure Row Level Security (RLS) no Supabase para limitar acesso aos templates

### Exemplo de RLS Policy

```sql
-- Permitir apenas usuários autenticados
CREATE POLICY "Usuários autenticados podem ler templates"
ON message_templates FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem criar templates"
ON message_templates FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar templates"
ON message_templates FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Usuários autenticados podem deletar templates"
ON message_templates FOR DELETE
TO authenticated
USING (true);
```

## Arquivos Criados/Modificados

### Novos Arquivos
```
supabase/migrations/20250120_create_message_templates.sql
src/lib/supabase/server.ts
src/app/api/templates/route.ts
src/app/api/templates/[id]/route.ts
src/app/templates/page.tsx
src/components/template-selector.tsx
src/components/template-manager.tsx
src/components/ui/button.tsx
src/components/ui/dialog.tsx
src/components/ui/input.tsx
src/components/ui/textarea.tsx
src/components/ui/label.tsx
src/components/ui/table.tsx
src/components/ui/popover.tsx
src/components/ui/scroll-area.tsx
TEMPLATES_FEATURE.md
```

### Arquivos Modificados
```
src/lib/types.ts (adicionado tipo MessageTemplate)
src/components/chat-view.tsx (integração do TemplateSelector)
src/components/sidebar.tsx (adicionado link para /templates)
```

## Licença

Este código é parte do projeto Painel WhatsApp v3.

---

**Desenvolvido por**: Claude Sonnet 4.5
**Data**: 2025-01-20
