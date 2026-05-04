# Ervatório — Roadmap de Conteúdo das Fichas

## Estado atual (maio/2026)

- **96 fichas únicas** publicadas no Supabase (`admin_herb_fichas`, schema v1.1)
- Todas as ervas planejadas das séries 1–5 (100 herbs) estão presentes — diferenças residuais são apenas variações de slug, já normalizadas
- Filtros canônicos (Tipo, Localização, Bioma, Sensorial, Coloração, Sabor, Parte usada) cobrem todo o catálogo

## Padrão Camomila integral (target editorial)

A ficha de referência (Camomila) define o padrão de profundidade desejado para todas as 100 fichas:

### Campos obrigatórios completos
- `identificacao`: nome científico, família, parte usada com explicação, sinônimos com atenção a confusões
- `caracterizacao`: sabor, aroma, cor da infusão (com hex), intensidade 1–5, notas (cabeça/corpo/fundo), bioma, distribuição geográfica
- `preparo`: temperatura, tempo, quantidade, método, reinfusões, melhor momento, combina com
- `usos_topicos`: nível de evidência, indicações específicas com mecanismo
- `acoes_e_seguranca`:
  - `acoes_principais` (lista)
  - `componentes_ativos` (tabela com componente, concentração, ação, observação)
  - `evidencia` (tabela com indicação, evidência, população, referência)
  - `contraindicacoes`, `interacoes` (tabela), `efeitos_adversos`, `dose_maxima`
  - `fontes` (referências acadêmicas indexadas)
- `perfil_sensorial`:
  - `gustativo` (tabela 5 dimensões: doce, amargo, umami, azedo, salgado)
  - `olfativo` com família aromática + descritores
  - `trigeminal` (tabela com TRPM8, TRPV1, TRPA1, adstringência)
  - `tatil` com persistência e textura
- `cultura`: história, cerimonial, "no Brasil", curiosidade científica
- `regulacao`: ANVISA, EMA, FDA, RENISUS, certificação, sazonalidade
- `marketplace`: disponibilidade, fornecedores prioritários, faixa de preço, formatos
- `receitas`: lista de blends Ervatório que usam a erva

## Estado por ficha

| Cobertura | Quantidade |
|---|---:|
| 11/11 campos principais preenchidos | ~95% |
| Sub-campos detalhados (perfil sensorial gustativo + trigeminal + componentes ativos com tabela + fontes) | ~5% (referência: ficha 01 Guaraná) |
| Padrão Camomila integral completo | A ser implementado |

## Roadmap de upgrade

### Fase 1 — Lote prioritário (20 fichas-âncora)
Fichas de cada bioma + globais essenciais. Conteúdo já fornecido no material editorial:
- **Amazônia**: Guaraná, Açaí, Cumaru, Unha-de-gato, Jatobá
- **Cerrado**: Espinheira-santa, Barbatimão, Pata-de-vaca, Pequi, Sucupira, Fava-de-anta, Mangaba
- **Caatinga**: Aroeira, Jurema-preta, Imburana-de-cheiro, Rompe-pedra, Angico, Mastruz, Umbu
- **Mata Atlântica**: Erva-mate, Guaco, Maracujá

### Fase 2 — Globais e Pampas/Pantanal
~30 fichas restantes do material editorial fornecido.

### Fase 3 — Catálogo completo (96 → 100)
Identificar e adicionar as 4 fichas faltantes do plano de 100. Possíveis candidatas (baseado na cobertura por bioma):
- Pampas adicionais
- Pantanal adicionais

### Fase 4 — QC e padronização
Revisão cruzada, fontes acadêmicas verificadas, marketplace atualizado.

## Esforço estimado

- Conversão markdown → JSON v1.1 padrão Camomila: ~30–60 min/ficha
- 100 fichas × 45 min = ~75 horas de trabalho focado de conteúdo

## Migração técnica

A importação para o Supabase usa `admin_herb_fichas`. Cada ficha atualizada deve:
1. Ser convertida para JSON v1.1 conforme schema
2. Validada via `cromatografia-de-camada-delgada` editorial (revisão de fontes e dados regulatórios)
3. Importada via SQL UPDATE no slug correspondente (preserva histórico)

Os filtros canônicos do Ervopedia (`js/ervatorio-pages.js`) operam sobre os campos:
- `regulacao.eixo_botanico_tpc` + `nome_cientifico` → Tipo
- `caracterizacao.bioma_de_origem` + `notas` → Bioma
- `caracterizacao.bioma_de_origem` + `notas` + `cultura.{brasil,historia}` → Localização
- `acoes_e_seguranca.acoes_principais` → Sensorial
- `caracterizacao.cor_da_infusao` → Coloração
- `caracterizacao.{sabor_dominante,aroma,notas}` → Sabor
- `identificacao.parte_usada` → Parte usada

Atualização de qualquer um desses campos atualiza automaticamente os filtros — sem necessidade de alterar código JavaScript.
