-- Migration 010: Movie Cleanup System
-- Adds support for cleaning movie names (removing actor names) and year-based library organization

-- Cleanup Patterns: stores actor names and custom regex patterns
CREATE TABLE IF NOT EXISTS cleanup_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('actor', 'custom_regex')),  -- pattern type
    value TEXT NOT NULL,              -- actor name or regex pattern
    description TEXT,                 -- optional description/note
    enabled INTEGER DEFAULT 1,        -- 1=active, 0=disabled
    is_default INTEGER DEFAULT 0,     -- 1=system default, 0=user added
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cleanup_patterns_type ON cleanup_patterns(type);
CREATE INDEX IF NOT EXISTS idx_cleanup_patterns_enabled ON cleanup_patterns(enabled);

-- Cleanup History: tracks applied cleanups for undo/audit
CREATE TABLE IF NOT EXISTS cleanup_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id TEXT NOT NULL,
    original_name TEXT NOT NULL,
    cleaned_name TEXT NOT NULL,
    pattern_id INTEGER,               -- which pattern was used
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (pattern_id) REFERENCES cleanup_patterns(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cleanup_history_movie_id ON cleanup_history(movie_id);
CREATE INDEX IF NOT EXISTS idx_cleanup_history_applied_at ON cleanup_history(applied_at);

-- Year Libraries: parametric configuration for year-based library organization
CREATE TABLE IF NOT EXISTS year_libraries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,               -- library name (e.g., "Pre-1980", "1980-2000")
    year_from INTEGER,                -- start year (NULL = no lower bound)
    year_to INTEGER,                  -- end year (NULL = no upper bound)
    directory TEXT NOT NULL,          -- subdirectory name (e.g., "pre-1980", "1980-2000")
    sort_order INTEGER DEFAULT 0,    -- display order
    enabled INTEGER DEFAULT 1,        -- 1=active, 0=disabled
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_year_libraries_enabled ON year_libraries(enabled);
CREATE INDEX IF NOT EXISTS idx_year_libraries_sort_order ON year_libraries(sort_order);

-- Insert default year libraries configuration
INSERT OR IGNORE INTO year_libraries (name, year_from, year_to, directory, sort_order, enabled) VALUES
    ('Pre-1980', NULL, 1979, 'pre-1980', 1, 1),
    ('1980-2000', 1980, 2000, '1980-2000', 2, 1),
    ('2001-2020', 2001, 2020, '2001-2020', 3, 1),
    ('2021+', 2021, NULL, '2021-plus', 4, 1),
    ('Unknown Year', NULL, NULL, 'unknown', 99, 1);

-- Insert default cleanup patterns (common Italian and international actors)
INSERT OR IGNORE INTO cleanup_patterns (type, value, description, enabled, is_default) VALUES
    -- Italian actors
    ('actor', 'Alberto Sordi', 'Italian actor', 1, 1),
    ('actor', 'Adriano Celentano', 'Italian actor/singer', 1, 1),
    ('actor', 'Carlo Verdone', 'Italian actor/director', 1, 1),
    ('actor', 'Massimo Troisi', 'Italian actor/comedian', 1, 1),
    ('actor', 'Roberto Benigni', 'Italian actor/director', 1, 1),
    ('actor', 'Paolo Villaggio', 'Italian actor/comedian', 1, 1),
    ('actor', 'Totò', 'Italian actor/comedian', 1, 1),
    ('actor', 'Renato Pozzetto', 'Italian actor/comedian', 1, 1),
    ('actor', 'Christian De Sica', 'Italian actor', 1, 1),
    ('actor', 'Massimo Boldi', 'Italian actor/comedian', 1, 1),
    ('actor', 'Gigi Proietti', 'Italian actor', 1, 1),
    ('actor', 'Nino Manfredi', 'Italian actor', 1, 1),
    ('actor', 'Vittorio Gassman', 'Italian actor', 1, 1),
    ('actor', 'Marcello Mastroianni', 'Italian actor', 1, 1),
    ('actor', 'Sophia Loren', 'Italian actress', 1, 1),
    ('actor', 'Monica Bellucci', 'Italian actress', 1, 1),

    -- International actors
    ('actor', 'Adam Sandler', 'American actor/comedian', 1, 1),
    ('actor', 'Al Pacino', 'American actor', 1, 1),
    ('actor', 'Robert De Niro', 'American actor', 1, 1),
    ('actor', 'Tom Cruise', 'American actor', 1, 1),
    ('actor', 'Tom Hanks', 'American actor', 1, 1),
    ('actor', 'Brad Pitt', 'American actor', 1, 1),
    ('actor', 'Leonardo DiCaprio', 'American actor', 1, 1),
    ('actor', 'Johnny Depp', 'American actor', 1, 1),
    ('actor', 'Will Smith', 'American actor', 1, 1),
    ('actor', 'Denzel Washington', 'American actor', 1, 1),
    ('actor', 'Matt Damon', 'American actor', 1, 1),
    ('actor', 'George Clooney', 'American actor', 1, 1),
    ('actor', 'Ben Affleck', 'American actor/director', 1, 1),
    ('actor', 'Bruce Willis', 'American actor', 1, 1),
    ('actor', 'Sylvester Stallone', 'American actor', 1, 1),
    ('actor', 'Arnold Schwarzenegger', 'American actor', 1, 1),
    ('actor', 'Jackie Chan', 'Hong Kong actor', 1, 1),
    ('actor', 'Jet Li', 'Chinese actor', 1, 1),
    ('actor', 'Jason Statham', 'British actor', 1, 1),
    ('actor', 'Dwayne Johnson', 'American actor', 1, 1),
    ('actor', 'Vin Diesel', 'American actor', 1, 1),
    ('actor', 'Jim Carrey', 'Canadian actor/comedian', 1, 1),
    ('actor', 'Eddie Murphy', 'American actor/comedian', 1, 1),
    ('actor', 'Robin Williams', 'American actor/comedian', 1, 1),
    ('actor', 'Steve Carell', 'American actor/comedian', 1, 1),
    ('actor', 'Seth Rogen', 'Canadian actor/comedian', 1, 1),
    ('actor', 'Kevin Hart', 'American actor/comedian', 1, 1),
    ('actor', 'Keanu Reeves', 'Canadian actor', 1, 1),
    ('actor', 'Liam Neeson', 'Irish actor', 1, 1),
    ('actor', 'Morgan Freeman', 'American actor', 1, 1),
    ('actor', 'Samuel L. Jackson', 'American actor', 1, 1),
    ('actor', 'Harrison Ford', 'American actor', 1, 1),
    ('actor', 'Clint Eastwood', 'American actor/director', 1, 1),
    ('actor', 'Mel Gibson', 'American actor', 1, 1),
    ('actor', 'Nicolas Cage', 'American actor', 1, 1),
    ('actor', 'John Travolta', 'American actor', 1, 1),
    ('actor', 'Mark Wahlberg', 'American actor', 1, 1),
    ('actor', 'Ryan Reynolds', 'Canadian actor', 1, 1),
    ('actor', 'Chris Hemsworth', 'Australian actor', 1, 1),
    ('actor', 'Chris Evans', 'American actor', 1, 1),
    ('actor', 'Chris Pratt', 'American actor', 1, 1),
    ('actor', 'Robert Downey Jr.', 'American actor', 1, 1),
    ('actor', 'Scarlett Johansson', 'American actress', 1, 1),
    ('actor', 'Jennifer Lawrence', 'American actress', 1, 1),
    ('actor', 'Angelina Jolie', 'American actress', 1, 1),
    ('actor', 'Julia Roberts', 'American actress', 1, 1),
    ('actor', 'Meryl Streep', 'American actress', 1, 1),
    ('actor', 'Sandra Bullock', 'American actress', 1, 1),
    ('actor', 'Cameron Diaz', 'American actress', 1, 1),
    ('actor', 'Reese Witherspoon', 'American actress', 1, 1),
    ('actor', 'Anne Hathaway', 'American actress', 1, 1),
    ('actor', 'Emma Stone', 'American actress', 1, 1);
