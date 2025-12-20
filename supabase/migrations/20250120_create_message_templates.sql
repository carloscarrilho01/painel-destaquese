-- Criar tabela para templates de mensagens
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  variables TEXT[], -- Array de variáveis usadas no template (ex: ['nome', 'telefone'])
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category);

-- Criar índice para busca por título
CREATE INDEX IF NOT EXISTS idx_message_templates_title ON message_templates(title);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_message_templates_updated_at();

-- Inserir alguns templates de exemplo
INSERT INTO message_templates (title, content, category, variables) VALUES
  (
    'Boas-vindas',
    'Olá {{nome}}! 👋 Bem-vindo(a) à nossa empresa. Como posso ajudá-lo(a) hoje?',
    'Atendimento',
    ARRAY['nome']
  ),
  (
    'Horário de Funcionamento',
    'Nosso horário de atendimento é de segunda a sexta-feira, das 9h às 18h. Aos sábados, das 9h às 12h.',
    'Informações',
    ARRAY[]::TEXT[]
  ),
  (
    'Agradecimento',
    'Obrigado por entrar em contato, {{nome}}! Estamos à disposição para qualquer dúvida. 😊',
    'Atendimento',
    ARRAY['nome']
  ),
  (
    'Solicitação de Dados',
    'Para prosseguir com seu atendimento, preciso de algumas informações: nome completo, CPF e endereço.',
    'Atendimento',
    ARRAY[]::TEXT[]
  ),
  (
    'Confirmação de Pedido',
    'Seu pedido foi confirmado com sucesso! 🎉 Em breve você receberá os detalhes no e-mail cadastrado.',
    'Vendas',
    ARRAY[]::TEXT[]
  ),
  (
    'Follow-up',
    'Olá {{nome}}! Vi que você tinha interesse em nossos produtos. Posso ajudar com mais alguma informação?',
    'Vendas',
    ARRAY['nome']
  );
