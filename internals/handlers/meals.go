package handlers

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"

	"melom/web-services/internals/db"
)

// Refeicao represents a meal registered in a diet.
type Refeicao struct {
	ID        int    `json:"id"`
	DietaID   int    `json:"dieta_id"`
	Periodo   string `json:"periodo"`
	Descricao string `json:"descricao"`
}

var periodosRefeicao = map[string]struct{}{
	"cafe_da_manha": {},
	"lanche_manha":  {},
	"almoco":        {},
	"lanche_tarde":  {},
	"jantar":        {},
	"ceia":          {},
}

// AddRefeicao creates a meal for an existing diet.
func AddRefeicao(c *gin.Context) {
	var input struct {
		DietaID   int    `json:"dieta_id"`
		Periodo   string `json:"periodo"`
		Descricao string `json:"descricao"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dieta_id, periodo e descricao são obrigatórios"})
		return
	}

	input.Periodo = strings.TrimSpace(input.Periodo)
	input.Descricao = strings.TrimSpace(input.Descricao)
	if _, ok := periodosRefeicao[input.Periodo]; !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "periodo inválido"})
		return
	}
	if input.Descricao == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "descricao é obrigatória"})
		return
	}

	var refeicao Refeicao
	
	err := db.Pool.QueryRow(context.Background(), `
		INSERT INTO refeicao (dieta_id, periodo, descricao)
		VALUES ($1, $2, $3)
		RETURNING id, dieta_id, periodo, descricao`,
		input.DietaID, input.Periodo, input.Descricao,
	).Scan(&refeicao.ID, &refeicao.DietaID, &refeicao.Periodo, &refeicao.Descricao)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			switch pgErr.Code {
			case "23503": // foreign_key_violation
				c.JSON(http.StatusNotFound, gin.H{"error": "dieta não encontrada"})
				return
			}
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "falha ao criar refeição"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"refeicao": refeicao})
}
