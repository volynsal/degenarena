-- Community Upvotes Table
-- Run this in Supabase SQL Editor after 001_initial_schema.sql

-- =============================================
-- FORMULA UPVOTES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS formula_upvotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  formula_id UUID NOT NULL REFERENCES formulas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each user can only upvote a formula once
  UNIQUE(formula_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_formula_upvotes_formula_id ON formula_upvotes(formula_id);
CREATE INDEX IF NOT EXISTS idx_formula_upvotes_user_id ON formula_upvotes(user_id);

-- Enable RLS
ALTER TABLE formula_upvotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all upvotes" ON formula_upvotes
  FOR SELECT USING (true);

CREATE POLICY "Users can upvote formulas" ON formula_upvotes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their upvotes" ON formula_upvotes
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- ADD UPVOTE COUNT TO FORMULAS TABLE
-- =============================================
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0;
ALTER TABLE formulas ADD COLUMN IF NOT EXISTS copy_count INTEGER DEFAULT 0;

-- Create index for sorting by upvotes
CREATE INDEX IF NOT EXISTS idx_formulas_upvote_count ON formulas(upvote_count DESC);

-- =============================================
-- FUNCTION TO UPDATE UPVOTE COUNT
-- =============================================
CREATE OR REPLACE FUNCTION update_formula_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE formulas SET upvote_count = upvote_count + 1 WHERE id = NEW.formula_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE formulas SET upvote_count = upvote_count - 1 WHERE id = OLD.formula_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for upvote count
DROP TRIGGER IF EXISTS update_upvote_count_trigger ON formula_upvotes;
CREATE TRIGGER update_upvote_count_trigger
  AFTER INSERT OR DELETE ON formula_upvotes
  FOR EACH ROW EXECUTE FUNCTION update_formula_upvote_count();

-- =============================================
-- FUNCTION TO UPDATE COPY COUNT
-- =============================================
CREATE OR REPLACE FUNCTION update_formula_copy_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE formulas SET copy_count = copy_count + 1 WHERE id = NEW.original_formula_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for copy count
DROP TRIGGER IF EXISTS update_copy_count_trigger ON formula_copies;
CREATE TRIGGER update_copy_count_trigger
  AFTER INSERT ON formula_copies
  FOR EACH ROW EXECUTE FUNCTION update_formula_copy_count();
