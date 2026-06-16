package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

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

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newUser.SenhaHash), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	err = db.QueryRow(context.Background(),
		`INSERT INTO usuarios (nome, email, senha_hash, tipo)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, ativo, criado_em`,
		newUser.Nome, newUser.Email, string(hashedPassword), newUser.Tipo,
	).Scan(&newUser.ID, &newUser.Ativo, &newUser.CriadoEm)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	newUser.SenhaHash = ""
	c.JSON(http.StatusCreated, newUser)
}	

func login(c *gin.Context) {
	var input struct {
		Email string `json:"email"`
		Senha string `json:"senha"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	var user Usuario
	err := db.QueryRow(context.Background(),
		`SELECT id, nome, email, senha_hash, tipo, ativo, criado_em
		FROM usuarios WHERE email = $1`,
		input.Email,
	).Scan(&user.ID, &user.Nome, &user.Email, &user.SenhaHash, &user.Tipo, &user.Ativo, &user.CriadoEm)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "email ou senha incorreto"})
		return 
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.SenhaHash), []byte(input.Senha)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "email ou senha incorreto"})
		return
	}

	user.SenhaHash = ""
	c.JSON(http.StatusOK, user)

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
