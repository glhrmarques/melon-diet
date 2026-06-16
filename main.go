package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

var db *pgxpool.Pool


type Usuario struct {
	ID int `json:"id"`
	Nome string `json:"nome"`
	Email string `json:"email"`
	SenhaHash string `json:"senha_hash,omitempty"`
	Tipo string `json:"tipo"`
	Ativo bool `json:"ativo"`
	CriadoEm time.Time `json:"criado_em"`
}

func addUser(c *gin.Context) {
	var newUser Usuario

	if err := c.ShouldBindJSON(&newUser); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := db.QueryRow(context.Background(),
		`INSERT INTO usuarios (nome, email, senha_hash, tipo)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, ativo, criado_em`,
		newUser.Nome, newUser.Email, newUser.SenhaHash, newUser.Tipo,
	).Scan(&newUser.ID, &newUser.Ativo, &newUser.CriadoEm)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	newUser.SenhaHash = ""
	c.JSON(http.StatusCreated, newUser)
}	


func main() {
	godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL is not set in .env")
	}

	var err error
	db, err = pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v\n", err)
	}
	defer db.Close()

	log.Println("Connected to Supabase database successfully!")

	router := gin.Default()
	router.Use(cors.Default())

	router.POST("/usuarios", addUser)
	router.Run("localhost:8080")
}
