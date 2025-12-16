-- =============================================
-- TABELA: quick_messages (Mensagens Rápidas)
-- =============================================
-- Execute este SQL no Supabase SQL Editor para criar a tabela

-- Criar tabela de mensagens rápidas
CREATE TABLE IF NOT EXISTS quick_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL,
  conteudo TEXT NOT NULL,
  categoria VARCHAR(50),
  atalho VARCHAR(20) UNIQUE,
  ordem INT DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_quick_messages_ativo ON quick_messages(ativo);
CREATE INDEX IF NOT EXISTS idx_quick_messages_categoria ON quick_messages(categoria);
CREATE INDEX IF NOT EXISTS idx_quick_messages_ordem ON quick_messages(ordem);

-- Habilitar Row Level Security (RLS)
ALTER TABLE quick_messages ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso público (ajuste conforme necessário)
CREATE POLICY "Permitir acesso total a quick_messages" ON quick_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_quick_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_quick_messages_updated_at ON quick_messages;
CREATE TRIGGER trigger_update_quick_messages_updated_at
  BEFORE UPDATE ON quick_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_quick_messages_updated_at();

-- =============================================
-- DADOS DE EXEMPLO (opcional)
-- =============================================
-- Descomente as linhas abaixo para inserir mensagens de exemplo

/*
INSERT INTO quick_messages (titulo, conteudo, categoria, atalho, ordem) VALUES
('Saudação', 'Olá {nome}, tudo bem? Como posso ajudar você hoje?', 'saudacao', '/oi', 1),
('Bom dia', 'Bom dia {nome}! Espero que esteja tendo um ótimo dia. Em que posso ajudar?', 'saudacao', '/bomdia', 2),
('Agradecimento', 'Muito obrigado pelo contato, {nome}! Fico feliz em ajudar.', 'encerramento', '/obrigado', 3),
('Preços', 'Nossos preços variam de acordo com o produto/serviço escolhido. Posso detalhar as opções disponíveis para você?', 'vendas', '/precos', 4),
('Horário', 'Nosso horário de atendimento é de segunda a sexta, das 9h às 18h.', 'suporte', '/horario', 5),
('Despedida', 'Foi um prazer atendê-lo, {nome}! Qualquer dúvida, estamos à disposição. Até mais!', 'encerramento', '/tchau', 6),
('Aguarde', 'Um momento, {nome}. Estou verificando essa informação para você.', 'suporte', '/aguarde', 7),
('Promoção', 'Temos uma promoção especial acontecendo agora! Gostaria de saber mais detalhes?', 'vendas', '/promo', 8);
*/
