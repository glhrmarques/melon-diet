# Patient registration schema

Apply `001_patient_email.sql` before running the updated patient API. It adds a nullable email column, preserving existing patients and telephone values. New registrations require a valid email through API validation.

With PostgreSQL's CLI and `DATABASE_URL` exported in your shell:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f migrations/001_patient_email.sql
```

Alternatively, run the SQL file in your database's SQL editor. The migration can be run more than once.

## Meal plans

Apply `002_meal_plans.sql` after the existing `pacientes` and
`nutricionistas` tables are available. It creates missing plan and meal
tables, adds scheduling and notes to existing meals, and creates the
meal-food table.

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f migrations/002_meal_plans.sql
```

The food search catalog contains food IDs and names from the
[TACO 4th edition spreadsheet](https://nepa.unicamp.br/publicacoes/tabela-taco-excel/)
(NEPA/UNICAMP, 2011). Apply `003_optional_meal_food_weight.sql` after `002_meal_plans.sql` to
allow household measures with no recorded weight.

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f migrations/003_optional_meal_food_weight.sql
```

Apply `004_allow_multiple_diets_per_nutritionist.sql` to remove the legacy
unique constraint on `dieta.nutricionista_id` so a nutritionist can create
more than one plan. Existing plans and the nutritionist foreign key are
preserved.

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f migrations/004_allow_multiple_diets_per_nutritionist.sql
```

Apply `005_allow_multiple_meals_per_diet.sql` to allow several meals in
one plan on databases with the legacy `refeicao.dieta_id` unique constraint.

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f migrations/005_allow_multiple_meals_per_diet.sql
```
