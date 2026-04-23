-- ============================================================
-- ERVARIA — Corrige admin_herbs.detail truncado em 500 chars
-- Data: 2026-04-23
-- ============================================================
-- Execute no Supabase Dashboard > SQL Editor.
-- Idempotente: pode ser rodado múltiplas vezes (UPDATE por latin_name).
--
-- Contexto: ao importar as 14 ervas novas + Maracujá spp para
-- admin_herbs, a coluna detail foi armazenada com textos cortados
-- em 500 caracteres mid-sentence. Este script substitui o conteúdo
-- pelos textos canônicos (mesmos usados em js/app.js e no seed),
-- sincronizando seed + DB + offline fallback.
--
-- Também corrige dose/frequency truncados em Maracujá, Chambá e Macela.
-- ============================================================

-- Maracujá (Passiflora spp)
UPDATE public.admin_herbs
SET detail = 'Três espécies oficiais brasileiras com farmacologia GABAérgica. Flavonoides (vitexina, isovitexina) se ligam ao receptor GABA-A com afinidade baixa, produzindo calma sem sedação pesada. Monografia oficial da Farmacopeia Brasileira.',
    dose = '3 g de folhas secas (partes aéreas para P. incarnata) para 150 ml',
    frequency = 'Fim de tarde e noite. 2 a 4 vezes ao dia conforme monografia.'
WHERE name = 'Maracujá' AND latin_name LIKE 'Passiflora spp%';

-- Aroeira-da-Praia
UPDATE public.admin_herbs
SET detail = 'Planta caiçara com dupla identidade: tempero gourmet (pimenta-rosa) e fitoterápico monografado. Casca em decocção para uso externo ginecológico — anti-inflamatório e cicatrizante via taninos concentrados.'
WHERE latin_name = 'Schinus terebinthifolius Raddi';

-- Assa-Peixe
UPDATE public.admin_herbs
SET detail = 'Arbusto pioneiro de pastagens brasileiras. Expectorante monografado pela Anvisa — saponinas estimulam secreção brônquica. Flor importante para apicultura nacional.'
WHERE latin_name = 'Vernonia polyanthes Less';

-- Barbatimão
UPDATE public.admin_herbs
SET detail = 'Árvore do cerrado com a maior concentração de taninos condensados entre as ervas oficiais brasileiras. Creme cicatrizante monografado — taninos formam película proteica sobre feridas. Uso externo.'
WHERE latin_name = 'Stryphnodendron adstringens (Mart.) Coville';

-- Boldo-Baiano
UPDATE public.admin_herbs
SET detail = 'Terceira planta brasileira chamada boldo — folha amarga com sesquiterpenos lactonas. Antidispéptico monografado. Tradição afro-brasileira no Nordeste.'
WHERE latin_name = 'Vernonia condensata Baker';

-- Boldo-Brasileiro
UPDATE public.admin_herbs
SET detail = 'Planta africana (Plectranthus barbatus) naturalizada nos quintais brasileiros. Antidispéptico monografado, mais gentil que o boldo-do-chile. Forskolina é seu diterpeno característico.'
WHERE latin_name = 'Plectranthus barbatus Andrews';

-- Chambá
UPDATE public.admin_herbs
SET detail = 'Erva do Ceará com aroma de baunilha (cumarina). Expectorante monografado, permitido a partir dos 3 anos. Base do programa Farmácias Vivas da UFC.',
    frequency = 'Em quadros de tosse: 2 a 3 vezes ao dia. Pediatria: 3-7 anos 35 ml; 7-12 anos 75 ml; adultos 150 ml.'
WHERE latin_name = 'Justicia pectoralis Jacq.';

-- Chapéu-de-Couro
UPDATE public.admin_herbs
SET detail = 'Folha larga de brejos brasileiros. Diurético e anti-inflamatório monografado — diterpenos clerodanos. Uso tradicional em litíase urinária e gota.'
WHERE latin_name = 'Echinodorus macrophyllus (Kunth) Micheli';

