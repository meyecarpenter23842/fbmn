-- Read-only audit. Run against staging branch. Each SELECT should be inspected; no secrets or rows returned.
SELECT count(*) AS table_count FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='fbmn_public' AND c.relkind='r';
SELECT count(*) AS view_count FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='fbmn_public' AND c.relkind='v';
SELECT c.relname AS relation,c.relkind AS kind,has_table_privilege('fbmn_public_reader',c.oid,'SELECT') AS can_select FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='fbmn_public' AND c.relkind IN ('r','v') ORDER BY c.relkind,c.relname;
SELECT c.relname AS private_relation,has_table_privilege('fbmn_public_reader',c.oid,'SELECT') AS can_select FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='futurebook' AND c.relkind='r' ORDER BY c.relname;
SELECT rolname,rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolbypassrls FROM pg_roles WHERE rolname='fbmn_public_reader';
-- To impersonate reader on dedicated staging ONLY, an authorized DBA may temporarily grant SET,
-- execute SET LOCAL ROLE within a transaction, test allowed and rejected SELECTs,
-- then REVOKE membership. No LOGIN credentials should be created by this PR.
