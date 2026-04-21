-- ============================================================
-- ERVARIA — Seed: Popular admin_herbs, admin_products + fix RLS
-- Data: 2026-04-13
-- ============================================================
-- Execute no Supabase Dashboard > SQL Editor
-- Popula as tabelas com os 28 chás e 16 produtos existentes
-- ============================================================

-- ═══ CHÁS E INFUSÕES (28) ═══

INSERT INTO public.admin_herbs (name, latin_name, icon, category, effects, detail, safe_for, avoid_for, temp, brew_time, dose, frequency, tags, momento) VALUES
('Camomila','Matricaria chamomilla','🌼','Calmante','Calmante suave, anti-inflamatória, digestiva','Apigenina se liga aos receptores GABA, promovendo relaxamento. Ideal para insônia leve, cólicas e digestão irritada. Segura para crianças, idosos e gestantes.','{"gestantes","hipertensos","crianças"}','{}','85°C','8 min','1-2 col. sopa / 250ml','2-3x ao dia','{"calmante","digestiva","anti-inflamatória","sono"}','{"tarde","qualquer"}'),
('Valeriana','Valeriana officinalis','🌸','Sono','Sedativa potente, insônia, ansiedade grave','Actua diretamente no GABA. Reduz tempo para adormecer em 30-60 min. Não associar com álcool ou benzodiazepínicos. Evitar em depressão.','{"hipertensos"}','{"gestantes","antes de dirigir"}','85°C','10 min','1 col. sopa / 250ml','1x à noite','{"sono","ansiedade","sedativa","calmante"}','{"noite"}'),
('Maracujá','Passiflora edulis','🍃','Calmante','Ansiolítico natural, relaxante, sono','Comparado a benzodiazepínicos suaves em estudos clínicos. Ideal para ansiedade com componente físico (taquicardia, tensão muscular). Seguro para uso diário.','{"hipertensos"}','{"gestantes (doses altas)"}','85°C','8 min','1-2 col. sopa / 250ml','2x ao dia + noite','{"ansiedade","sono","calmante","taquicardia"}','{"noite","tarde"}'),
('Melissa','Melissa officinalis','🍃','Calmante','Calmante, antidepressiva suave, digestiva','Inibe MAO-B, elevando serotonina e dopamina naturalmente. Excelente para quem não consegue parar de pensar. Sabor agradável de limão. Sem risco de dependência.','{"gestantes","crianças","hipertensos"}','{}','85°C','7 min','1-2 col. sopa / 250ml','3x ao dia','{"ansiedade","digestiva","calmante","antidepressiva"}','{"tarde","noite","qualquer"}'),
('Gengibre','Zingiber officinale','🫚','Digestivo','Anti-náusea, digestivo, termogênico, antigripal','Procinético: acelera esvaziamento gástrico. Anti-inflamatório que inibe COX-2 e LOX. Eficaz quanto ibuprofeno para dor menstrual em estudos.','{"hipertensos"}','{"gestantes (doses altas)","anticoagulantes"}','90°C','10 min','3-4 fatias frescas / 300ml','conforme necessidade','{"digestivo","náusea","inflamação","termogênico","gripe"}','{"manha","qualquer"}'),
('Chá Verde','Camellia sinensis','🍵','Estimulante','Foco, antioxidante, termogênico, metabolismo','L-teanina + cafeína: estado único de foco calmo. EGCG: antioxidante mais estudado do mundo. Tomar 30min antes de exercício potencializa queima de gordura.','{}','{"gestantes","insônia","hipertensos sensíveis","após 16h"}','75°C','3-4 min','1 col. sopa / 200ml','1-2x manhã','{"foco","energia","metabolismo","antioxidante"}','{"manha","tarde"}'),
('Hibisco','Hibiscus sabdariffa','🌺','Cardiovascular','Hipotensor, antioxidante, emagrecimento, vitamina C','Estudo JAMA: 3 xícaras/dia reduziram PA sistólica em média 7mmHg. Rico em antocianinas. Inibe amilase, reduzindo absorção de carboidratos.','{}','{"gestantes","pressão baixa","uso com diuréticos"}','90°C','8 min','2 col. sopa / 300ml','2-3x ao dia','{"pressão","antioxidante","emagrecimento","vitamina C"}','{"qualquer"}'),
('Alecrim','Rosmarinus officinalis','🌿','Estimulante','Foco, memória, circulação, estimulante','1,8-cineol no aroma já melhora desempenho cognitivo. Estimula circulação cerebral e periférica. Excelente para manhãs lentas e concentração. Sem cafeína.','{"hipertensos"}','{"gestantes (doses altas)","epilepsia"}','90°C','5 min','1 col. sopa / 200ml','1-2x ao dia','{"foco","memória","energia","circulação"}','{"manha","tarde"}'),
('Hortelã','Mentha piperita','🌿','Digestivo','Digestiva, carminativa, descongestionante, fresca','Mentol relaxa musculatura lisa intestinal. Alivia IBS em estudos clínicos. Descongestionante das vias aéreas.','{"hipertensos","crianças (sem óleo essencial)"}','{"gestantes (doses altas)","bebês (óleo)","refluxo grave"}','85°C','5 min','1 col. sopa / 250ml','após refeições','{"digestivo","gases","congestão","frescor"}','{"qualquer"}'),
('Erva-doce','Pimpinella anisum','🌾','Digestivo','Carminativa, antigases, cólicas, expectorante','Carminativo clássico: relaxa musculatura intestinal e libera gases. Seguro até para bebês (muito diluído). Combina muito bem com camomila e hortelã.','{"hipertensos","crianças","gestantes (uso moderado)"}','{}','90°C','7 min','1 col. sopa / 250ml','após refeições','{"gases","cólicas","digestivo","expectorante"}','{"qualquer"}'),
('Canela','Cinnamomum zeylanicum','🌿','Metabólico','Termogênica, regula glicemia, anti-inflamatória','Regula insulina, evita pico glicêmico. Termogênica e adocicada: reduz desejo por doces. Cassia tem cumarina (limitar). Prefira canela-do-ceilão.','{"hipertensos"}','{"gestantes (doses altas)","anticoagulantes"}','95°C','10 min','1 pau ou 1 col. / 300ml','2x ao dia','{"metabolismo","glicemia","termogênico","digestivo"}','{"manha","tarde"}'),
('Cúrcuma','Curcuma longa','🫚','Anti-inflamatório','Anti-inflamatório potente, hepático, antioxidante','Curcumina: inibe COX-2. Eficaz quanto ibuprofeno em artrite em estudos. Adicionar pimenta-do-reino aumenta absorção em 2000%.','{"hipertensos"}','{"gestantes (doses altas)","pedras na vesícula","anticoagulantes"}','90°C','10 min','1 col. chá + pitada pimenta / 250ml','2x ao dia','{"anti-inflamatório","fígado","articulações","antioxidante"}','{"qualquer"}'),
('Alfazema','Lavandula angustifolia','💜','Calmante','Ansiolítica, sedativa suave, dor de cabeça','Estudo Lasea: eficaz quanto lorazepam para ansiedade leve. Reduz ondas beta cerebrais. Aroma + infusão combinados têm efeito sinérgico.','{"hipertensos"}','{"gestantes"}','85°C','8 min','1 col. sopa flores / 250ml','2x ao dia','{"ansiedade","sono","dor de cabeça","calmante"}','{"tarde","noite"}'),
('Boldo','Peumus boldus','🍃','Digestivo','Hepático, digestivo, alivia peso pós-refeição','Colagogo clássico: estimula produção e fluxo de bile. Alivia sensação de peso em 20-30 min. Não usar por mais de 6 semanas seguidas.','{"hipertensos"}','{"gestantes","obstrução biliar","uso prolongado"}','90°C','5 min','1 col. sopa / 250ml','após refeição gordurosa','{"fígado","digestivo","bile","ressaca"}','{"qualquer"}'),
('Alcachofra','Cynara scolymus','🌱','Digestivo','Detox fígado, reduz colesterol, diurética','Cinarina: aumenta produção de bile. Colerético + detox suave e progressivo. Combina com boldo para digestão pesada.','{"hipertensos"}','{"gestantes","obstrução biliar","alergia a asteráceas"}','90°C','10 min','1-2 col. sopa / 300ml','2x ao dia','{"fígado","colesterol","digestivo","detox"}','{"qualquer"}'),
('Guaco','Mikania glomerata','🍃','Respiratório','Broncodilatador, expectorante, tosse, gripe','Regulamentado pela ANVISA como fitoterápico. Broncodilatador natural mais eficaz. Pode ser usado como xarope ou chá.','{"hipertensos"}','{"gestantes","uso prolongado sem supervisão"}','90°C','10 min','2 col. sopa / 300ml','3-4x ao dia (gripe)','{"tosse","bronquite","gripe","expectorante"}','{"qualquer"}'),
('Capim-Limão','Cymbopogon citratus','🌾','Calmante','Calmante, digestivo, antigripal, febre','Sabor cítrico agradável. Calmante sem sonolência intensa. Antipirético e antigripal suave. Muito consumido no Brasil.','{"gestantes","hipertensos","crianças"}','{}','90°C','8 min','2-3 folhas frescas / 300ml','3x ao dia','{"calmante","febre","digestivo","cítrico"}','{"qualquer"}'),
('Folha de Amora','Morus nigra','🍃','Hormonal','Menopausa, suores noturnos, fitoestrogênios','Fitoestrogênios reduzem sintomas da menopausa. Estudo: reduz calores em 50% em 8 semanas. Hipoglicemiante suave.','{"hipertensos"}','{"gestantes","câncer hormônio-dependente"}','88°C','10 min','1-2 col. sopa / 250ml','2x ao dia','{"menopausa","hormônios","fitoestrogênio","hipoglicemiante"}','{"tarde","noite"}'),
('Erva Cidreira','Lippia alba','🍃','Calmante','Calmante suave, digestiva, ansiedade','Calmante brasileiro clássico. Suave e seguro para toda a família. Ideal para estresse diário leve sem causar sedação.','{"gestantes","crianças","hipertensos"}','{}','85°C','7 min','1-2 col. sopa / 250ml','3x ao dia','{"calmante","ansiedade","digestivo","família"}','{"tarde","noite","qualquer"}'),
('Espinheira Santa','Maytenus ilicifolia','🌿','Digestivo','Gastrite, úlcera, acidez, antiácido natural','Antiácido e cicatrizante natural da mucosa gástrica. Regulado pela ANVISA. Tomar em jejum e antes das refeições.','{"hipertensos"}','{"gestantes","amamentação"}','88°C','10 min','1 col. sopa / 250ml','3x ao dia em jejum','{"gastrite","úlcera","acidez","estômago"}','{"qualquer"}'),
('Carqueja','Baccharis trimera','🌿','Metabólico','Termogênica, digestiva, saciedade, diabetes','Termogênica e reduz absorção de gordura. Auxiliar no emagrecimento. Amargo: combinar com canela para suavizar.','{"hipertensos"}','{"gestantes"}','90°C','8 min','1 col. sopa / 250ml','antes das refeições','{"emagrecimento","termogênico","diabetes","fígado"}','{"manha","tarde"}'),
('Ginkgo Biloba','Ginkgo biloba','🍃','Cognitivo','Memória, circulação cerebral, concentração','Aumenta fluxo sanguíneo cerebral. Resultados em 4-6 semanas de uso contínuo. Evitar com anticoagulantes.','{"hipertensos"}','{"gestantes","anticoagulantes","antes de cirurgia"}','90°C','10 min','1 col. sopa / 250ml','2x ao dia','{"memória","foco","circulação","cognitivo"}','{"manha","tarde"}'),
('Hibisco Azul','Clitoria ternatea','💙','Cognitivo','Antioxidante, memória, ansiedade, muda de cor','Muda de roxo para rosa/vermelho com limão (antocianinas sensíveis ao pH). Antioxidante cerebral. Estudos mostram melhora em testes cognitivos.','{"hipertensos"}','{"gestantes"}','90°C','5 min','1-2 col. sopa / 250ml','1-2x ao dia','{"cognitivo","antioxidante","memória","beleza"}','{"tarde","qualquer"}'),
('Calêndula','Calendula officinalis','🌸','Pele','Cicatrizante, anti-inflamatória, antifúngica','Cicatrizante interno e externo. Anti-inflamatória da mucosa e pele. Usar também como compressa.','{"hipertensos"}','{"gestantes","alergia a asteráceas"}','88°C','8 min','1-2 col. sopa flores / 250ml','2-3x ao dia','{"pele","cicatrizante","anti-inflamatório","gastrite"}','{"qualquer"}'),
('Rooibos','Aspalathus linearis','🍃','Antioxidante','Antioxidante potente, sem cafeína, anti-aging','Antioxidante 50x mais potente que chá verde segundo alguns estudos. Sem cafeína: ideal à tarde e noite. Rico em minerais.','{"gestantes","crianças","hipertensos"}','{}','95°C','5-7 min','1-2 col. sopa / 300ml','a qualquer hora','{"antioxidante","sem cafeína","anti-aging","pele"}','{"tarde","noite","qualquer"}'),
('Ashwagandha','Withania somnifera','🌿','Adaptogênico','Reduz cortisol, estresse, energia, libido','Reduce cortisol em até 30% em estudos. Adaptogênico: acalma sob estresse, energiza sob fadiga. Resultados em 4-8 semanas.','{"hipertensos"}','{"gestantes","hipertireoidismo","doenças autoimunes"}','90°C','10 min','1 col. chá pó / 250ml','2x ao dia','{"adaptogênico","estresse","cortisol","libido"}','{"tarde","noite"}'),
('Guaraná','Paullinia cupana','🫐','Estimulante','Estimulante, foco, metabolismo, emagrecimento','Cafeína de liberação mais lenta que o café. Menos pico e queda. Rico em taninos e guaranina.','{}','{"gestantes","hipertensos","insônia","crianças","após 15h"}','85°C','5 min','1/2 col. chá pó / 250ml','1x manhã','{"energia","foco","metabolismo","estimulante"}','{"manha"}'),
('Tomilho','Thymus vulgaris','🌿','Respiratório','Expectorante, antisséptico, tosse, bronquite','Timol: antisséptico pulmonar potente. Usado como xarope na Europa há séculos. Dissolve muco e desinfeta vias aéreas.','{"hipertensos"}','{"gestantes (doses altas)"}','90°C','8 min','1 col. sopa / 250ml','3x ao dia','{"tosse","expectorante","bronquite","antisséptico"}','{"qualquer"}');

