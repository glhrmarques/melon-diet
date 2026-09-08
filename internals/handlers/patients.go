package handlers

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

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

func AddPacient(c *gin.Context) {

	var input struct {
		Email          string    `json:"email"`
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
		`INSERT INTO pacientes (nutricionista_id, data_nascimento, nome, sexo, altura_cm, peso_kg, telefone)
		 VALUES (2, $1, $2, $3, $4, $5, $6)
		 RETURNING id, nutricionista_id, nome, data_nascimento, sexo, altura_cm, peso_kg, telefone`,
		input.DataNascimento, input.Nome, input.Sexo, input.Altura, input.Peso, input.Telefone,
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
