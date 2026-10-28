-- El negocio prefiere presentarse como "sanitarista" y no como "corralón".
-- Cambia la frase corta solo si sigue siendo la original (si ya la editaron en Ajustes, no se toca).
UPDATE settings
SET data = jsonb_set(data, '{tagline}', '"Sanitarista en Villa María, Córdoba"'),
    updated_at = now()
WHERE data->>'tagline' = 'Sanitarios y corralón en Villa María, Córdoba';
