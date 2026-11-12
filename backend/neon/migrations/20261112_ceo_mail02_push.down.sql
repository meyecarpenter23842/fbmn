-- Rollback only if no mail push events exist; preserve delivery receipts.
BEGIN;
DO $guard$
BEGIN
 IF EXISTS(SELECT 1 FROM fbmn_catalog_private.ceo_push_events WHERE kind='mail') THEN
  RAISE EXCEPTION 'Refusing rollback with existing email push events';
 END IF;
END $guard$;
ALTER TABLE fbmn_catalog_private.ceo_push_events
 DROP CONSTRAINT ceo_push_events_kind_check;
ALTER TABLE fbmn_catalog_private.ceo_push_events
 ADD CONSTRAINT ceo_push_events_kind_check
 CHECK(kind IN ('chat','contact','outsourcing'));
COMMIT;
