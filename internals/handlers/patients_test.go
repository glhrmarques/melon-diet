package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

const validPatientJSON = `{"nome":" Ana Silva ","data_nascimento":"1995-04-20","sexo":"Feminino","altura_cm":168,"peso_kg":64.5,"email":"ana@example.com"}`

var patientTestNow = time.Date(2026, 10, 1, 12, 0, 0, 0, time.UTC)

type patientDBStub struct {
	tx     *patientTxStub
	err    error
	begins int
}

func (d *patientDBStub) Begin(context.Context) (pgx.Tx, error) {
	d.begins++
	return d.tx, d.err
}

type patientTxStub struct {
	pgx.Tx
	lookupErr, insertErr, commitErr error
	queries, commits, rollbacks     int
	insertArgs                      []any
	usuarioID                       any
}

func (tx *patientTxStub) QueryRow(_ context.Context, _ string, args ...any) pgx.Row {
	tx.queries++
	if tx.queries == 1 {
		tx.usuarioID = args[0]
		return patientRowStub{values: []any{3}, err: tx.lookupErr}
	}
	tx.insertArgs = args
	return patientRowStub{values: []any{42, 3, "Ana Silva", "1995-04-20", "Feminino", float64(168), 64.5, "", "ana@example.com"}, err: tx.insertErr}
}
func (tx *patientTxStub) Commit(context.Context) error   { tx.commits++; return tx.commitErr }
func (tx *patientTxStub) Rollback(context.Context) error { tx.rollbacks++; return nil }

type patientRowStub struct {
	values []any
	err    error
}

func (row patientRowStub) Scan(dest ...any) error {
	if row.err != nil {
		return row.err
	}
	for i, value := range row.values {
		reflect.ValueOf(dest[i]).Elem().Set(reflect.ValueOf(value))
	}
	return nil
}

func patientRequest(database patientDatabase, query, body string, now time.Time) *httptest.ResponseRecorder {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/patients", func(c *gin.Context) { addPatient(c, database, now) })
	request := httptest.NewRequest(http.MethodPost, "/patients"+query, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	return response
}

func TestAddPatientRejectsInvalidInputBeforeDatabase(t *testing.T) {
	tests := []struct{ name, query, body string }{
		{"missing user", "", validPatientJSON},
		{"invalid user", "?usuario_id=abc", validPatientJSON},
		{"negative user", "?usuario_id=-1", validPatientJSON},
		{"malformed JSON", "?usuario_id=7", "{"},
		{"missing fields", "?usuario_id=7", `{}`},
		{"blank name", "?usuario_id=7", strings.Replace(validPatientJSON, " Ana Silva ", "   ", 1)},
		{"invalid email", "?usuario_id=7", strings.Replace(validPatientJSON, "ana@example.com", "invalid", 1)},
		{"impossible date", "?usuario_id=7", strings.Replace(validPatientJSON, "1995-04-20", "1995-02-30", 1)},
		{"timestamp instead of date", "?usuario_id=7", strings.Replace(validPatientJSON, "1995-04-20", "1995-04-20T00:00:00Z", 1)},
		{"future date", "?usuario_id=7", strings.Replace(validPatientJSON, "1995-04-20", "2026-10-02", 1)},
		{"invalid sex", "?usuario_id=7", strings.Replace(validPatientJSON, "Feminino", "invalid", 1)},
		{"zero height", "?usuario_id=7", strings.Replace(validPatientJSON, "168", "0", 1)},
		{"negative weight", "?usuario_id=7", strings.Replace(validPatientJSON, "64.5", "-1", 1)},
		{"string weight", "?usuario_id=7", strings.Replace(validPatientJSON, "64.5", `"64.5"`, 1)},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			database := &patientDBStub{}
			response := patientRequest(database, tt.query, tt.body, patientTestNow)
			if response.Code != http.StatusBadRequest {
				t.Fatalf("expected 400, got %d: %s", response.Code, response.Body)
			}
			if database.begins != 0 {
				t.Fatal("invalid input reached database")
			}
			var body map[string]string
			if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil || body["error"] == "" {
				t.Fatalf("expected JSON error: %s", response.Body)
			}
		})
	}
}

