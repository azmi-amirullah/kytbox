-- Add folder support to links table
ALTER TABLE "public"."links"
  ADD COLUMN IF NOT EXISTS "is_folder" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "parent_id" UUID REFERENCES "public"."links"("id") ON DELETE CASCADE;

-- Create an index for faster lookups since we will query by parent_id often
CREATE INDEX IF NOT EXISTS idx_links_parent_id ON "public"."links"("parent_id");
