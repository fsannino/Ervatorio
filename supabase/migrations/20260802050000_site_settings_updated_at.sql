-- ============================================================
-- site_settings.updated_at: a coluna existia e mentia
-- ============================================================
-- `site_settings` guarda `payments_enabled`, o kill-switch que decide
-- se a loja aceita compra. A tabela tem `updated_at` desde sempre —
-- e nenhum trigger que a mantenha. Só era escrita quando alguém a
-- passava explicitamente no UPDATE, o que ninguém faz.
--
-- Verificado em produção antes desta migration: `updated_at` marcava
-- 2026-07-27, enquanto `payments_enabled` foi virado para false em
-- 2026-07-30. Ou seja, a coluna não estava "vazia" ou "desatualizada":
-- ela afirmava uma data errada para a última mudança.
--
-- Isso é pior que não ter carimbo nenhum. Sem coluna, quem investiga
-- sabe que precisa procurar em outro lugar. Com uma coluna que mente,
-- a investigação para no primeiro resultado plausível — e este é o
-- registro que responde "desde quando a loja está fora do ar?" ou
-- "quando os pagamentos foram religados?".
--
-- ── O que esta migration NÃO faz ──
-- Não corrige o valor histórico. O carimbo atual está errado, mas eu
-- não sei a hora certa da mudança — só sei que não foi aquela. Chutar
-- uma data seria trocar um dado errado por outro dado errado, agora
-- com aparência de correção. Fica errado e documentado; a partir daqui
-- passa a estar certo.
--
-- Também não registra QUEM mudou. Isso é trabalho da trilha de
-- auditoria (migration 20260802030000_admin_audit_log.sql), que no
-- momento em que escrevo está no repositório mas NÃO aplicada no
-- banco. As duas coisas são complementares e nenhuma substitui a
-- outra: `updated_at` é barato e consultável em linha; a trilha diz
-- autor e valor anterior.
--
-- Como testar:
--   update public.site_settings set payments_enabled = payments_enabled
--    where id = 1;
--   select updated_at from public.site_settings where id = 1;  -- ~agora
--
-- Rollback:
--   DROP TRIGGER IF EXISTS set_updated_at ON public.site_settings;
-- A coluna volta a congelar no último valor gravado.
-- ============================================================

DROP TRIGGER IF EXISTS set_updated_at ON public.site_settings;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMENT ON COLUMN public.site_settings.updated_at IS
  'Momento da última alteração da linha, mantido pelo trigger '
  'set_updated_at. ATENÇÃO: valores anteriores a 2026-08-02 não são '
  'confiáveis — antes desta data não havia trigger e a coluna só era '
  'escrita se alguém a passasse à mão, o que não acontecia. Para saber '
  'QUEM mudou, ver admin_audit_log.';
