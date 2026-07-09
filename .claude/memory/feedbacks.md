# Feedbacks e Correções

> Registre aqui feedbacks do usuário com data e contexto curto.
> Formato: `## YYYY-MM-DD — <contexto>` seguido da correção/aprendizado.

## 2026-07-08 — UX de autenticação (rodada de correções)
- **Bottom sheet de login**: nada de altura fixa (70%) nem spring com overshoot.
  Altura definida pelo conteúdo ("baixinho"), subida com timing ease-out, e o
  sheet acompanha o teclado (Keyboard listeners). Uma vez aberto, NÃO fecha:
  toque fora apenas recolhe o teclado — o usuário não volta à tela inicial.
- **Erros de formulário**: nada de caixa de erro eterna. Toast no topo, discreto,
  3 segundos, com barrinha de tempo de vida. Mensagens específicas por campo
  ("Informe o e-mail." / "Informe a senha." / "Informe e-mail e senha.").
- **Mensagens de login**: distinguir "Usuário não encontrado" (e-mail sem conta)
  de "Senha incorreta" (decisão de produto — app pessoal, sem anti-enumeração).
- **Recuperação de senha**: fluxo de 3 telas por CÓDIGO de 6 dígitos (não token
  colável): e-mail (valida existência) → código (reenvio 60s; novo código
  invalida o antigo) → nova senha com botão "Redefinir". SEM auto-login ao
  final: volta para a tela de Entrar.
- **Cadastro**: nome/sobrenome e nascimento em telas separadas (5 etapas).
  Idade: > 10 e < 100 anos. Confirmação de e-mail por CÓDIGO digitado no app —
  o usuário não gostou de link que abre página. Código dev do SMS continua
  visível na tela (sem provedor de SMS ainda — backlog).
- Preferência geral: animações suaves e discretas, sem "pulos"; popups sempre
  temporários e com feedback visual do tempo restante.
