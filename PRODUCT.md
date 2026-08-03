# Product

## Register

product

## Users

Uso pessoal e individual (só a dona do projeto usa). Contexto principal: sessões
de análise no desktop, revisando o mês, decidindo onde cortar gasto, conferindo
saldo real das contas/cartões. Uso secundário: lançar uma despesa/receita rápido
(pode ser no celular), mas a experiência "de verdade" é sentar e olhar os
números com calma.

## Product Purpose

Controle financeiro pessoal que reflete a situação real das contas bancárias e
cartões da usuária. Ela cadastra bancos/contas/cartões, lança receitas e
despesas manualmente, e o app calcula automaticamente saldo, quanto deve no
cartão, e visualiza (via dashboards/gráficos) entrada vs. saída, categorias que
mais pesam no orçamento e a evolução ao longo do tempo. Sucesso = ela abrir o
app e em segundos entender "como estou financeiramente agora" sem precisar
fazer conta de cabeça.

## Brand Personality

Direto, analítico, sem ruído visual. Reaproveita o design system que já existe
no projeto (tema `base-luma`, Base UI, tipografia Noto Sans/Raleway, ícones
Hugeicons) — não é um projeto de identidade visual nova, é uma ferramenta.
Dark/light mode são cidadãos de primeira classe, não um extra.

## Anti-references

- **SaaS genérico**: cards idênticos, gradiente em texto, ícone+título+parágrafo
  repetido à exaustão.
- **Planilha disfarçada**: tabela crua sem hierarquia visual, cara de Excel
  exportado pra HTML.
- **App de banco tradicional**: banners, propaganda de cartão, ruído visual
  disfarçado de funcionalidade.

## Design Principles

1. **Números primeiro, decoração nunca atrapalha.** Todo elemento visual serve
   a leitura do dado financeiro; nada é puramente decorativo.
2. **Um design system, não uma vitrine.** Reusa os componentes/tokens que já
   existem em `packages/ui`; não reinventa estilo por tela.
3. **Densidade com hierarquia.** Uso primário é desktop/análise — pode (e deve)
   mostrar bastante informação por tela, desde que a hierarquia visual deixe
   claro o que importa primeiro.
4. **Cor com significado, não decoração.** Verde/vermelho/cores de destaque
   comunicam sinal financeiro real (saldo positivo/negativo, acima/abaixo do
   orçamento) — nunca são só estética.
5. **Dark e light mode com o mesmo cuidado.** Nenhum dos dois é o "modo
   secundário" mal testado.

## Accessibility & Inclusion

Contraste mínimo AA (WCAG) em texto e em elementos de gráfico/dado. Respeita
`prefers-reduced-motion`. Sem requisito adicional declarado além disso.
