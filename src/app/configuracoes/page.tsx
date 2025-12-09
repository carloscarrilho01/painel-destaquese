export default function ConfiguracoesPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configuracoes</h1>
        <p className="text-[var(--muted)]">Configuracoes do painel</p>
      </div>

      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold mb-4">Conexao Supabase</h2>

        <div className="space-y-4">
          <div className="p-4 bg-[var(--background)] rounded-lg border border-[var(--border)]">
            <p className="text-sm text-[var(--muted)] mb-2">
              Configure as variaveis de ambiente no arquivo <code className="bg-[var(--card)] px-2 py-1 rounded">.env.local</code>
            </p>
            <pre className="text-sm bg-[var(--card)] p-4 rounded-lg overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima`}
            </pre>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h3 className="font-medium text-blue-400 mb-2">Como obter as credenciais:</h3>
            <ol className="text-sm text-[var(--muted)] space-y-2 list-decimal list-inside">
              <li>Acesse o painel do Supabase</li>
              <li>Selecione seu projeto</li>
              <li>Va em Settings &gt; API</li>
              <li>Copie a URL e a chave anon (publica)</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Estrutura das Tabelas</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Tabela: chats</h3>
            <pre className="text-sm bg-[var(--background)] p-4 rounded-lg overflow-x-auto">
{`id: int4 (primary key)
session_id: varchar
message: jsonb {
  type: "human" | "ai"
  content: string
  additional_kwargs: {}
  response_metadata: {}
  tool_calls: []
}`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium mb-2">Tabela: leads</h3>
            <pre className="text-sm bg-[var(--background)] p-4 rounded-lg overflow-x-auto">
{`id: uuid (primary key)
telefone: text
nome: text
trava: bool
created_at: timestamptz
followup: int4
last_followup: timestamptz
interesse: text
interessado: bool`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
