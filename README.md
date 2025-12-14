# Painel WhatsApp v3

Dashboard de monitoramento e atendimento para agente WhatsApp com integração n8n.

## Recursos

- 📊 **Dashboard**: Estatísticas de conversas, mensagens e leads
- 💬 **Conversas**: Visualização completa do histórico de conversas
- ✉️ **Envio de Mensagens**: Responder conversas diretamente pelo painel (via webhook n8n)
- 🎤 **Envio de Áudio**: Gravar áudio ou enviar arquivo de áudio (NOVO!)
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

### 2. Configurar Webhook n8n (Opcional - para envio de mensagens e áudio)

Adicione no `.env.local`:

```env
N8N_WEBHOOK_URL=https://seu-n8n.app.n8n.cloud/webhook/send-whatsapp
```

**Documentação completa:**
- [`N8N_WEBHOOK_SETUP.md`](./N8N_WEBHOOK_SETUP.md) - Configuração webhook para texto
- [`AUDIO_SETUP.md`](./AUDIO_SETUP.md) - Configuração completa para envio de áudio

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

### Enviar Mensagens de Texto

1. **Configure o webhook n8n** (veja seção anterior)
2. **Acesse a aba Conversas** (`/conversas`)
3. **Selecione uma conversa** na lista lateral
4. **Digite sua mensagem** no campo inferior
5. **Pressione Enter** ou clique em "Enviar"
6. A mensagem será enviada via webhook para o n8n, que processará e enviará para o WhatsApp

### Enviar Áudio (NOVO!)

**Opção 1: Gravar Áudio**
1. **Configure Supabase Storage** (veja [`AUDIO_SETUP.md`](./AUDIO_SETUP.md))
2. **Clique no ícone do microfone** 🎤
3. **Permita acesso ao microfone** (primeira vez)
4. **Fale sua mensagem**
5. **Clique em Parar** (quadrado vermelho)
6. **Ouça o preview** e clique em **Enviar** ou **Descartar**

**Opção 2: Enviar Arquivo de Áudio**
1. **Clique no ícone de anexo** 📎
2. **Selecione arquivo de áudio** (MP3, OGG, WAV, WEBM, MP4)
3. **Ouça o preview** e clique em **Enviar arquivo**

### Funcionalidades

- ✅ Envio instantâneo com feedback visual (sucesso/erro)
- ✅ Suporte a Enter para enviar (Shift+Enter para nova linha)
- ✅ Gravação de áudio direto do navegador
- ✅ Upload de arquivos de áudio (até 10MB)
- ✅ Preview de áudio antes de enviar
- ✅ Indicador de carregamento durante envio
- ✅ Validação de campos obrigatórios
- ✅ Timeout de 10 segundos para webhook

## Estrutura do Projeto

```
src/
├── app/
│   ├── api/
│   │   ├── send-message/      # API route para envio de mensagens
│   │   └── upload-audio/      # API route para upload de áudio (NOVO)
│   ├── conversas/             # Página de conversas
│   ├── leads/                 # Página de leads
│   ├── configuracoes/         # Página de configurações
│   └── page.tsx               # Dashboard
├── components/
│   ├── audio-recorder.tsx     # Componente de gravação de áudio (NOVO)
│   ├── file-uploader.tsx      # Componente de upload de arquivo (NOVO)
│   ├── chat-view.tsx          # Visualizador de chat (com envio)
│   ├── conversation-list.tsx  # Lista de conversas
│   ├── leads-table.tsx        # Tabela de leads
│   └── sidebar.tsx            # Menu lateral
└── lib/
    ├── supabase.ts            # Cliente Supabase
    └── types.ts               # Tipos TypeScript
```

## Deploy na Vercel

### Guia Rápido (5 minutos)

Consulte [`DEPLOY_QUICKSTART.md`](./DEPLOY_QUICKSTART.md) para deploy rápido.

### Guia Completo

Consulte [`DEPLOY.md`](./DEPLOY.md) para instruções detalhadas de deploy, incluindo:
- Configuração de variáveis de ambiente
- Domínio customizado
- Monitoramento e logs
- Otimizações de produção
- Troubleshooting

**Deploy automático:** Configurado via Vercel Git Integration

## Documentação

### Guias de Configuração
- [`README.md`](./README.md) - Este arquivo (documentação geral)
- [`DEPLOY_QUICKSTART.md`](./DEPLOY_QUICKSTART.md) - Deploy rápido na Vercel (5 min)
- [`DEPLOY.md`](./DEPLOY.md) - Guia completo de deploy
- [`AUDIO_SETUP.md`](./AUDIO_SETUP.md) - Configuração completa de envio de áudio
- [`QUICKSTART.md`](./QUICKSTART.md) - Início rápido com áudio (5 min)
- [`N8N_WEBHOOK_SETUP.md`](./N8N_WEBHOOK_SETUP.md) - Configuração webhook n8n
- [`REALTIME_SETUP.md`](./REALTIME_SETUP.md) - Configuração Supabase Realtime

### Referência
- [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) - Solução de problemas
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) - Arquitetura do sistema
- [`CHANGELOG_AUDIO.md`](./CHANGELOG_AUDIO.md) - Histórico de implementação de áudio
