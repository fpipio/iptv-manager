-- Migration 011: Add Missing Actors
-- Adds 19 additional actor patterns reported by user

INSERT OR IGNORE INTO cleanup_patterns (type, value, description, enabled, is_default) VALUES
    -- Additional international actors
    ('actor', 'Antonio Banderas', 'Spanish actor', 1, 1),
    ('actor', 'Cate Blanchett', 'Australian actress', 1, 1),
    ('actor', 'Charlize Theron', 'South African actress', 1, 1),
    ('actor', 'Christian Bale', 'British actor', 1, 1),
    ('actor', 'Christopher Lambert', 'American-French actor', 1, 1),
    ('actor', 'Chuck Norris', 'American actor/martial artist', 1, 1),
    ('actor', 'Dolph Lundgren', 'Swedish actor', 1, 1),
    ('actor', 'Ewan McGregor', 'Scottish actor', 1, 1),
    ('actor', 'James Franco', 'American actor', 1, 1),
    ('actor', 'Jean Reno', 'French actor', 1, 1),
    ('actor', 'Jean-Claude Van Damme', 'Belgian actor/martial artist', 1, 1),
    ('actor', 'Julianne Moore', 'American actress', 1, 1),
    ('actor', 'Kevin Costner', 'American actor', 1, 1),
    ('actor', 'Kevin Spacey', 'American actor', 1, 1),
    ('actor', 'Kurt Russell', 'American actor', 1, 1),
    ('actor', 'Michael Douglas', 'American actor', 1, 1),
    ('actor', 'Nicole Kidman', 'Australian actress', 1, 1),
    ('actor', 'Anthony Hopkins', 'British actor', 1, 1),
    ('actor', 'Gary Oldman', 'British actor', 1, 1);