-- ═══ PRODUTOS (16) ═══

INSERT INTO public.admin_products (name, icon, category, price, unit, supplier, stock) VALUES
('Camomila Orgânica','🌼','Folhas Secas',12.90,'50g','Ervas & Raízes','in'),
('Melissa Premium','🍃','Folhas Secas',14.50,'30g','Ervas & Raízes','in'),
('Blend Serenidade','💜','Blends',28.90,'60g','Ervas & Raízes','in'),
('Boldo do Chile','🍃','Folhas Secas',8.90,'50g','Casa das Plantas','in'),
('Guaco 100% Natural','🌿','Folhas Secas',11.90,'40g','Casa das Plantas','low'),
('Ginkgo Biloba Extrato','🍃','Extratos',34.90,'30g','Phytofarm Brasil','in'),
('Ashwagandha Raiz Pó','🌿','Pós',42.90,'100g','Phytofarm Brasil','in'),
('Valeriana Orgânica','🌸','Folhas Secas',18.90,'30g','Phytofarm Brasil','in'),
('Cúrcuma + Pimenta','🫚','Blends',22.90,'80g','Verde Vivo','in'),
('Gengibre Desidratado','🫚','Especiarias',16.90,'100g','Verde Vivo','in'),
('Hibisco Flores Secas','🌺','Flores',13.90,'40g','Verde Vivo','in'),
('Chá Verde Sencha','🍵','Chás Finos',38.90,'50g','TeaImport','in'),
('Rooibos Orgânico','🍃','Chás Finos',29.90,'80g','TeaImport','in'),
('Hibisco Azul','💙','Chás Finos',45.90,'30g','TeaImport','low'),
('Kit Blend Digestivo','🌿','Kits',54.90,'kit 3 ervas','Verde Vivo','in'),
('Infusor Aço Inox','🫖','Acessórios',24.90,'1 unid','Ervas & Raízes','in');

