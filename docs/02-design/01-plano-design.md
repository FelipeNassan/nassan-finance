# fortn — Plano de Design

## Filosofia

Design entra na Fase 2 — depois que as features core estiverem funcionando.
Na Fase 1, o foco é funcional: componentes shadcn/ui padrão, Tailwind, sem customização pesada.

Quando o design avançar:

- **Estilo visual:** Flat Design — limpo, sem sombras excessivas, ícones simples, foco em tipografia e espaçamento
- **Referência para pessoas/ilustrações:** modelo Flat Design humanizado

## Ferramenta de design

**Pencil** — Figma com IA, para prototipar telas antes de implementar.

Referências e inspirações:
- https://www.youtube.com/watch?v=IFlxdcyCPz4
- https://www.youtube.com/watch?v=pKxyWyVA-Xw
- https://www.youtube.com/watch?v=34BV6fNQJBE
- https://www.youtube.com/watch?v=6zMK8gFablA

## Stack de estilo (web)

- **Tailwind CSS** — base de todas as classes utilitárias
- **shadcn/ui** — componentes acessíveis, fácil de customizar via `components/ui/`
- **Framer Motion** (Fase 2) — animações de transição e microinterações
- **next/font** — fontes otimizadas sem layout shift

## Tokens de design (a definir na Fase 2)

- Paleta de cores (primária, neutros, feedback)
- Tipografia (família, tamanhos, pesos)
- Espaçamento
- Bordas e raios
