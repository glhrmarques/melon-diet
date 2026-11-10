package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func mealRequest(method, route, path, body string, handler gin.HandlerFunc) *httptest.ResponseRecorder {
	router := gin.New()
	router.Handle(method, route, handler)
	request := httptest.NewRequest(method, path, strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	return response
}

func TestMealRequestValidation(t *testing.T) {
	const validPlan = `{"usuario_id":7,"pedido_id":"3c2ea250-4992-4a44-9a18-c710d0f4d7c0","periodo":"almoco","horario":"12:30","alimentos":[{"taco_id":1,"medida":"fatia","quantidade":2}]}`
	const planRoute = "/patients/:pacienteID/plan-meals"
	const planPath = "/patients/42/plan-meals"
	const getRoute = "/patients/:pacienteID/meal-plans/:dietaID"

	tests := []struct {
		name, method, route, path, body, message string
		handler                                  gin.HandlerFunc
	}{
		{"invalid meal JSON", "POST", "/refeicoes", "/refeicoes", "{", "dieta_id, periodo e descricao são obrigatórios", AddRefeicao},
		{"invalid meal period", "POST", "/refeicoes", "/refeicoes", `{"dieta_id":1,"periodo":"invalid","descricao":"Almoço"}`, "periodo inválido", AddRefeicao},
		{"blank meal description", "POST", "/refeicoes", "/refeicoes", `{"dieta_id":1,"periodo":"almoco","descricao":" "}`, "descricao é obrigatória", AddRefeicao},
		{"invalid patient ID", "POST", planRoute, "/patients/0/plan-meals", validPlan, "Confira os dados da refeição.", SavePlanMeal},
		{"invalid time", "POST", planRoute, planPath, strings.Replace(validPlan, "12:30", "24:00", 1), "Selecione o nome e o horário da refeição.", SavePlanMeal},
		{"invalid plan period", "POST", planRoute, planPath, strings.Replace(validPlan, "almoco", "invalid", 1), "Selecione o nome e o horário da refeição.", SavePlanMeal},
		{"invalid quantity", "POST", planRoute, planPath, strings.Replace(validPlan, `"quantidade":2`, `"quantidade":0`, 1), "Confira os dados da refeição.", SavePlanMeal},
		{"unknown food", "POST", planRoute, planPath, strings.Replace(validPlan, `"taco_id":1`, fmt.Sprintf(`"taco_id":%d`, len(tacoFoods)+1), 1), "Confira o alimento selecionado.", SavePlanMeal},
		{"missing user ID", "GET", getRoute, "/patients/42/meal-plans/1", "", "Plano inválido.", GetMealPlan},
		{"invalid plan ID", "GET", getRoute, "/patients/42/meal-plans/abc?usuario_id=7", "", "Plano inválido.", GetMealPlan},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			response := mealRequest(tt.method, tt.route, tt.path, tt.body, tt.handler)
			if response.Code != http.StatusBadRequest {
				t.Fatalf("expected 400, got %d: %s", response.Code, response.Body)
			}
			var result struct {
				Error string `json:"error"`
			}
			if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
				t.Fatal(err)
			}
			if result.Error != tt.message {
				t.Errorf("expected %q, got %q", tt.message, result.Error)
			}
		})
	}
}

func TestSearchFoods(t *testing.T) {
	for _, path := range []string{"/alimentos?q=PAO+FRANCES", "/alimentos?q=p"} {
		t.Run(path, func(t *testing.T) {
			response := mealRequest(http.MethodGet, "/alimentos", path, "", SearchFoods)
			if response.Code != http.StatusOK {
				t.Fatalf("expected 200, got %d: %s", response.Code, response.Body)
			}
			var result struct {
				Foods []tacoFood `json:"alimentos"`
			}
			if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
				t.Fatal(err)
			}
			if path == "/alimentos?q=p" {
				if result.Foods == nil || len(result.Foods) != 0 {
					t.Fatalf("expected an empty array for a one-character query, got %v", result.Foods)
				}
				return
			}
			for _, food := range result.Foods {
				if food.ID > 0 && food.Nome == "Pão, trigo, francês" {
					return
				}
			}
			t.Fatalf("expected French bread in results, got %v", result.Foods)
		})
	}
}

func TestSaveMealPlanRejectsInvalidLaterMeal(t *testing.T) {
	const body = `{
		"usuario_id": 7,
		"pedido_id": "3c2ea250-4992-4a44-9a18-c710d0f4d7c0",
		"refeicoes": [
			{"periodo":"cafe_da_manha","horario":"07:30","alimentos":[{"taco_id":1,"medida":"fatia","quantidade":2}]},
			{"periodo":"almoco","horario":"24:00","alimentos":[{"taco_id":2,"medida":"g","quantidade":200}]}
		]
	}`
	response := mealRequest(http.MethodPost, "/patients/:pacienteID/meal-plans",
		"/patients/42/meal-plans", body, SaveMealPlan)
	if response.Code != http.StatusBadRequest || !strings.Contains(response.Body.String(), "Selecione o nome e o horário da refeição.") {
		t.Fatalf("expected the second meal's invalid time to reject the whole plan, got %d: %s", response.Code, response.Body)
	}
}