-- ═══ FIX RLS: Admin pode ver todos os perfis ═══
-- (DROP + CREATE para evitar erro "already exists")
DROP POLICY IF EXISTS "profiles_admin_read" ON public.user_profiles;
CREATE POLICY "profiles_admin_read" ON public.user_profiles FOR SELECT
  USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP POLICY IF EXISTS "profiles_admin_delete" ON public.user_profiles;
CREATE POLICY "profiles_admin_delete" ON public.user_profiles FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ═══ TABELA FORNECEDORES ═══
CREATE TABLE IF NOT EXISTS public.admin_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  city TEXT,
  since TEXT,
  certification TEXT,
  shipping TEXT,
  min_order TEXT,
  herbs TEXT[] DEFAULT '{}',
  color TEXT DEFAULT '#2d5a3a',
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suppliers_public_read" ON public.admin_suppliers FOR SELECT USING (active = TRUE);
CREATE POLICY "suppliers_admin_all" ON public.admin_suppliers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = TRUE));

DROP TRIGGER IF EXISTS trg_suppliers_updated ON public.admin_suppliers;
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON public.admin_suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══ LINHA (classificação comercial) ═══
-- Popula a coluna `linha` para as 28 ervas (Essencial / Global / Funcional).
-- Seguro para rodar múltiplas vezes.

