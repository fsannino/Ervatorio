-- ============================================================
-- ERVARIA — Popula admin_herbs.img para as 42 ervas do catálogo local
-- Data: 2026-04-23 (expandido de 28 para 42 ervas)
-- ============================================================
-- Execute no Supabase Dashboard > SQL Editor.
-- Idempotente: pode ser rodado múltiplas vezes (usa UPDATE).
-- Complementa ervaria-seed-data.sql, que não populava a coluna img
-- (adicionada posteriormente via ervaria-admin-migration.sql).
-- ============================================================

-- Garante que a coluna existe (idempotente, replicado da admin-migration).
ALTER TABLE public.admin_herbs
  ADD COLUMN IF NOT EXISTS img TEXT;

-- 42 ervas do catálogo local (js/app.js → HERBS) com imagem já presente
-- em images/produtos/. O match é feito por name — precisa casar exatamente
-- com o valor gravado em admin_herbs.name.
-- ─── Bloco 1: 28 ervas originais ───
UPDATE public.admin_herbs SET img = 'images/produtos/camomila.jpg'             WHERE name = 'Camomila'            AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/valeriana.png'            WHERE name = 'Valeriana'           AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/maracuja.png'             WHERE name = 'Maracujá'            AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/melissa.png'              WHERE name = 'Melissa'             AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/gengibre.jpg'             WHERE name = 'Gengibre'            AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/matcha.png'               WHERE name = 'Chá Verde'           AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/hibisco.jpg'              WHERE name = 'Hibisco'             AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/alecrim.png'              WHERE name = 'Alecrim'             AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/hortela.jpg'              WHERE name = 'Hortelã'             AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/erva-doce.jpg'            WHERE name = 'Erva-doce'           AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/canela.png'               WHERE name = 'Canela'              AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/curcuma.png'              WHERE name = 'Cúrcuma'             AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/lavanda.jpg'              WHERE name = 'Alfazema'            AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/boldo-espinheira-santa.png' WHERE name = 'Boldo'             AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/alcachofra.png'           WHERE name = 'Alcachofra'          AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/guaco.png'                WHERE name = 'Guaco'               AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/capim-limao.png'          WHERE name = 'Capim-Limão'         AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/hibisco-azul-e-amora.png' WHERE name = 'Folha de Amora'      AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/erva-cidreira.png'        WHERE name = 'Erva Cidreira'       AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/boldo-espinheira-santa.png' WHERE name = 'Espinheira Santa'  AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/carqueja.png'             WHERE name = 'Carqueja'            AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/ginkgo-biloba.png'        WHERE name = 'Ginkgo Biloba'       AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/hibisco-azul-e-amora.png' WHERE name = 'Hibisco Azul'        AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/calendula.png'            WHERE name = 'Calêndula'           AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/rooibos.png'              WHERE name = 'Rooibos'             AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/ashwagandha.png'          WHERE name = 'Ashwagandha'         AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/guarana.png'              WHERE name = 'Guaraná'             AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/tomilho.jpg'              WHERE name = 'Tomilho'             AND (img IS NULL OR img = '');

-- ─── Bloco 2: 14 ervas brasileiras novas ───
UPDATE public.admin_herbs SET img = 'images/produtos/aroeira-da-praia.jpg'     WHERE name = 'Aroeira-da-Praia'    AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/assa-peixe.jpg'           WHERE name = 'Assa-Peixe'          AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/barbatimao.jpg'           WHERE name = 'Barbatimão'          AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/boldo-baiano.jpg'         WHERE name = 'Boldo-Baiano'        AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/boldo-brasileiro.jpg'     WHERE name = 'Boldo-Brasileiro'    AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/chamba.jpg'               WHERE name = 'Chambá'              AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/chapeu-de-couro.jpg'      WHERE name = 'Chapéu-de-Couro'     AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/copaiba.jpg'              WHERE name = 'Copaíba'             AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/erva-baleeira.jpg'        WHERE name = 'Erva-Baleeira'       AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/erva-de-bicho.jpg'        WHERE name = 'Erva-de-Bicho'       AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/erva-mate.jpg'            WHERE name = 'Erva-Mate'           AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/guacatonga.jpg'           WHERE name = 'Guaçatonga'          AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/macela.jpg'               WHERE name = 'Macela'              AND (img IS NULL OR img = '');
UPDATE public.admin_herbs SET img = 'images/produtos/quebra-pedra.jpg'         WHERE name = 'Quebra-Pedra'        AND (img IS NULL OR img = '');

-- Relatório: deve retornar 42 linhas com img preenchida.
SELECT name, img FROM public.admin_herbs WHERE img IS NOT NULL ORDER BY name;
