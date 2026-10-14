# Doe Amor, Espalhe Alegria

Site da ação social São Benedito. Hospedagem: GitHub Pages. Banco e autenticação: Supabase.

## Publicação

Em Settings → Pages, selecione Deploy from a branch, branch main e pasta / (root). O arquivo CNAME configura doeamorespalhealegria.com. Configure o DNS e ative Enforce HTTPS quando o certificado estiver disponível.

## Desenvolvimento

Site estático sem compilação: index.html, styles.css e app.js na raiz. As mídias ficam em media/.

## Dados

O painel salva uma cópia local no navegador. Após entrar pelo formulário de conexão, sincroniza com public.site_state no Supabase. As políticas RLS permitem acesso somente ao user_id autenticado. A chave publishable do cliente é pública por definição; nunca adicionar service_role, senha, token ou dados pessoais ao repositório.

Dados locais e comprovantes armazenados no navegador do endereço antigo não são transferidos automaticamente para outro domínio. Faça backup pelo site antigo antes da mudança. Os anexos de comprovantes permanecem locais em IndexedDB.

As tabelas events, partners, donations e tasks são estrutura reservada e não são usadas pelo cliente atual; estão protegidas por RLS sem políticas de acesso.
