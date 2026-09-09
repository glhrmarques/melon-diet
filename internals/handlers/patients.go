package handlers

import (
	"context"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"melom/web-services/internals/db"
)

type Patient struct {
	ID              int       `json:"id"`
	NutricionistaID int       `json:"nutricionista_id"`
	DataNascimento  time.Time `json:"data_nascimento"`
	Nome            string    `json:"nome"`
	Sexo            string    `json:"sexo"`
	Altura          float64   `json:"altura_cm"`
	Peso            float64   `json:"peso_kg"`
	Telefone        string    `json:"telefone"`
}

// ListPatients returns only the patients linked to the logged-in nutritionist's user.
func ListPatients(c *gin.Context) {
	//converts a string to an integer
	usuarioID, err := strconv.Atoi(c.Query("usuario_id"))

	if err != nil || usuarioID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "usuario_id inválido"})
		return
	}

	rows, err := db.Pool.Query(context.Background(), `
		SELECT p.id, p.nutricionista_id, p.data_nascimento, p.nome,
		       p.sexo, p.altura_cm, p.peso_kg, p.telefone
		FROM pacientes p
		INNER JOIN nutricionistas n ON n.id = p.nutricionista_id
		WHERE n.usuario_id = $1
		ORDER BY p.nome`, usuarioID)

	if err != nil {
		log.Printf("Falha ao buscar pacientes: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao buscar pacientes"})
		return
	}
	//Resource management, Connection Pool Exhaustion
	defer rows.Close()

	patients := make([]Patient, 0)
	for rows.Next() {
		var patient Patient
		if err := rows.Scan(
			&patient.ID,
			&patient.NutricionistaID,
			&patient.DataNascimento,
			&patient.Nome,
			&patient.Sexo,
			&patient.Altura,
			&patient.Peso,
			&patient.Telefone,
		); err != nil {
			log.Printf("Falha ao ler paciente: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao buscar pacientes"})
			return
		}

		patients = append(patients, patient)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Falha ao buscar pacientes: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao buscar pacientes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"pacientes": patients})
}

func AddPatient(c *gin.Context) {
	usuarioID, err := strconv.Atoi(c.Query("usuario_id"))
	if err != nil || usuarioID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "usuario_id inválido"})
		return
	}

	tx, err := db.Pool.Begin(context.Background())

	var nutricionistaID int

	err = tx.QueryRow(context.Background(),
		`SELECT id FROM nutricionistas WHERE usuario_id = $1`, usuarioID,
	).Scan(&nutricionistaID)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nutricionista não encontrado"})
		return
	}

	defer tx.Rollback(context.Background())

	var input struct {
		DataNascimento time.Time `json:"data_nascimento"`
		Nome           string    `json:"nome"`
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


	if err != nil {
		log.Printf("Falha ao transacionar: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Falha ao transacionar"})
		return
	}


	if err != nil {
		log.Printf("Falha ao buscar nutricionista: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar paciente"})
		return
	}

	var patient Patient
	err = tx.QueryRow(context.Background(),
		`INSERT INTO pacientes (nutricionista_id, data_nascimento, nome, sexo, altura_cm, peso_kg, telefone)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, nutricionista_id, nome, data_nascimento, sexo, altura_cm, peso_kg, telefone`,
		nutricionistaID, input.DataNascimento, input.Nome, input.Sexo, input.Altura, input.Peso, input.Telefone,
	).Scan(
		&patient.ID,
		&patient.NutricionistaID,
		&patient.Nome,
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
