-- A nutritionist can create meal plans for multiple patients.
ALTER TABLE dieta DROP CONSTRAINT IF EXISTS dieta_nutricionista_id_key;