func TestAddPatientCommitsAndReturnsPatient(t *testing.T) {
	tx := &patientTxStub{}
	response := patientRequest(&patientDBStub{tx: tx}, "?usuario_id=7", validPatientJSON, patientTestNow)
	if response.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", response.Code, response.Body)
	}
	var body struct {
		Patient Patient `json:"paciente"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	expected := Patient{ID: 42, NutricionistaID: 3, Nome: "Ana Silva", DataNascimento: "1995-04-20", Sexo: "Feminino", Altura: 168, Peso: 64.5, Email: "ana@example.com"}
	if body.Patient != expected {
		t.Fatalf("unexpected patient: %+v", body.Patient)
	}
	date, _ := time.Parse(time.DateOnly, "1995-04-20")
	args := []any{3, date, "Ana Silva", "Feminino", float64(168), 64.5, "", "ana@example.com"}
	if tx.usuarioID != 7 || !reflect.DeepEqual(tx.insertArgs, args) {
		t.Fatalf("incorrect ownership or data: user=%v args=%v", tx.usuarioID, tx.insertArgs)
	}
	if tx.commits != 1 || tx.rollbacks != 1 {
		t.Fatalf("transaction was not committed and cleaned up: %+v", tx)
	}
}

func TestAddPatientDatabaseFailures(t *testing.T) {
	failure := errors.New("database unavailable")
	tests := []struct {
		name                                      string
		beginErr, lookupErr, insertErr, commitErr error
		status, queries, commits, rollbacks       int
	}{
		{name: "begin", beginErr: failure, status: 500},
		{name: "missing nutritionist", lookupErr: pgx.ErrNoRows, status: 404, queries: 1, rollbacks: 1},
		{name: "lookup", lookupErr: failure, status: 500, queries: 1, rollbacks: 1},
		{name: "insert", insertErr: failure, status: 500, queries: 2, rollbacks: 1},
		{name: "commit", commitErr: failure, status: 500, queries: 2, commits: 1, rollbacks: 1},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			tx := &patientTxStub{lookupErr: tt.lookupErr, insertErr: tt.insertErr, commitErr: tt.commitErr}
			response := patientRequest(&patientDBStub{tx: tx, err: tt.beginErr}, "?usuario_id=7", validPatientJSON, patientTestNow)
			if response.Code != tt.status {
				t.Fatalf("expected %d, got %d", tt.status, response.Code)
			}
			if tx.queries != tt.queries || tx.commits != tt.commits || tx.rollbacks != tt.rollbacks {
				t.Fatalf("unexpected transaction lifecycle: %+v", tx)
			}
			if strings.Contains(response.Body.String(), failure.Error()) {
				t.Fatal("database details exposed to client")
			}
		})
	}
}

func TestAddPatientUsesSaoPauloCalendarDate(t *testing.T) {
	// At 01:00 UTC on October 2 it is still October 1 in São Paulo.
	now := time.Date(2026, 10, 2, 1, 0, 0, 0, time.UTC)
	for _, date := range []string{"2026-10-01", "2026-10-02"} {
		tx := &patientTxStub{}
		body := strings.Replace(validPatientJSON, "1995-04-20", date, 1)
		response := patientRequest(&patientDBStub{tx: tx}, "?usuario_id=7", body, now)
		expected := http.StatusCreated
		if date == "2026-10-02" {
			expected = http.StatusBadRequest
		}
		if response.Code != expected {
			t.Fatalf("date %s: expected %d, got %d", date, expected, response.Code)
		}
	}
}

func TestAddPatientAcceptsSexOptions(t *testing.T) {
	for _, sex := range []string{"Feminino", "Masculino", "Outro", "Não informado"} {
		response := patientRequest(&patientDBStub{tx: &patientTxStub{}}, "?usuario_id=7", strings.Replace(validPatientJSON, "Feminino", sex, 1), patientTestNow)
		if response.Code != http.StatusCreated {
			t.Fatalf("sex %s: %d %s", sex, response.Code, response.Body)
		}
	}
}
