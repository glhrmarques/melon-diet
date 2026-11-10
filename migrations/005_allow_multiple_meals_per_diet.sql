-- Keep the diet foreign key and allow more than one meal per diet.
ALTER TABLE refeicao DROP CONSTRAINT IF EXISTS refeicao_dieta_id_key;