-- Copaíba
UPDATE public.admin_herbs
SET detail = 'Óleo-resina extraído do tronco de árvores amazônicas centenárias. Pomada anti-inflamatória monografada — beta-cariofileno age no receptor canabinoide CB2. Três espécies oficiais.'
WHERE latin_name LIKE 'Copaifera spp%';

-- Erva-Baleeira
UPDATE public.admin_herbs
SET detail = 'Planta caiçara do litoral atlântico. Primeiro fitoterápico brasileiro com pesquisa clínica completa (Acheflan). Anti-inflamatório tópico via alfa-humuleno e trans-cariofileno.'
WHERE latin_name = 'Cordia verbenacea DC.';

-- Erva-de-Bicho
UPDATE public.admin_herbs
SET detail = 'Planta de várzeas brasileiras com sabor picante (polygodial). Anti-hemorroidal monografado — banho de assento. Taninos adstringentes mais leve irritação local produzem efeito contração-cicatrização.'
WHERE latin_name = 'Polygonum punctatum Elliot';

-- Erva-Mate
UPDATE public.admin_herbs
SET detail = 'Xantinas (cafeína mais teobromina) e polifenóis. Ritual comunitário do Sul. Consumo muito quente associado a câncer de esôfago (IARC 2A) — evitar acima de 70°C.'
WHERE latin_name ILIKE 'Ilex paraguariensis%';

-- Guaçatonga
UPDATE public.admin_herbs
SET detail = 'Irmã menos famosa da espinheira-santa — antidispéptico e antiulcerogênico monografado. Casearinas (diterpenos clerodanos) com atividade antitumoral em estudos de bancada.'
WHERE latin_name = 'Casearia sylvestris Sw.';

-- Macela
UPDATE public.admin_herbs
SET detail = 'Flor amarela do pampa, tradição gaúcha colher na Sexta-Feira Santa. Antidispéptico monografado — flavonoides com ação antiespasmódica e ansiolítica leve. Travesseiros aromáticos do Sul.',
    dose = '1,5 g de sumidades floridas secas (cerca de 1 colher de chá cheia) para 150 ml',
    frequency = '2 a 3 vezes ao dia, após refeições (digestivo) ou antes de dormir (leve ansiolítico pelos flavonoides).'
WHERE latin_name = 'Achyrocline satureioides (Lam.) DC.';

-- Quebra-Pedra
UPDATE public.admin_herbs
SET detail = 'Erva rasteira que reduz formação de cristais urinários. Litolítico monografado pela Anvisa — lignanas (filantina, hipofilantina) previnem nucleação de oxalato de cálcio. Manter hidratação.'
WHERE latin_name = 'Phyllanthus niruri L.';

-- ═══ Relatório ═══
-- Mostra length(detail) das ervas-alvo para conferir que nenhuma ficou
-- próxima dos 500 chars (indicador de truncamento residual).
SELECT name, latin_name, length(detail) AS chars_detail
FROM public.admin_herbs
WHERE latin_name IN (
  'Schinus terebinthifolius Raddi',
  'Vernonia polyanthes Less',
  'Stryphnodendron adstringens (Mart.) Coville',
  'Vernonia condensata Baker',
  'Plectranthus barbatus Andrews',
  'Justicia pectoralis Jacq.',
  'Echinodorus macrophyllus (Kunth) Micheli',
  'Cordia verbenacea DC.',
  'Polygonum punctatum Elliot',
  'Casearia sylvestris Sw.',
  'Achyrocline satureioides (Lam.) DC.',
  'Phyllanthus niruri L.'
) OR latin_name LIKE 'Copaifera spp%'
  OR latin_name ILIKE 'Ilex paraguariensis%'
  OR latin_name LIKE 'Passiflora spp%'
ORDER BY name;
