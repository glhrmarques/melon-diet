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
	router.Use(cors.Default())

	router.POST("/usuarios", handlers.AddNutricionista)

	router.Run("localhost:8080")
}