UPDATE public.admin_herbs SET linha='Essencial' WHERE name IN (
  'Camomila','Maracujá','Melissa','Gengibre','Hortelã','Erva-doce','Boldo',
  'Alcachofra','Guaco','Capim-Limão','Folha de Amora','Erva Cidreira',
  'Espinheira Santa','Carqueja','Calêndula','Tomilho'
);
UPDATE public.admin_herbs SET linha='Global' WHERE name IN (
  'Chá Verde','Hibisco','Rooibos','Ashwagandha','Ginkgo Biloba','Hibisco Azul','Guaraná'
);
UPDATE public.admin_herbs SET linha='Funcional' WHERE name IN (
  'Valeriana','Canela','Cúrcuma','Alecrim','Alfazema'
);

-- ═══ SEED FORNECEDORES (6) ═══
INSERT INTO public.admin_suppliers (name, type, city, since, certification, shipping, min_order, herbs, color) VALUES
('Ervas & Raízes','Produtor Orgânico','São Paulo, SP','2008','IBD Orgânico','Todo Brasil','R$ 80','{"Camomila","Melissa","Erva Cidreira","Calêndula","Alfazema"}','#2d5a3a'),
('Casa das Plantas','Ervateiro Tradicional','Belo Horizonte, MG','1992','Artesanal','Sul/Sudeste','R$ 50','{"Boldo","Guaco","Carqueja","Arruda","Erva-doce"}','#4a3a1a'),
('Phytofarm Brasil','Distribuidor Nacional','Curitiba, PR','2005','GMP + ANVISA','Todo Brasil','R$ 120','{"Ginkgo Biloba","Ashwagandha","Bacopa","Valeriana","Rooibos"}','#2a3a5a'),
('Verde Vivo','Orgânico & Biodinâmico','Florianópolis, SC','2015','Demeter Biodinâmico','Todo Brasil','R$ 100','{"Cúrcuma","Gengibre","Canela","Hibisco","Capim-Limão"}','#3a5a2a'),
('Temperos do Cerrado','Produtor Regional','Goiânia, GO','2010','Agroecológico','Centro-Oeste/Norte','R$ 60','{"Espinheira Santa","Barbatimão","Sucupira","Jatobá","Pau-terra"}','#5a4a1a'),
('TeaImport','Importador Especializado','São Paulo, SP','2012','SIF + Vigilância','Todo Brasil','R$ 150','{"Chá Verde","Chá Branco","Rooibos","Hibisco Azul","Tulsi"}','#1a3a5a');
