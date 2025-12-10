# Painel WhatsApp v3

Dashboard de monitoramento e atendimento para agente WhatsApp com integração n8n.

## Recursos

- 📊 **Dashboard**: Estatísticas de conversas, mensagens e leads
- 💬 **Conversas**: Visualização completa do histórico de conversas
- ✉️ **Envio de Mensagens**: Responder conversas diretamente pelo painel (via webhook n8n)
- 👥 **Gestão de Leads**: Gerenciamento de leads com filtros e busca
- ⚡ **Atualização em Tempo Real**: Supabase Realtime para conversas que atualizam automaticamente
- 🔔 **Notificações Visuais**: Indicador quando nova mensagem chega
- 📜 **Auto-scroll**: Scroll automático para novas mensagens
- 🎨 **UI Dark Mode**: Interface moderna inspirada no WhatsApp Web

## Tecnologias

- **Next.js 16** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Estilização
- **Supabase** - Backend e banco de dados PostgreSQL
- **n8n** - Automação e webhook para envio de mensagens
- **Lucide React** - Ícones

## Getting Started

Primeiro, instale as dependências e rode o servidor de desenvolvimento:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Configuração

### 1. Configurar Supabase

Crie o arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

**Como obter as credenciais:**
1. Acesse o [Supabase](https://supabase.com)
2. Selecione seu projeto
3. Vá em Settings > API
4. Copie a URL e a chave anon (pública)

### 2. Configurar Webhook n8n (Opcional - para envio de mensagens)

Adicione no `.env.local`:

```env
N8N_WEBHOOK_URL=https://seu-n8n.app.n8n.cloud/webhook/send-whatsapp
```

**Documentação completa:** Consulte [`N8N_WEBHOOK_SETUP.md`](./N8N_WEBHOOK_SETUP.md) para instruções detalhadas.

### 3. Ativar Supabase Realtime (IMPORTANTE - para atualização automática)

Para que as conversas atualizem automaticamente sem recarregar a página:

1. Acesse o Supabase > **Database** > **Replication**
2. Ative **Enable Realtime** na tabela `chats`
3. (Opcional) Ative também na tabela `leads`

**Documentação completa:** Consulte [`REALTIME_SETUP.md`](./REALTIME_SETUP.md) para instruções detalhadas.

### 4. Estrutura das Tabelas no Supabase

#### Tabela: `chats`
```sql
CREATE TABLE chats (
  id int4 PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  session_id varchar NOT NULL,
  message jsonb NOT NULL
);
```

#### Tabela: `leads`
```sql
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone text NOT NULL,
  nome text,
  trava bool DEFAULT false,
  created_at timestamptz DEFAULT now(),
  followup int4 DEFAULT 0,
  last_followup timestamptz,
  interesse text,
  interessado bool DEFAULT false
);
```

## Como Usar

### Enviar Mensagens pelo Painel

1. **Configure o webhook n8n** (veja seção anterior)
2. **Acesse a aba Conversas** (`/conversas`)
3. **Selecione uma conversa** na lista lateral
4. **Digite sua mensagem** no campo inferior
5. **Pressione Enter** ou clique em "Enviar"
6. A mensagem será enviada via webhook para o n8n, que processará e enviará para o WhatsApp

### Funcionalidades

- ✅ Envio instantâneo com feedback visual (sucesso/erro)
- ✅ Suporte a Enter para enviar (Shift+Enter para nova linha)
- ✅ Indicador de carregamento durante envio
- ✅ Validação de campos obrigatórios
- ✅ Timeout de 10 segundos para webhook

## Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   └── send-message/     # API route para envio de mensagens
│   ├── conversas/             # Página de conversas
│   ├── leads/                 # Página de leads
│   ├── configuracoes/         # Página de configurações
│   └── page.tsx               # Dashboard
├── components/
│   ├── chat-view.tsx          # Visualizador de chat (com envio)
│   ├── conversation-list.tsx  # Lista de conversas
│   ├── leads-table.tsx        # Tabela de leads
│   └── sidebar.tsx            # Menu lateral
└── lib/
    ├── supabase.ts            # Cliente Supabase
    └── types.ts               # Tipos TypeScript
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
