-- CEO-MAIL02: permit inbound email notification IDs in existing private push queue.
-- Deploy only after Owner approves production migration; no customer content stored.
BEGIN;
DO $check$
BEGIN
 IF to_regclass('fbmn_catalog_private.ceo_push_events') IS NULL THEN
  RAISE EXCEPTION 'DL12C push queue must exist before CEO-MAIL02';
 END IF;
END $check$;
ALTER TABLE fbmn_catalog_private.ceo_push_events
 DROP CONSTRAINT ceo_push_events_kind_check;
ALTER TABLE fbmn_catalog_private.ceo_push_events
 ADD CONSTRAINT ceo_push_events_kind_check
 CHECK(kind IN ('chat','contact','outsourcing','mail'));
COMMIT;
