-- ============================================================
-- ERVARIA — Migra admin_herbs de 28 → 42 ervas (núcleo brasileiro)
-- Data: 2026-04-23
-- ============================================================
-- Execute no Supabase Dashboard > SQL Editor.
-- Idempotente: pode ser rodado múltiplas vezes sem duplicar registros.
--
-- O que faz:
--  1) Consolida Maracujá — opção C (UPDATE in-place preservando id local=3).
--     Remove linhas duplicadas (Passiflora edulis antiga + Passiflora spp nova).
--     Garante uma única linha com latin_name = 'Passiflora spp. (...)'.
--  2) Insere 14 ervas brasileiras novas (apenas se ainda não existem).
--  3) Não toca em imagens locais (img) nem em produtos.
--
-- Pré-requisitos: colunas linha, tagline, img devem existir (criadas por
-- ervaria-admin-migration.sql). Este script não cria essas colunas.
-- ============================================================

-- ─── 1) Maracujá: consolida em uma única linha (Passiflora spp) ───
-- 1.a) Se existe a linha "Passiflora spp" E a linha "Passiflora edulis",
--      remove a edulis (manter a spp já populada pelo admin).
DELETE FROM public.admin_herbs
WHERE name = 'Maracujá'
  AND latin_name = 'Passiflora edulis'
  AND EXISTS (
    SELECT 1 FROM public.admin_herbs
    WHERE name = 'Maracujá' AND latin_name LIKE 'Passiflora spp%'
  );

-- 1.b) Se existe apenas a edulis (instância antiga sem a spp), promove ela
--      para spp atualizando latin_name + conteúdo editorial.
UPDATE public.admin_herbs
SET latin_name = 'Passiflora spp. (P. alata · P. edulis · P. incarnata)',
    icon      = '🌿',
    category  = 'Calmante',
    linha     = 'Essencial',
    tagline   = 'Três espécies oficiais brasileiras, uma farmacologia GABAérgica — ansiolítico popular com evidência clínica robusta.',
    effects   = 'Ansiolítico — ação monografada, Sedativo leve, Indutor suave de sono',
    detail    = 'Três espécies oficiais brasileiras com farmacologia GABAérgica. Flavonoides (vitexina, isovitexina) se ligam ao receptor GABA-A com afinidade baixa, produzindo calma sem sedação pesada. Monografia oficial da Farmacopeia Brasileira.',
    safe_for  = '{"adultos saudáveis","hipertensos"}',
    avoid_for = '{}',
    temp      = '95°C',
    brew_time = '10 min',
    dose      = '3 g de folhas secas (partes aéreas para P. incarnata) para 150 ml',
    frequency = 'Fim de tarde e noite. 2 a 4 vezes ao dia conforme monografia.',
    tags      = '{"ansiedade","sono"}',
    momento   = '{"tarde","noite"}'
WHERE name = 'Maracujá'
  AND latin_name = 'Passiflora edulis';

-- 1.c) Garante que a linha spp tenha linha/tagline canônicos (caso tenha
--      sido inserida sem esses campos).
UPDATE public.admin_herbs
SET linha = COALESCE(linha, 'Essencial'),
    tagline = COALESCE(tagline, 'Três espécies oficiais brasileiras, uma farmacologia GABAérgica — ansiolítico popular com evidência clínica robusta.')
WHERE name = 'Maracujá'
  AND latin_name LIKE 'Passiflora spp%';

