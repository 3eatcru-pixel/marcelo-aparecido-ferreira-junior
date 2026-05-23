# AUDTRILHA - Architecture & Guidelines

## Objetivos e Visão
AUDTRILHA é uma plataforma híbrida para leitura (Reader Mode) e criação (Creator Mode) de conteúdo digital (Mangás, Novels, Histórias).

## Pilares Técnicos
- **Soalho de Dados (Min-Firestore):** Firestore é usado apenas para índices, descoberta, analytics e permissões. Conteúdo pesado (manuscritos) reside no Google Drive.
- **Draft vs Live:** O conteúdo passa por um pipeline de publicação. Leitores consomem apenas a coleção `published_*`. Autores trabalham em `projects/*`.
- **Economia Digital:** Sistema de moedas, capítulos premium e payout para autores.

## Estrutura de Dados Crítica
- `users/{uid}`: Perfil básico e saldo de moedas.
- `creators/{creatorId}`: Perfil público do criador.
- `projects/{projectId}`: Workspace privado do autor.
- `published_works/{workId}`: Catálogo público consumido pelo leitor.
- `wallets/{uid}` & `wallet_transactions/{txId}`: Ledger financeiro (Admin only write).

## Social & Interactions
- **Engagement:** Users can like works, follow authors, follow specific series for updates, and leave comments.
- **Community:** Role-based access. `READER` can view and like, but `CREATOR`/`ADMIN` are required to post new discussions or view published works tab in the community feed.

## Regras de Segurança (Firestore)
- **Financeiro:** Cliente NUNCA escreve em `wallets`, `transactions`, `purchases`, `payouts`, `entitlements`. Toda operação financeira deve passar pelo backend `/api/billing/*`.
- **Ativos Pré-instalados:** Todos os assets/personagens pré-instalados (`preset-*`) pertencem ao administrador (`ADMIN`). Apenas usuários com a role `ADMIN` podem realizar edições diretas e exclusões desses modelos canônicos no Soalho de Dados (Min-Firestore). Leitores e de criadores normais apenas podem cloná-los ("Remix") para seus próprios espaços de trabalho.
- **Papéis:** 
  - `READER`: Acesso a leitura e comunidade. Não vê abas de criação ou analytics.
  - `CREATOR`: Acesso ao Creator Studio, gerenciamento de obras e analytics.
  - `ADMIN`: Acesso total.

## Backend (Express + Firebase Admin)
- Localizado em `server.ts`.
- Responsável por: Checkout sessions, validação de saldos, processamento de purchases, geração de entitlements.

## Fluxo de Monetização
1. Compra de Moedas via Gatway (Stripe/Mercado Pago).
2. Unlock de Capítulo Premium: Backend valida saldo -> Decrementa -> Cria Entitlement -> Libera Conteúdo Protegido.

## Regra de Ouro (Criação Progressiva de Personagens)
- **Fluxo de Criação Técnica:** Evitar a obrigatoriedade de folheto 360° em múltiplos ângulos logo no início. O fluxo de criação segue a ordem natural e prática:
  1. **Corpo Inteiro (Perfil/Frente):** Pose neutra limpa em fundo sólido para fixar detalhes básicos (traje, cor, proporções).
  2. **Folha de Expressões (Expressions Sheets):** Múltiplos sentimentos ancorados visualmente no Corpo Inteiro para dar alma ao personagem.
  3. **Folheto 360° Ortográfico (Showcase/Galeria):** Reservado estritamente para a visualização final de portfólio/galeria (Showcase 3D) do design já consolidado.
- **Ciclo de Feedback e Refação (Refazer):** O criador tem liberdade total de solicitar re-geração ("Refazer") de qualquer etapa inadequada, indicando refinamentos ("corrigir olhos", "mudar clima de raiva para determinação") até que o modelo fique perfeito.

