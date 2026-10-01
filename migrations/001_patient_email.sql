-- Existing patients may have no email. New registrations require it in the API.
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS email text;
