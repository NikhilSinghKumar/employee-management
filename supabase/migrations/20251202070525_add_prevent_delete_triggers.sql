-- Prevent hard delete on generated_timesheet
CREATE OR REPLACE FUNCTION prevent_timesheet_hard_delete()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Hard delete not allowed on generated_timesheet. Use soft delete instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_timesheet_delete
BEFORE DELETE ON generated_timesheet
FOR EACH ROW
EXECUTE FUNCTION prevent_timesheet_hard_delete();


-- Prevent hard delete on generated_timesheet_summary
CREATE OR REPLACE FUNCTION prevent_timesheet_summary_hard_delete()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'Hard delete not allowed on generated_timesheet_summary. Use soft delete instead.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_timesheet_summary_delete
BEFORE DELETE ON generated_timesheet_summary
FOR EACH ROW
EXECUTE FUNCTION prevent_timesheet_summary_hard_delete();
