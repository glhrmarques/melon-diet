package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"melom/web-services/internals/db"
	"melom/web-services/internals/handlers"
)

func main() {
	db.Connect()
	defer db.Close()

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}))

	router.POST("/usuarios", handlers.AddNutricionista)
	router.GET("/patients", handlers.ListPatients)
	router.POST("/patients", handlers.AddPatient)
	router.POST("/dietas", handlers.AddDieta)
	router.POST("/refeicoes", handlers.AddRefeicao)
	router.GET("/alimentos", handlers.SearchFoods)
	router.POST("/patients/:pacienteID/plan-meals", handlers.SavePlanMeal)
	router.POST("/patients/:pacienteID/meal-plans", handlers.SaveMealPlan)
	router.GET("/patients/:pacienteID/meal-plans/:dietaID", handlers.GetMealPlan)
	router.POST("/auth/login", handlers.Login)

	router.Run("localhost:8080")
}
