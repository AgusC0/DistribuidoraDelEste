-- La foto del local cambió de nombre (la nueva, con el cartel verde): así el servidor no sigue mostrando
-- la versión vieja que tenía guardada. Si la galería ya se guardó desde el panel, apunta al archivo nuevo.
UPDATE settings
SET data = replace(data::text, '/images/local/fachada-distribuidora-del-este-villa-maria.jpg', '/images/local/local-distribuidora-del-este-villa-maria.jpg')::jsonb,
    updated_at = now()
WHERE data::text LIKE '%/images/local/fachada-distribuidora-del-este-villa-maria.jpg%';
