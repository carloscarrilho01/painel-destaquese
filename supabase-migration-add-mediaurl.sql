-- Adicionar coluna mediaUrl na tabela chats para armazenar URLs de imagens/mídias
ALTER TABLE chats ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Adicionar índice para melhorar performance de busca
CREATE INDEX IF NOT EXISTS idx_chats_media_url ON chats(media_url) WHERE media_url IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN chats.media_url IS 'URL da mídia (imagem, áudio, vídeo) enviada na mensagem';