-- ─── 2) INSERT das 14 ervas brasileiras novas (WHERE NOT EXISTS) ───
INSERT INTO public.admin_herbs (name, latin_name, icon, category, linha, tagline, effects, detail, safe_for, avoid_for, temp, brew_time, dose, frequency, tags, momento)
SELECT v.name, v.latin_name, v.icon, v.category, v.linha, v.tagline, v.effects, v.detail, v.safe_for::text[], v.avoid_for::text[], v.temp, v.brew_time, v.dose, v.frequency, v.tags::text[], v.momento::text[]
FROM (VALUES
  ('Aroeira-da-Praia','Schinus terebinthifolius Raddi','🌿','Anti-inflamatório','Funcional','Pimenta-rosa brasileira virou cicatrizante ginecológico oficial.','Anti-inflamatório tópico — monografado, Cicatrizante ginecológico, Adstringente potente','Planta caiçara com dupla identidade: tempero gourmet (pimenta-rosa) e fitoterápico monografado. Casca em decocção para uso externo ginecológico — anti-inflamatório e cicatrizante via taninos concentrados.','{"adultos saudáveis","hipertensos"}','{}','100°C','10 min','1 g de cascas secas / 150 ml (uso externo)','banho de assento 3-4x ao dia','{"inflamacao","pele","ginecologico","oral"}','{"qualquer"}'),
  ('Assa-Peixe','Vernonia polyanthes Less','🌿','Respiratório','Essencial','Arbusto de pastagens brasileiras — expectorante oficial da Anvisa.','Expectorante — monografado, Anti-inflamatório, Broncodilatador leve','Arbusto pioneiro de pastagens brasileiras. Expectorante monografado pela Anvisa — saponinas estimulam secreção brônquica. Flor importante para apicultura nacional.','{"adultos saudáveis","hipertensos"}','{"gestantes","lactantes"}','95°C','10 min','3 g de folhas secas / 150 ml','1x ao dia em quadros agudos','{"respiratorio"}','{"qualquer"}'),
  ('Barbatimão','Stryphnodendron adstringens (Mart.) Coville','🌿','Pele','Funcional','Árvore do cerrado com casca cicatrizante oficial da Anvisa.','Cicatrizante — monografado, Adstringente potente, Anti-inflamatório tópico','Árvore do cerrado com a maior concentração de taninos condensados entre as ervas oficiais brasileiras. Creme cicatrizante monografado — taninos formam película proteica sobre feridas. Uso externo.','{"adultos saudáveis","hipertensos"}','{}','95°C','10 min','Creme: aplicação tópica conforme bula','2-3x ao dia','{"inflamacao","pele","ginecologico","oral"}','{"qualquer"}'),
  ('Boldo-Baiano','Vernonia condensata Baker','🌿','Digestivo','Essencial','O terceiro boldo brasileiro — folha amarga do quintal nordestino.','Antidispéptico, Hepatoativo leve, Anti-inflamatório leve','Terceira planta brasileira chamada boldo — folha amarga com sesquiterpenos lactonas. Antidispéptico monografado. Tradição afro-brasileira no Nordeste.','{"adultos saudáveis","hipertensos"}','{}','95°C','10 min','conforme monografia oficial','após refeições','{"digestao"}','{"qualquer"}'),
  ('Boldo-Brasileiro','Plectranthus barbatus Andrews','🌿','Digestivo','Essencial','O boldo do quintal brasileiro — planta africana naturalizada, gentil.','Antidispéptico — monografado, Colagogo leve, Hepatoativo suave','Planta africana (Plectranthus barbatus) naturalizada nos quintais brasileiros. Antidispéptico monografado, mais gentil que o boldo-do-chile. Forskolina é seu diterpeno característico.','{"adultos saudáveis"}','{"gestantes","lactantes","crianças","hipertensos"}','95°C','5 min','1 a 3 g de folhas / 150 ml (1 a 3 folhas frescas)','2-3x ao dia após refeições pesadas','{"digestao","hepatico"}','{"qualquer"}'),
  ('Chambá','Justicia pectoralis Jacq.','🌿','Respiratório','Essencial','Erva do Nordeste com aroma de baunilha e ação expectorante oficial.','Expectorante — monografado, Broncodilatador leve, Antitussígeno suave','Erva do Ceará com aroma de baunilha (cumarina). Expectorante monografado, permitido a partir dos 3 anos. Base do programa Farmácias Vivas da UFC.','{"adultos saudáveis","hipertensos"}','{"anticoagulantes"}','95°C','10 min','5 g de partes aéreas / 150 ml','2-3x ao dia em quadros de tosse','{"respiratorio","inflamacao"}','{"qualquer"}'),
  ('Chapéu-de-Couro','Echinodorus macrophyllus (Kunth) Micheli','🌿','Urinário','Funcional','Folha larga de brejo brasileiro — diurético e anti-inflamatório oficial.','Diurético leve — monografado, Anti-inflamatório — monografado, Antidispéptico','Folha larga de brejos brasileiros. Diurético e anti-inflamatório monografado — diterpenos clerodanos. Uso tradicional em litíase urinária e gota.','{"adultos saudáveis"}','{"gestantes","lactantes","hipertensos"}','95°C','10 min','1 g de folhas / 150 ml','3x ao dia antes das refeições','{"urinario"}','{"qualquer"}'),
  ('Copaíba','Copaifera spp. (C. langsdorffii · C. multijuga · C. reticulata)','🌿','Anti-inflamatório','Funcional','Óleo-resina do coração da Amazônia — anti-inflamatório tópico poderoso.','Anti-inflamatório tópico — monografado, Cicatrizante, Antimicrobiano','Óleo-resina extraído do tronco de árvores amazônicas centenárias. Pomada anti-inflamatória monografada — beta-cariofileno age no receptor canabinoide CB2. Três espécies oficiais.','{"adultos saudáveis","hipertensos"}','{}','95°C','10 min','Pomada: aplicação tópica conforme bula','2-3x ao dia em área afetada','{"inflamacao","pele"}','{"qualquer"}'),
  ('Erva-Baleeira','Cordia verbenacea DC.','🌿','Anti-inflamatório','Funcional','Do litoral atlântico ao primeiro fitoterápico brasileiro patenteado (Acheflan).','Anti-inflamatório tópico — monografado, Analgésico local, Antimicrobiano tópico','Planta caiçara do litoral atlântico. Primeiro fitoterápico brasileiro com pesquisa clínica completa (Acheflan). Anti-inflamatório tópico via alfa-humuleno e trans-cariofileno.','{"adultos saudáveis","hipertensos"}','{}','95°C','10 min','3 g de folhas / 150 ml (uso externo)','compressa 3x ao dia','{"inflamacao"}','{"qualquer"}'),
  ('Erva-de-Bicho','Polygonum punctatum Elliot','🌿','Anti-inflamatório','Funcional','Pimenteira-d''água das várzeas brasileiras — anti-hemorroidal oficial.','Anti-hemorroidal — monografado, Adstringente (taninos), Hemostático local','Planta de várzeas brasileiras com sabor picante (polygodial). Anti-hemorroidal monografado — banho de assento. Taninos adstringentes mais leve irritação local produzem efeito contração-cicatrização.','{"adultos saudáveis","hipertensos"}','{"gestantes","lactantes"}','95°C','10 min','3 g de partes aéreas / 150 ml (uso externo)','banho de assento 3x ao dia','{"hemorroidas"}','{"qualquer"}'),
  ('Erva-Mate','Ilex paraguariensis A.St.-Hil.','🧉','Estimulante','Essencial','Chimarrão, tererê e chá-mate — estímulo brasileiro por excelência.','Estimulante, Antioxidante, Termogênico, Diurético leve','Xantinas (cafeína mais teobromina) e polifenóis. Ritual comunitário do Sul. Consumo muito quente associado a câncer de esôfago (IARC 2A) — evitar acima de 70°C.','{"hipertensos (moderado)"}','{"gestantes","insônia","crianças","após 16h"}','70°C','4 min','1 col. sopa / 200ml','manhã-tarde','{"energia","foco","termogênico","antioxidante","tradição"}','{"manha","tarde"}'),
  ('Guaçatonga','Casearia sylvestris Sw.','🌿','Digestivo','Essencial','Erva-de-bugre da Mata Atlântica — antiulcerosa nativa brasileira.','Antidispéptico — monografado, Antiulcerogênico, Anti-inflamatório','Irmã menos famosa da espinheira-santa — antidispéptico e antiulcerogênico monografado. Casearinas (diterpenos clerodanos) com atividade antitumoral em estudos de bancada.','{"adultos saudáveis","hipertensos"}','{"gestantes","lactantes","crianças"}','95°C','5 min','2 a 4 g de folhas / 150 ml','2-3x ao dia antes das refeições','{"digestao","inflamacao","oral"}','{"qualquer"}'),
  ('Macela','Achyrocline satureioides (Lam.) DC.','🌿','Digestivo','Essencial','Flor amarela do pampa — tradição gaúcha de colher na Sexta-Feira Santa.','Antidispéptico — monografado, Antiespasmódico digestivo, Anti-inflamatório','Flor amarela do pampa, tradição gaúcha colher na Sexta-Feira Santa. Antidispéptico monografado — flavonoides com ação antiespasmódica e ansiolítica leve. Travesseiros aromáticos do Sul.','{"adultos saudáveis","hipertensos"}','{"gestantes","crianças"}','95°C','5 min','1,5 g de sumidades floridas / 150 ml','2-3x ao dia após refeições','{"digestao","inflamacao","antiespasmodico"}','{"noite"}'),
  ('Quebra-Pedra','Phyllanthus niruri L.','🌿','Urinário','Funcional','A erva que dissolve cálculos renais — litolítico oficial da Anvisa.','Litolítico — monografado, Diurético leve, Anti-inflamatório','Erva rasteira que reduz formação de cristais urinários. Litolítico monografado pela Anvisa — lignanas (filantina, hipofilantina) previnem nucleação de oxalato de cálcio. Manter hidratação.','{"adultos saudáveis","hipertensos"}','{"gestantes"}','95°C','10 min','3 g de partes aéreas / 150 ml','2-3x ao dia','{"urinario"}','{"qualquer"}')
) AS v(name, latin_name, icon, category, linha, tagline, effects, detail, safe_for, avoid_for, temp, brew_time, dose, frequency, tags, momento)
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_herbs h
  WHERE h.name = v.name AND h.latin_name = v.latin_name
);

-- ─── 3) Relatório final ───
SELECT COUNT(*) AS total_ervas_ativas
FROM public.admin_herbs
WHERE active IS DISTINCT FROM FALSE;

SELECT name, latin_name, linha, category
FROM public.admin_herbs
WHERE active IS DISTINCT FROM FALSE
ORDER BY name;
