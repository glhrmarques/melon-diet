package handlers

import (
	"context"
	"log"
	"net/http"
	"time"

	"golang.org/x/crypto/bcrypt"
	"github.com/gin-gonic/gin"

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
	CRN       string `json:"crn"`
	Celular   string `json:"celular"`
}

func AddNutricionista(c *gin.Context) {
	var input struct {
		Nome    string `json:"nome"`
		Email   string `json:"email"`
		Senha   string `json:"senha"`
		CRN     string `json:"crn"`
		Celular string `json:"celular"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Falha ao continuar"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Senha), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Hashing failed"})
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
		`INSERT INTO nutricionistas (usuario_id, crn, celular)
		 VALUES ($1, $2, $3)
		 RETURNING id, usuario_id, crn, celular`,
		usuario.ID, input.CRN, input.Celular,
	).Scan(&nutri.ID, &nutri.UsuarioID, &nutri.CRN, &nutri.Celular)

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