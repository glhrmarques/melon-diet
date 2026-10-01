# Patient registration schema

Apply `001_patient_email.sql` before running the updated patient API. It adds a nullable email column, preserving existing patients and telephone values. New registrations require a valid email through API validation.

With PostgreSQL's CLI and `DATABASE_URL` exported in your shell:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f migrations/001_patient_email.sql
```

Alternatively, run the SQL file in your database's SQL editor. The migration can be run more than once.
