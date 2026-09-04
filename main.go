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
	router.GET("/pacientes", handlers.ListPatients)
	router.POST("/pacientes", handlers.AddPacient)
	router.POST("/dietas", handlers.AddDieta)
	router.POST("/refeicoes", handlers.AddRefeicao)
	router.POST("/auth/login", handlers.Login)

	router.Run("localhost:8080")
}
