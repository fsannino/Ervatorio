-- ============================================================
-- ERVARIA — Popula admin_herbs.img para as 28 ervas do catálogo local
-- Data: 2026-04-22
-- ============================================================
-- Execute no Supabase Dashboard > SQL Editor.
-- Idempotente: pode ser rodado múltiplas vezes (usa UPDATE).
-- Complementa ervaria-seed-data.sql, que não populava a coluna img
-- (adicionada posteriormente via ervaria-admin-migration.sql).
-- ============================================================

-- Garante que a coluna existe (idempotente, replicado da admin-migration).
ALTER TABLE public.admin_herbs
  ADD COLUMN IF NOT EXISTS img TEXT;

-- 28 ervas do catálogo local (js/app.js → HERBS) com imagem já presente
-- em images/produtos/. O match é feito por name — precisa casar exatamente
-- com o valor gravado em admin_herbs.name.
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

-- Relatório
SELECT name, img FROM public.admin_herbs WHERE img IS NOT NULL ORDER BY name;
