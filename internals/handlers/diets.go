package handlers

import (
	"context"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"

	"melom/web-services/internals/db"
)

type Dieta struct {
	ID              int `json:"id"`
	PacienteID      int `json:"paciente_id"`
	NutricionistaID int `json:"nutricionista_id"`
}

// AddDieta creates a diet for a patient, authored by a nutritionist.
func AddDieta(c *gin.Context) {
	var input struct {
		PacienteID      int `json:"paciente_id" binding:"required,gt=0"`
		NutricionistaID int `json:"nutricionista_id" binding:"required,gt=0"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "paciente_id e nutricionista_id são obrigatórios"})
		return
	}

	var dieta Dieta
	err := db.Pool.QueryRow(context.Background(), `
		INSERT INTO dieta (paciente_id, nutricionista_id)
		VALUES ($1, $2)
		RETURNING id, paciente_id, nutricionista_id`,
		input.PacienteID, input.NutricionistaID,
	).Scan(&dieta.ID, &dieta.PacienteID, &dieta.NutricionistaID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23503" { // foreign_key_violation
			c.JSON(http.StatusNotFound, gin.H{"error": "paciente ou nutricionista não encontrado"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao criar dieta"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"dieta": dieta})
}
