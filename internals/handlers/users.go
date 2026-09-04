package handlers

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"melom/web-services/internals/db"
)

type Usuario struct {
	ID        int       `json:"id"`
	Nome      string    `json:"nome"`
	Email     string    `json:"email"`
	SenhaHash string    `json:"senha_hash,omitempty"`
	Tipo      string    `json:"tipo"`
	Ativo     bool      `json:"ativo"`
	CriadoEm  time.Time `json:"criado_em"`
}

type Nutricionista struct {
	ID        int    `json:"id"`
	UsuarioID int    `json:"usuario_id"`
	Celular   string `json:"celular"`
}

func AddNutricionista(c *gin.Context) {
	var input struct {
		Nome    string `json:"nome"`
		Email   string `json:"email"`
		Senha   string `json:"senha"`
		Celular string `json:"celular"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Falha ao continuar"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Senha), bcrypt.DefaultCost)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Hashing failed"})
    	return
	}

	tx, err := db.Pool.Begin(context.Background())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to start the transaction"})
		return
	}
	defer tx.Rollback(context.Background())

	var usuario Usuario
	err = tx.QueryRow(context.Background(),
		`INSERT INTO usuarios (nome, email, senha_hash, tipo)
		VALUES ($1, $2, $3, 'nutricionista')
		RETURNING id, nome, email, tipo, ativo, criado_em`,
		input.Nome, input.Email, string(hashedPassword),
	).Scan(&usuario.ID, &usuario.Nome, &usuario.Email, &usuario.Tipo, &usuario.Ativo, &usuario.CriadoEm)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to create usuario"})
		return
	}

	var nutri Nutricionista
	err = tx.QueryRow(context.Background(),
		`INSERT INTO nutricionistas (usuario_id, celular)
		 VALUES ($1, $2)
		 RETURNING id, usuario_id, celular`,
		usuario.ID, input.Celular,
	).Scan(&nutri.ID, &nutri.UsuarioID, &nutri.Celular)

	if err != nil {
		log.Printf("Failed to create nutricionista: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to create nutricionista"})
		return
	}

	err = tx.Commit(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to commit db transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"usuario":       usuario,
		"nutricionista": nutri,
	})
}

func Login(c *gin.Context) {

	//binding:"required" -> this fied must be present in the JSON and have the correct field format
	var input struct {
		Email string `json:"email" binding:"required"`
		Senha string `json:"senha" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "E-mail e senha são obrigatórios"})
		return
	}

	var usuario Usuario
	err := db.Pool.QueryRow(context.Background(), `
		SELECT id, nome, email, senha_hash, tipo, ativo, criado_em
		FROM usuarios
		WHERE email = $1
	`, input.Email).Scan(
		&usuario.ID,
		&usuario.Nome,
		&usuario.Email,
		&usuario.SenhaHash,
		&usuario.Tipo,
		&usuario.Ativo,
		&usuario.CriadoEm,
	)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "E-mail ou senha inválidos"})
		return
	}

	if !usuario.Ativo ||
		bcrypt.CompareHashAndPassword([]byte(usuario.SenhaHash), []byte(input.Senha)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "E-mail ou senha inválidos"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"usuario": gin.H{
			"id": usuario.ID, "nome": usuario.Nome,
			"email": usuario.Email, "tipo": usuario.Tipo,
		},
	})
}
