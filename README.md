# Nossa Lua de Mel 

Uma lista de presentes online para lua de mel, onde convidados podem escolher experiências especiais e contribuir via PIX.

## Sobre 

Site elegante e responsivo com 6 opções de presentes para uma lua de mel. Cada presente inclui uma descrição romântica e permite pagamento via código PIX "Copia e Cola".

## Personalização

Para personalizar os presentes, edite `constants.ts`. Para alterar os nomes do casal, edite `App.tsx` na seção do footer.

Os códigos PIX são configurados no arquivo `.env.local` usando as variáveis de ambiente definidas em `.env.example`.

## Karaokê (Neon + API)

A página de karaokê usa um backend Node (`server/main.ts`) com Postgres na Neon e REST em `/api/karaoke/*`. O browser **consulta o estado em intervalos de 5 segundos** (`GET /api/karaoke/state`); após cada alteração a UI também atualiza de imediato.

- **Desenvolvimento**: `pnpm dev` sobe o Vite (porta 3000) e o servidor da API (porta 8787), com proxy de `/api` no Vite.
- **Variáveis**: copie `DATABASE_URL`, `KARAOKE_DJ_PIN` e `KARAOKE_JWT_SECRET` para `.env.local` (veja `.env.example`). O PIN do DJ abre o “Modo DJ” na interface.
- **Produção**: sirva o front estático e rode `pnpm start:server` (ou o equivalente) onde `DATABASE_URL` estiver definido; se o front e a API forem domínios diferentes, defina `VITE_KARAOKE_API_URL`.
