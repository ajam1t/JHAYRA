-- JHAYRA Seed: All 16 Categories
-- Run AFTER 001_schema.sql and 002_rls_policies.sql

insert into public.categories (slug, name, description, image_url, display_order, active) values
  ('personalized',   'Personalized',     'Custom photo frames with your personal touch',           '/Images/personalized.jpg',  1,  true),
  ('nature',         'Nature',           'Frames inspired by the beauty of nature',                '/Images/nature.jpg',         2,  true),
  ('religious',      'Religious',        'Devotional and spiritual art frames',                    '/Images/religious.jpg',      3,  true),
  ('modern-art',     'Modern Art',       'Contemporary and abstract modern art frames',            '/Images/modern-art.jpg',     4,  true),
  ('running-horses', 'Running Horses',   'Vastu-friendly running horses wall art',                 '/Images/running-horses.jpg', 5,  true),
  ('canvas',         'Canvas',           'Premium canvas print frames',                            '/Images/canvas.jpg',         6,  true),
  ('art-abstract',   'Art & Abstract',   'Expressive abstract art collection',                     '/Images/art-abstract.jpg',   7,  true),
  ('love-romance',   'Love & Romance',   'Romantic frames for couples',                            '/Images/love-romance.jpg',   8,  true),
  ('wedding',        'Wedding',          'Elegant frames for wedding memories',                    '/Images/wedding.jpg',        9,  true),
  ('family',         'Family',           'Beautiful frames celebrating family bonds',              '/Images/family.jpg',         10, true),
  ('baby-kids',      'Baby & Kids',      'Adorable frames for little ones',                        '/Images/baby-kids.jpg',      11, true),
  ('animals-pets',   'Animals & Pets',   'Frames celebrating your beloved pets',                   '/Images/animals-pets.jpg',   12, true),
  ('occasions',      'Occasions',        'Frames for birthdays, anniversaries and celebrations',   '/Images/occasions.jpg',      13, true),
  ('photography',    'Photography',      'Frames to showcase your finest photography',             '/Images/photography.jpg',    14, true),
  ('quotes',         'Quotes',           'Inspirational and motivational quote frames',             '/Images/quotes.jpg',         15, true),
  ('home-vastu',     'Home & Vastu',     'Vastu-compliant art for positive energy at home',        '/Images/home-vastu.jpg',     16, true)
on conflict (slug) do update set
  name          = excluded.name,
  description   = excluded.description,
  display_order = excluded.display_order;
