INSERT INTO categories (id, parent_id, slug, name, name_norm, path, depth) VALUES
(1, NULL, 'general', 'General', 'general', '/1/', 0),
(2, NULL, 'science', 'Science', 'science', '/2/', 0),
(3, NULL, 'history', 'History', 'history', '/3/', 0),
(4, NULL, 'technology', 'Technology', 'technology', '/4/', 0),
(5, NULL, 'space', 'Space & Astronomy', 'space & astronomy', '/5/', 0),
(6, NULL, 'nature', 'Nature & Biology', 'nature & biology', '/6/', 0),
(7, NULL, 'geography', 'Geography', 'geography', '/7/', 0),
(8, NULL, 'language', 'Language & Words', 'language & words', '/8/', 0),
(9, NULL, 'arts', 'Arts & Culture', 'arts & culture', '/9/', 0),
(10, NULL, 'psychology', 'Psychology & the Mind', 'psychology & the mind', '/10/', 0),
(11, NULL, 'math', 'Math & Logic', 'math & logic', '/11/', 0),
(12, NULL, 'health', 'Medicine & Health', 'medicine & health', '/12/', 0),
(13, NULL, 'economics', 'Economics & Money', 'economics & money', '/13/', 0),
(14, NULL, 'food', 'Food & Cooking', 'food & cooking', '/14/', 0),
(15, NULL, 'sports', 'Sports & Games', 'sports & games', '/15/', 0),
(20, 2, 'physics', 'Physics', 'physics', '/2/20/', 1),
(21, 2, 'chemistry', 'Chemistry', 'chemistry', '/2/21/', 1),
(22, 2, 'biology', 'Biology', 'biology', '/2/22/', 1),
(23, 5, 'astronomy', 'Astronomy', 'astronomy', '/5/23/', 1),
(24, 5, 'spaceflight', 'Space Exploration', 'space exploration', '/5/24/', 1),
(25, 3, 'ancient', 'Ancient History', 'ancient history', '/3/25/', 1),
(26, 3, 'modern', 'Modern History', 'modern history', '/3/26/', 1),
(27, 4, 'computing', 'Computing', 'computing', '/4/27/', 1),
(28, 4, 'internet', 'The Internet', 'the internet', '/4/28/', 1),
(29, 6, 'animals', 'Animals', 'animals', '/6/29/', 1),
(30, 6, 'plants', 'Plants & Fungi', 'plants & fungi', '/6/30/', 1);

UPDATE categories SET child_count =
  (SELECT COUNT(*) FROM categories k WHERE k.parent_id = categories.id);

-- Reserve ids 1-99 for seed data so future seed migrations can keep using
-- explicit, deterministic ids without colliding with admin-created rows.
-- AUTOINCREMENT already populated this row from the inserts above.
UPDATE sqlite_sequence SET seq = 99 WHERE name = 'categories';

