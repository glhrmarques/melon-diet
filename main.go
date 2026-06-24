package main

import (
	//GO standard library package that handles cancellation, timeouts and deadline for operations
	"context"
	"net/http"
	"os"
	"time"
	"log"

	"golang.org/x/crypto/bcrypt"

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
	SenhaHash string `json:"nome,omitempty"`
	Tipo string `json:"tipo"`
	Ativo bool `json:"ativo"`
	CriadoEm time.Time `json:"criado_em"`
}

type Nutricionista struct {
	ID int `json:"id"`
	UsuarioId int `json:"usuario_id"`
	CRN string `json:"crn"`
	Celular string `json:"celular"`
}

func addNutricionista(c *gin.Context) {

	var input struct { 
		Nome string `json:"nome"`
		Email string `json:"email"`
		Senha string `json:"senha"` 
		CRN string `json:"crn"`
		Celular string `json:celular`
	}


	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Falha ao continuar"})
		return 
	}

	hashedpassowrd, err := bcrypt.GenerateFromPassword([]byte(input.Senha), bcrypt.DefaultCost())

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Hashing failed"})
		return
	}

	tx, err := db.Begin(context.Background())

	if err != nil {
		c.JSON(htto.StatusBadRequest, gin.H{"error": "Failed to strart the transaction"})
		return
	}


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
	router.POST("/login", login)
	router.Run("localhost:8080")
}
