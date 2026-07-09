# fortn — Referência da API

Backend Next.js (porta 3000). Todas as rotas em `app/api/`. Corpo e resposta em JSON.
Erros: `{ "error": "mensagem" }` com status HTTP adequado.

Autenticação de dados: header `Authorization: Bearer <accessToken>` (JWT, 15 min).
Renovação: `POST /api/auth/refresh` com o refresh token (30 dias, rotacionado).

---

## Autenticação

### Fluxo de cadastro (em etapas, estado no servidor)

O cadastro cria o usuário **pendente** na etapa 1 e devolve um `cadastroToken`
(JWT de escopo restrito, 1h) que autoriza as etapas seguintes via
`Authorization: Bearer <cadastroToken>`. A conta só fica ativa ao definir a senha.

**1. Dados pessoais**
```
POST /api/auth/cadastro
{ "nome": "Ana", "sobrenome": "Souza", "nascimento": "1995-05-20" }
→ 201 { "cadastroToken": "..." }
```
Validações: campos obrigatórios, idade > 10 e < 100 anos.
Rate limit: 10/h por IP. (No app são duas telas: nome/sobrenome e nascimento —
a chamada acontece na tela do nascimento.)

**2. Telefone** *(requer cadastroToken)*
```
POST /api/auth/cadastro/telefone
{ "ddd": "11", "numero": "987654321" }
→ 200 { "enviado": true, "expiraEmSegundos": 300, "devCodigo": "123456"? }
```
`devCodigo` só aparece com `AUTH_DEV_RETORNA_CODIGO=true` (sem provedor de SMS).
Reenviar = chamar de novo (códigos antigos são invalidados). Limite: 5/15min.

**3. Verificar código** *(requer cadastroToken)*
```
POST /api/auth/cadastro/telefone/verificar
{ "codigo": "123456" }
→ 200 { "verificado": true }
```
Código expira em 5 min; máximo 5 tentativas por código.

**4. E-mail** *(requer cadastroToken; exige telefone verificado)*
```
POST /api/auth/cadastro/email
{ "email": "ana@exemplo.com" }
→ 200 { "enviado": true, "expiraEmSegundos": 900, "devCodigo": "123456"? }
```
409 se o e-mail já estiver em uso. Envia e-mail real (SMTP) com um **código de
6 dígitos** (15 min, uso único). Reenviar invalida o código anterior.

**5. Verificar código do e-mail** *(requer cadastroToken)*
```
POST /api/auth/cadastro/email/verificar
{ "codigo": "123456" }
→ 200 { "verificado": true }
```
Máximo 5 tentativas por código (depois é preciso reenviar).

**6. Senha** *(requer cadastroToken; exige telefone E e-mail verificados)*
```
POST /api/auth/cadastro/senha
{ "senha": "MinhaSenha@1" }
→ 201 { "accessToken": "...", "refreshToken": "..." }   // auto-login
→ 400 { "error": "...", "requisitos": { tamanhoMinimo, maiuscula, minuscula, numero, especial } }
```
Política: 8+ caracteres, maiúscula, minúscula, número, especial.
Ao ativar, categorias e formas de pagamento padrão são semeadas.

### Sessão

```
POST /api/auth/login     { "email", "senha" }        → 200 { accessToken, refreshToken }
POST /api/auth/refresh   { "refreshToken" }          → 200 { accessToken, refreshToken }  // rotaciona
POST /api/auth/logout    { "refreshToken" }          → 200 { ok: true }                   // revoga
GET  /api/auth/sessao    (Bearer)                    → 200 { id, nome, primeiroNome, email, telefone, criadoEm }
```
- Login com e-mail inexistente → 404 "Usuário não encontrado."; senha errada →
  401 "Senha incorreta." (decisão de produto para app pessoal — mensagens distintas).
- **Bloqueio**: 5 falhas em 15 min → 429 por e-mail. Rate limit 20/15min por IP.
- Refresh: usar um token já rotacionado/revogado → 401 (replay detectado).

### Recuperação de senha (3 passos, por código)

```
1. POST /api/auth/senha/esquecida  { "email" }
   → 200 { "enviado": true, "expiraEmSegundos": 900, "devCodigo": "123456"? }
   → 404 "Usuário não encontrado." se o e-mail não tiver conta ativa
   Reenviar invalida o código anterior (só o mais novo vale).

2. POST /api/auth/senha/codigo     { "email", "codigo" }
   → 200 { "resetToken": "..." }   // JWT escopo "reset", 15 min; código vira usado

3. POST /api/auth/senha/redefinir  { "resetToken", "novaSenha" }
   → 200 { "ok": true }            // revoga TODAS as sessões; SEM auto-login —
                                   // o app volta à tela de Entrar
```

---

## Despesas *(todas exigem Bearer accessToken)*

```
GET /api/resumo
→ { totalMes, totalGeral, lancamentos,
    porCategoria: [{ categoriaId, nome, valor }],
    recentes: [{ id, data, valor, descricao, categoria }] }

GET /api/despesas
→ [{ id, data, valor, descricao, categoria, categoriaId,
     formaPagamento, formaPagamentoId, banco, bancoId }]

POST /api/despesas
{ "data": "2026-07-08", "valor": 42.5, "descricao"?, "categoriaId", "formaPagamentoId", "bancoId"? }
→ 201 { id }

PATCH /api/despesas/{id}     // mesmo corpo do POST; valida posse (404 se não for sua)
→ 200 { id }

DELETE /api/despesas/{id}
{ "motivo": "lançamento duplicado" }   // OBRIGATÓRIO (400 sem motivo)
→ 200 { ok: true }                     // soft delete: is_deleted + deleted_at + motivo

GET /api/referencias
→ { categorias: [{id,name}], formasPagamento: [{id,name}], bancos: [{id,name}] }
```

Regras:
- Datas precisam existir em `calendar_day` (por ora, apenas 2026).
- Despesas soft-deletadas somem de todas as listagens, mas ficam no banco.
- `categoriaId`/`formaPagamentoId`/`bancoId` precisam pertencer ao usuário logado.

---

## Auditoria

Tabela `auth_log`: eventos `cadastro_iniciado`, `telefone_codigo_enviado`,
`telefone_verificado`, `email_confirmacao_enviada`, `email_verificado`,
`conta_ativada`, `login_ok`, `login_falha`, `login_bloqueado`, `logout`,
`refresh_ok`, `refresh_invalido`, `senha_reset_solicitado`, `senha_redefinida` —
com userId/email/IP/timestamp.