INSERT INTO facts (category_id, body, source, rnd, body_hash) VALUES
(1, 'Octopuses have three hearts, and two of them stop beating when the animal swims.', NULL, 0.5846998623264962, 'db1c1352baf5d8537d0d54599d18426859e9a9445d99fbe128c7a9fbd3890959'),
(1, 'A bolt of lightning is roughly five times hotter than the surface of the sun.', NULL, 0.7442149256150542, '389250abdf9affa5ddb5af28e7ee6514183be81279323006fe14ad0cca9c9221'),
(1, 'Honey found in ancient Egyptian tombs is still edible after 3,000 years because it never spoils.', NULL, 0.05524696674432239, 'a98eb0ff41727943dd0fb9ed40d33efd2a2ae48ed979d08a222979a0976ee062'),
(20, 'Light from the sun takes about 8 minutes and 20 seconds to reach Earth.', NULL, 0.06882211661707172, '4478084a4006058496ada62dfb669c0b4aa5052d066bf3fe0b946ad41751381e'),
(20, 'A neutron star is so dense that a teaspoon of it would weigh about a billion tons on Earth.', NULL, 0.9736213606198695, 'd18e313e0604e6a3f78f181ed83a3f0a3e849d9a1da89a2fc213dc6309ca159d'),
(21, 'Diamond and graphite are both made of pure carbon, just arranged in different structures.', NULL, 0.7870276130746624, 'f78a71db19c19168a8901ac17f66c7799bb1c59ab0e7e864cae33d08a9f2ee54'),
(21, 'Water is one of the few substances that expands when it freezes, which is why ice floats.', NULL, 0.2924171101181722, 'd7ac78dc4f107798aa664d798083bab273b6a30491ca53d79e9d6a848d675106'),
(22, 'Humans share about 60% of their DNA with a banana.', NULL, 0.7400430646630662, '386b5d682b3a52a2cb3156d53381a6f1fb70164bf88401a596abb70d7e4262f8'),
(22, 'Your body replaces most of its cells every 7 to 10 years.', NULL, 0.5402871259600581, '9756e7c31e86133c90d4dca534e63062fb01f6611cd53499d6660017148b32af'),
(23, 'A day on Venus is longer than a year on Venus, since it rotates so slowly.', NULL, 0.3395051258024029, 'bec827b614039887335c0c3dbcd190c46b664f6bca8e8ca90168c05dac51c0f8'),
(23, 'There are more stars in the observable universe than grains of sand on every beach on Earth.', NULL, 0.5625952167524068, '17d8dccb6a53426f31082b5f3c7e48b8e38f32d1d4d6b5218995c935b3b4f992'),
(24, 'The Apollo 11 guidance computer had less processing power than a modern calculator.', NULL, 0.46179124832882457, 'd64ced7f51a22c64a3982f53f81c944323fb919223b642390f09f212a36bcbc4'),
(25, 'The Great Pyramid of Giza was the tallest man-made structure in the world for over 3,800 years.', NULL, 0.49704676538155224, '77550c63f1a047e7f91ff7a959672bcbbc07a0014e2589920a1f81a4d3c4c908'),
(25, 'Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.', NULL, 0.2603423322492129, '4c8dab1cee2e350475accddce5668e5148e647f4cf206374a1cb4d4027f512a5'),
(26, 'The Eiffel Tower can grow about 15 centimeters taller in summer due to heat expansion of the iron.', NULL, 0.9184999876673289, 'f313542e60b5a24e5bc0b340854642da0130634aed33160dc684a2200c42f7ee'),
(27, 'The first computer bug was an actual moth found trapped in a Harvard Mark II relay in 1947.', NULL, 0.5598423627176143, 'd4dd052664a1217e78f7370a4bea436086015660e3f5aee24ef59b2f0182e93a'),
(28, 'The first message ever sent over the internet''s precursor, ARPANET, was meant to be ''LOGIN'' but the system crashed after ''LO''.', NULL, 0.6226834036176289, '84832a9638a0191d07cc16b2c10c38698a8245d9762d31a4502ba20304f87170'),
(29, 'A group of flamingos is called a ''flamboyance''.', NULL, 0.8453259954379546, 'ae1620487afc2b3b7fbfa06a5dada62d6b3e3aae4a7e1d66c173f99d4d25f1fc'),
(29, 'Sea otters hold hands while sleeping so they don''t drift apart from each other.', NULL, 0.24026346044172375, '12eb2eb9dc60bcc7f4d22af613e08a68d97cb0ebafb990585c593f861f384504'),
(30, 'Bananas are berries, but strawberries are not, botanically speaking.', NULL, 0.5679490364734077, 'beed60bf1c892a7c0f6a4f1f2fe17df5f7b61f444cc55a502cbd84aa9051dd59'),
(7, 'Russia spans 11 time zones, more than any other country in the world.', NULL, 0.07317522140432398, 'f239731cad454ca57e5cbb1665b2ca2c86a6d46c1db9f64f3c13a26d9ab24ccb'),
(8, 'The word ''set'' has more distinct definitions in English than any other word.', NULL, 0.12526802799276804, 'aa542e519633eb57dc3717e341e1984dfc63c974fee535b4e1371808cd60b2d8'),
(10, 'The brain uses about 20% of the body''s total energy despite being only about 2% of its weight.', NULL, 0.5672685484796797, '2b7dcac0f65e7865e172c393504cb5ec30117b6d3e0e75ba484f43f737c684c8');

UPDATE categories SET fact_count =
  (SELECT COUNT(*) FROM facts f WHERE f.category_id = categories.id AND f.status='published');
