-- Clan Settings Enhancements
-- Adds telegram link and allows multiple owners

-- Add telegram_link to clans table
ALTER TABLE clans ADD COLUMN IF NOT EXISTS telegram_link TEXT;

-- Update the role constraint to be clearer about multiple owners being allowed
-- The existing constraint allows 'owner', 'admin', 'member' - that's fine
-- We just need to allow multiple people to have 'owner' role

-- Add a check to ensure max 5 owners per clan (enforced at application level too)
-- We'll use a trigger for this

CREATE OR REPLACE FUNCTION check_max_owners()
RETURNS TRIGGER AS $$
DECLARE
  owner_count INTEGER;
BEGIN
  -- Only check on INSERT or UPDATE to owner role
  IF NEW.role = 'owner' THEN
    SELECT COUNT(*) INTO owner_count
    FROM clan_members
    WHERE clan_id = NEW.clan_id AND role = 'owner';
    
    -- If this is an update from non-owner to owner, the count doesn't include this row yet
    -- If this is an insert, the count doesn't include this row yet
    -- So we check if count >= 5 (meaning adding this would make it 6+)
    IF owner_count >= 5 THEN
      RAISE EXCEPTION 'A clan can have at most 5 owners';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for max owners check
DROP TRIGGER IF EXISTS check_max_owners_trigger ON clan_members;
CREATE TRIGGER check_max_owners_trigger
  BEFORE INSERT OR UPDATE OF role ON clan_members
  FOR EACH ROW
  EXECUTE FUNCTION check_max_owners();

-- Update RLS policy for clan_members to allow owners to update roles
DROP POLICY IF EXISTS "Owners can update member roles" ON clan_members;
CREATE POLICY "Owners can update member roles" ON clan_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM clan_members cm
      WHERE cm.clan_id = clan_members.clan_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'owner'
    )
  );
