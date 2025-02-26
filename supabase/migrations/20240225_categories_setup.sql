-- Function to create categories table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_categories_table()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'categories'
  ) INTO table_exists;
  
  -- Create table if it doesn't exist
  IF NOT table_exists THEN
    EXECUTE '
      CREATE TABLE public.categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id INTEGER REFERENCES public.categories(id),
        slug TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
      
      -- Enable RLS
      ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
      
      -- Add policies
      CREATE POLICY "Allow public read access" ON public.categories
        FOR SELECT USING (true);
      
      CREATE POLICY "Allow authenticated insert" ON public.categories
        FOR INSERT WITH CHECK (auth.role() = ''authenticated'');
      
      CREATE POLICY "Allow authenticated update" ON public.categories
        FOR UPDATE USING (auth.role() = ''authenticated'');
      
      CREATE POLICY "Allow authenticated delete" ON public.categories
        FOR DELETE USING (auth.role() = ''authenticated'');
    ';
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$; 