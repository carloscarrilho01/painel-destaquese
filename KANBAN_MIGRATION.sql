-- Migration: Adicionar campo stage para CRM Kanban
-- Execute este SQL no Supabase SQL Editor

-- Adicionar coluna stage na tabela leads
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS stage text DEFAULT 'novo';

-- Criar índice para melhorar performance nas queries por stage
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);

-- Comentário explicando os valores possíveis
COMMENT ON COLUMN leads.stage IS 'Estágio do lead no funil de vendas: novo, contato, interessado, negociacao, fechado, perdido';

-- Atualizar leads existentes baseado no campo interessado
UPDATE leads
SET stage = CASE
  WHEN interessado = true THEN 'interessado'
  ELSE 'novo'
END
WHERE stage = 'novo';
