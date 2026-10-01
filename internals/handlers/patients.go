package handlers

import (
	"context"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
	_ "time/tzdata"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"

	"melom/web-services/internals/db"
)

type Patient struct {
	ID              int     `json:"id"`
	NutricionistaID int     `json:"nutricionista_id"`
	DataNascimento  string  `json:"data_nascimento"`
	Nome            string  `json:"nome"`
	Sexo            string  `json:"sexo"`
	Altura          float64 `json:"altura_cm"`
	Peso            float64 `json:"peso_kg"`
	Telefone        string  `json:"telefone"`
	Email           string  `json:"email"`
}

// ListPatients returns only the patients linked to the logged-in nutritionist's user.
func ListPatients(c *gin.Context) {
	//converts a string to an integer
	usuarioID, err := strconv.Atoi(c.Query("usuario_id"))

	if err != nil || usuarioID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "usuario_id inválido"})
		return
	}

	rows, err := db.Pool.Query(c.Request.Context(), `
		SELECT p.id, p.nutricionista_id, COALESCE(to_char(p.data_nascimento, 'YYYY-MM-DD'), ''), p.nome,
		       p.sexo, p.altura_cm, p.peso_kg, COALESCE(p.telefone, ''), COALESCE(p.email, '')
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
			&patient.Email,
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

type CreatePatientInput struct {
	Nome           string  `json:"nome" binding:"required"`
	DataNascimento string  `json:"data_nascimento" binding:"required"`
	Sexo           string  `json:"sexo" binding:"required,oneof=Feminino Masculino Outro 'Não informado'"`
	AlturaCM       float64 `json:"altura_cm" binding:"required,gt=0"`
	PesoKG         float64 `json:"peso_kg" binding:"required,gt=0"`
	Email          string  `json:"email" binding:"required,email"`
	Telefone       string  `json:"telefone"`
}

// Keeping this dependency small lets tests exercise failures without a real database.
type patientDatabase interface {
	Begin(context.Context) (pgx.Tx, error)
}

func AddPatient(c *gin.Context) {
	addPatient(c, db.Pool, time.Now())
}

func addPatient(c *gin.Context, database patientDatabase, now time.Time) {
	usuarioID, err := strconv.Atoi(c.Query("usuario_id"))
	if err != nil || usuarioID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "usuario_id inválido"})
		return
	}

	var input CreatePatientInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados do paciente inválidos"})
		return
	}

	input.Nome = strings.TrimSpace(input.Nome)
	input.Telefone = strings.TrimSpace(input.Telefone)
	if input.Nome == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nome é obrigatório"})
		return
	}
	birthDate, err := time.Parse(time.DateOnly, input.DataNascimento)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data de nascimento inválida"})
		return
	}
	// Compare calendar dates in the app's timezone, without shifting a birthday by UTC offset.
	location, err := time.LoadLocation("America/Sao_Paulo")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao validar data"})
		return
	}
	if input.DataNascimento > now.In(location).Format(time.DateOnly) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data de nascimento não pode ser futura"})
		return
	}

	ctx := c.Request.Context()
	tx, err := database.Begin(ctx)
	if err != nil {
		log.Printf("Falha ao iniciar cadastro: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar paciente"})
		return
	}
	defer func() {
		cleanupCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = tx.Rollback(cleanupCtx)
	}()

	var nutricionistaID int
	err = tx.QueryRow(ctx,
		`SELECT id FROM nutricionistas WHERE usuario_id = $1`, usuarioID,
	).Scan(&nutricionistaID)
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nutricionista não encontrado"})
		return
	}
	if err != nil {
		log.Printf("Falha ao buscar nutricionista: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar paciente"})
		return
	}

	var patient Patient
	err = tx.QueryRow(ctx,
		`INSERT INTO pacientes (nutricionista_id, data_nascimento, nome, sexo, altura_cm, peso_kg, telefone, email)
		 VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, ''), $8)
		 RETURNING id, nutricionista_id, nome, to_char(data_nascimento, 'YYYY-MM-DD'), sexo, altura_cm, peso_kg, COALESCE(telefone, ''), email`,
		nutricionistaID, birthDate, input.Nome, input.Sexo, input.AlturaCM, input.PesoKG, input.Telefone, input.Email,
	).Scan(
		&patient.ID,
		&patient.NutricionistaID,
		&patient.Nome,
		&patient.DataNascimento,
		&patient.Sexo,
		&patient.Altura,
		&patient.Peso,
		&patient.Telefone,
		&patient.Email,
	)
	if err != nil {
		log.Printf("Falha ao criar paciente: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao criar paciente"})
		return
	}

	err = tx.Commit(ctx)
	if err != nil {
		log.Printf("Falha ao comitar: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao concluir cadastro"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"paciente": patient,
	})
}
