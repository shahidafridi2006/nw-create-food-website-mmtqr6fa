-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dishes table
CREATE TABLE IF NOT EXISTS public.dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  ingredients TEXT[],
  allergens TEXT[],
  calories INTEGER,
  preparation_time INTEGER,
  spice_level INTEGER DEFAULT 0 CHECK (spice_level >= 0 AND spice_level <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_dishes_category_id ON public.dishes(category_id);
CREATE INDEX IF NOT EXISTS idx_dishes_is_featured ON public.dishes(is_featured);
CREATE INDEX IF NOT EXISTS idx_dishes_is_available ON public.dishes(is_available);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (public read, authenticated write)
CREATE POLICY "Categories are viewable by everyone" 
  ON public.categories FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert categories" 
  ON public.categories FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update categories" 
  ON public.categories FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete categories" 
  ON public.categories FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create policies for dishes (public read, authenticated write)
CREATE POLICY "Dishes are viewable by everyone" 
  ON public.dishes FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert dishes" 
  ON public.dishes FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update dishes" 
  ON public.dishes FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete dishes" 
  ON public.dishes FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dishes_updated_at
  BEFORE UPDATE ON public.dishes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample categories
INSERT INTO public.categories (name, description, slug, image_url) VALUES
  ('Appetizers', 'Start your meal with our delicious appetizers', 'appetizers', 'https://images.unsplash.com/photo-1541014741259-51333b0b2542?w=400'),
  ('Main Courses', 'Hearty and satisfying main dishes', 'main-courses', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'),
  ('Desserts', 'Sweet endings to complete your dining experience', 'desserts', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400'),
  ('Beverages', 'Refreshing drinks and beverages', 'beverages', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400'),
  ('Specials', 'Chef''s special creations and seasonal dishes', 'specials', 'https://images.unsplash.com/photo-1504674900243-087386963a6e?w=400');

-- Insert sample dishes
INSERT INTO public.dishes (name, description, price, image_url, category_id, is_featured, ingredients, allergens, calories, preparation_time, spice_level) VALUES
  ('Crispy Calamari', 'Golden fried calamari served with marinara sauce and lemon wedges', 12.99, 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400', (SELECT id FROM public.categories WHERE slug = 'appetizers'), true, ARRAY['Calamari', 'Flour', 'Eggs', 'Marinara Sauce', 'Lemon'], ARRAY['Shellfish', 'Gluten', 'Eggs'], 350, 15, 0),
  ('Bruschetta Trio', 'Three varieties of bruschetta: tomato basil, mushroom truffle, and roasted pepper', 10.99, 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400', (SELECT id FROM public.categories WHERE slug = 'appetizers'), false, ARRAY['Bread', 'Tomatoes', 'Mushrooms', 'Peppers', 'Garlic', 'Olive Oil'], ARRAY['Gluten'], 280, 10, 0),
  ('Stuffed Mushrooms', 'Button mushrooms filled with herb cream cheese and breadcrumbs', 9.99, 'https://images.unsplash.com/photo-1621996346565-e615f504d185?w=400', (SELECT id FROM public.categories WHERE slug = 'appetizers'), false, ARRAY['Mushrooms', 'Cream Cheese', 'Herbs', 'Breadcrumbs'], ARRAY['Dairy', 'Gluten'], 220, 12, 0),
  ('Grilled Salmon', 'Atlantic salmon fillet with lemon dill sauce, served with seasonal vegetables', 28.99, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400', (SELECT id FROM public.categories WHERE slug = 'main-courses'), true, ARRAY['Salmon', 'Lemon', 'Dill', 'Vegetables', 'Olive Oil'], ARRAY['Fish'], 520, 25, 0),
  ('Filet Mignon', '8oz prime beef tenderloin with red wine reduction and truffle mashed potatoes', 42.99, 'https://images.unsplash.com/photo-1558030006-450675393462?w=400', (SELECT id FROM public.categories WHERE slug = 'main-courses'), true, ARRAY['Beef', 'Red Wine', 'Potatoes', 'Truffle', 'Butter'], ARRAY['Dairy'], 680, 30, 0),
  ('Chicken Parmesan', 'Breaded chicken breast with marinara sauce and melted mozzarella', 22.99, 'https://images.unsplash.com/photo-1632778149955-e80f9ce953e1?w=400', (SELECT id FROM public.categories WHERE slug = 'main-courses'), false, ARRAY['Chicken', 'Breadcrumbs', 'Marinara', 'Mozzarella', 'Parmesan'], ARRAY['Gluten', 'Dairy'], 590, 25, 0),
  ('Vegetable Stir Fry', 'Fresh seasonal vegetables in ginger soy sauce with jasmine rice', 18.99, 'https://images.unsplash.com/photo-1512058564366-18510be22119?w=400', (SELECT id FROM public.categories WHERE slug = 'main-courses'), false, ARRAY['Mixed Vegetables', 'Ginger', 'Soy Sauce', 'Rice'], ARRAY['Soy'], 380, 20, 2),
  ('Spicy Thai Curry', 'Creamy coconut curry with vegetables and your choice of protein', 19.99, 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400', (SELECT id FROM public.categories WHERE slug = 'main-courses'), false, ARRAY['Coconut Milk', 'Curry Paste', 'Vegetables', 'Thai Basil'], ARRAY['Coconut'], 450, 20, 3),
  ('Chocolate Lava Cake', 'Warm chocolate cake with molten center, served with vanilla ice cream', 11.99, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400', (SELECT id FROM public.categories WHERE slug = 'desserts'), true, ARRAY['Chocolate', 'Butter', 'Eggs', 'Flour', 'Sugar', 'Vanilla Ice Cream'], ARRAY['Dairy', 'Eggs', 'Gluten'], 480, 18, 0),
  ('Tiramisu', 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone cream', 10.99, 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', (SELECT id FROM public.categories WHERE slug = 'desserts'), false, ARRAY['Ladyfingers', 'Espresso', 'Mascarpone', 'Cocoa', 'Cream'], ARRAY['Dairy', 'Gluten', 'Eggs'], 420, 0, 0),
  ('Crème Brûlée', 'Vanilla custard with caramelized sugar crust', 9.99, 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400', (SELECT id FROM public.categories WHERE slug = 'desserts'), false, ARRAY['Cream', 'Vanilla', 'Eggs', 'Sugar'], ARRAY['Dairy', 'Eggs'], 350, 0, 0),
  ('Fresh Fruit Tart', 'Buttery pastry shell with vanilla custard and fresh seasonal fruits', 10.99, 'https://images.unsplash.com/photo-1519915028121-7d3463d20b2f?w=400', (SELECT id FROM public.categories WHERE slug = 'desserts'), false, ARRAY['Pastry', 'Custard', 'Fresh Fruits'], ARRAY['Gluten', 'Dairy', 'Eggs'], 320, 0, 0),
  ('Craft Lemonade', 'Fresh squeezed lemonade with mint and a hint of lavender', 5.99, 'https://images.unsplash.com/photo-1621263764928-b0c2a0b5c8e8?w=400', (SELECT id FROM public.categories WHERE slug = 'beverages'), false, ARRAY['Lemon', 'Mint', 'Lavender', 'Sugar'], ARRAY[]::TEXT[], 120, 5, 0),
  ('Espresso', 'Rich and bold single or double shot espresso', 3.99, 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400', (SELECT id FROM public.categories WHERE slug = 'beverages'), false, ARRAY['Coffee', 'Water'], ARRAY[]::TEXT[], 5, 3, 0),
  ('Mango Smoothie', 'Refreshing mango smoothie with yogurt and honey', 6.99, 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400', (SELECT id FROM public.categories WHERE slug = 'beverages'), false, ARRAY['Mango', 'Yogurt', 'Honey'], ARRAY['Dairy'], 180, 5, 0),
  ('Chef''s Tasting Menu', 'Five-course tasting menu featuring seasonal ingredients and chef''s selections', 75.00, 'https://images.unsplash.com/photo-1414235077428-3382695e4161?w=400', (SELECT id FROM public.categories WHERE slug = 'specials'), true, ARRAY['Seasonal Ingredients'], ARRAY[]::TEXT[], 850, 90, 0),
  ('Lobster Bisque', 'Creamy lobster soup with sherry and fresh herbs', 16.99, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400', (SELECT id FROM public.categories WHERE slug = 'specials'), true, ARRAY['Lobster', 'Cream', 'Sherry', 'Herbs'], ARRAY['Shellfish', 'Dairy'], 380, 20, 0);

-- Create a view for featured dishes
CREATE OR REPLACE VIEW public.featured_dishes AS
SELECT 
  d.*,
  c.name as category_name,
  c.slug as category_slug
FROM public.dishes d
LEFT JOIN public.categories c ON d.category_id = c.id
WHERE d.is_featured = true AND d.is_available = true;

-- Create a view for menu with categories
CREATE OR REPLACE VIEW public.menu_with_categories AS
SELECT 
  d.id,
  d.name,
  d.description,
  d.price,
  d.image_url,
  d.is_featured,
  d.is_available,
  d.ingredients,
  d.allergens,
  d.calories,
  d.preparation_time,
  d.spice_level,
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug
FROM public.dishes d
LEFT JOIN public.categories c ON d.category_id = c.id
WHERE d.is_available = true
ORDER BY c.name, d.name;