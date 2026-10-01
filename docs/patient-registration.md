# Patient registration

The form in `frontend/src/app/addPatient/page.tsx` submits JSON to the existing Go route `POST /patients?usuario_id=<id>`. Height is entered in meters and converted to whole centimeters. Weight is in kilograms, and birth dates use `YYYY-MM-DD` in requests and responses.

The form keeps its values on failure, displays the API error, disables inputs while saving, and navigates to `/home` after success. A ref guards against repeated submissions while a request is pending. This prevents repeated UI submissions, not duplicate requests across tabs or retries.

## Database prerequisite

Apply `migrations/001_patient_email.sql` before running the updated API. See `migrations/README.md`. This adds email without removing existing phone numbers. Patient listings show email when available and otherwise show telephone.

## Request contract

```json
{
  "nome": "Ana Silva",
  "data_nascimento": "1995-04-20",
  "sexo": "Feminino",
  "altura_cm": 168,
  "peso_kg": 64.5,
  "email": "ana@example.com"
}
```

`sexo` accepts `Feminino`, `Masculino`, `Outro`, and `Não informado`. Telephone remains optional in the API. The server rejects missing fields, whitespace-only names, invalid email, invalid/future dates, and nonpositive measurements. Future dates are checked against the current calendar date in `America/Sao_Paulo`.

The handler validates before opening a transaction, resolves the nutritionist from the user ID, inserts the patient with a parameterized query, commits, and only then returns `201` with `{ "paciente": ... }`. Invalid input returns `400`; a missing nutritionist returns `404`; unexpected database failures return `500`. Every open transaction has deferred rollback cleanup.

The existing `usuario_id` query parameter is not authentication. `localStorage` can be edited by a client. Before using this application with real patient data, add server-verified authentication and derive ownership from that identity instead of trusting the query parameter.

## Tests

From the repository root:

```sh
go test ./...
```

From `frontend`:

```sh
npm test -- --run
npm run lint
npx tsc --noEmit --incremental false
```

Handler tests cover validation, date boundaries, correct inserted values, successful commits, and failures at each database step. Frontend tests cover the payload, unit conversion, loading, repeated submissions, errors, input preservation, and retries.

To run the PostgreSQL integration test, export `TEST_DATABASE_URL` with credentials for a test database and run:

```sh
go test ./internals/handlers -run TestPatientPersistence -v -count=1
```

Without this variable, the integration test is skipped. It creates and drops an isolated schema, so the database role needs permission to create schemas. Fixtures reproduce the relevant existing columns, apply the actual email migration twice, verify saved values from an independent connection, check failed requests add no rows, and exercise patient listing and ownership filtering. Fixture tables do not modify the application's existing patient records.

## Concepts to learn in this implementation

- **Controlled inputs and state:** React holds field values, loading state, and errors.
- **Form events and async/await:** submission becomes an asynchronous HTTP request.
- **API contracts and serialization:** both applications agree on JSON keys, types, and units.
- **Validation and guard clauses:** invalid requests exit before database operations.
- **Parameterized SQL and foreign keys:** patient information is stored under the correct nutritionist record.
- **Transactions and defer:** success is reported after commit; failures release database resources.
- **Dependency injection:** the handler accepts a small database interface and a clock value for deterministic tests.
- **Mocks versus integration tests:** mocks exercise failure branches; PostgreSQL tests prove persistence and SQL compatibility.
