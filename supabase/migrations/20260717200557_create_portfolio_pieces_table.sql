/*
# Create portfolio_pieces table for Quinty's Portfolio

1. New Tables
- `portfolio_pieces`
  - `id` (uuid, primary key)
  - `title` (text, not null) — title of the art piece
  - `description` (text) — 1-2 sentence description
  - `image_path` (text) — storage path for uploaded image
  - `tag` (text) — 'academic' or 'personal'
  - `status` (text) — 'published' or 'draft'
  - `is_featured` (boolean, default false) — admin-selected featured flag
  - `featured_until` (timestamptz) — when admin feature expires (1 month from set)
  - `likes` (int, default 0) — like count from visitors
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `portfolio_pieces`.
- Allow anon + authenticated to SELECT published pieces (public viewing).
- Allow anon + authenticated to SELECT draft pieces (admin viewing without auth).
- Allow anon + authenticated to INSERT (upload new art).
- Allow anon + authenticated to UPDATE (feature toggle, like increment, edit).
- Allow anon + authenticated to DELETE (remove pieces).
- This is a single-tenant personal portfolio with no sign-in screen.

3. Notes
- No user_id / auth.users foreign key — single-tenant, no auth flow.
- Likes are tracked as a simple integer counter; visitor likes increment via UPDATE.
- Featured logic: is_featured + featured_until (1 month) takes priority, then likes, then most recent.
*/

CREATE TABLE IF NOT EXISTS portfolio_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  image_path text DEFAULT '',
  tag text NOT NULL DEFAULT 'personal' CHECK (tag IN ('academic', 'personal')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  is_featured boolean NOT NULL DEFAULT false,
  featured_until timestamptz,
  likes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portfolio_pieces ENABLE ROW LEVEL SECURITY;

-- Allow reading all pieces (both published and draft) for anon + authenticated
DROP POLICY IF EXISTS "anon_select_portfolio_pieces" ON portfolio_pieces;
CREATE POLICY "anon_select_portfolio_pieces"
ON portfolio_pieces FOR SELECT
TO anon, authenticated USING (true);

-- Allow inserting new pieces
DROP POLICY IF EXISTS "anon_insert_portfolio_pieces" ON portfolio_pieces;
CREATE POLICY "anon_insert_portfolio_pieces"
ON portfolio_pieces FOR INSERT
TO anon, authenticated WITH CHECK (true);

-- Allow updating pieces (feature toggle, likes, edits)
DROP POLICY IF EXISTS "anon_update_portfolio_pieces" ON portfolio_pieces;
CREATE POLICY "anon_update_portfolio_pieces"
ON portfolio_pieces FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

-- Allow deleting pieces
DROP POLICY IF EXISTS "anon_delete_portfolio_pieces" ON portfolio_pieces;
CREATE POLICY "anon_delete_portfolio_pieces"
ON portfolio_pieces FOR DELETE
TO anon, authenticated USING (true);

-- Create an index on created_at for sorting by most recent
CREATE INDEX IF NOT EXISTS idx_portfolio_pieces_created_at ON portfolio_pieces (created_at DESC);

-- Create an index on likes for sorting by popularity
CREATE INDEX IF NOT EXISTS idx_portfolio_pieces_likes ON portfolio_pieces (likes DESC);

-- Create an index on status for filtering published vs draft
CREATE INDEX IF NOT EXISTS idx_portfolio_pieces_status ON portfolio_pieces (status);
