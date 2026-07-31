package handlers

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"melom/web-services/internals/db"
)

type Patient struct {
	ID              int       `json:"id"`
	NutricionistaID int       `json:"nutricionista_id"`
	DataNascimento  time.Time `json:"data_nascimento"`
	Sexo            string    `json:"sexo"`
	Altura          float64   `json:"altura_cm"`
	Peso            float64   `json:"peso_kg"`
	Telefone        string    `json:"telefone"`
}

func AddPacient(c *gin.Context) {

	var input struct {
		Email          string    `json:"email"`
		DataNascimento time.Time `json:"data_nascimento"`
		Sexo           string    `json:"sexo"`
		Altura         float64   `json:"altura_cm"`
		Peso           float64   `json:"peso_kg"`
		Telefone       string    `json:"telefone"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		log.Printf("Falha ao continuar: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Falha ao continuar"})
		return
	}

	tx, err := db.Pool.Begin(context.Background())
	if err != nil {
		log.Printf("Falha ao transacionar: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Falha ao transacionar"})
		return
	}
	defer tx.Rollback(context.Background())

	var patient Patient
	// NOTE: nutricionista_id is hardcoded to 6 below — replace with a real value
	// once you have auth / a way to identify the logged-in nutricionista.
	// Make sure a nutricionista with id 6 actually exists, or this will fail
	// on the foreign key constraint.
	err = tx.QueryRow(context.Background(),
		`INSERT INTO pacientes (nutricionista_id, data_nascimento, sexo, altura_cm, peso_kg, telefone)
		 VALUES (6, $1, $2, $3, $4, $5)
		 RETURNING id, nutricionista_id, data_nascimento, sexo, altura_cm, peso_kg, telefone`,
		 input.DataNascimento, input.Sexo, input.Altura, input.Peso, input.Telefone,
	).Scan(
		&patient.ID,
		&patient.NutricionistaID,
		&patient.DataNascimento,
		&patient.Sexo,
		&patient.Altura,
		&patient.Peso,
		&patient.Telefone,
	)
	if err != nil {
		log.Printf("Falha ao criar paciente: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Falha ao criar paciente"})
		return
	}

	err = tx.Commit(context.Background())
	if err != nil {
		log.Printf("Falha ao comitar: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Falha ao comitar"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"paciente": patient,
	})
}