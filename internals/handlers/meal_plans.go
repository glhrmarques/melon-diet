package handlers

import (
	_ "embed"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"slices"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"golang.org/x/text/cases"
	"golang.org/x/text/unicode/norm"

	"melom/web-services/internals/db"
)

type tacoFood struct {
	ID         int    `json:"id"`
	Nome       string `json:"nome"`
	searchName string
}

// TACO, 4ª edição (NEPA/UNICAMP, 2011). The official spreadsheet is linked in migrations/README.md.
//
//go:embed taco.json
var tacoData []byte

var tacoFoods = loadTACO()

func loadTACO() []tacoFood {
	var foods []tacoFood
	if err := json.Unmarshal(tacoData, &foods); err != nil {
		panic(err)
	}
	for i := range foods {
		foods[i].searchName = normalizeFood(foods[i].Nome)
	}
	return foods
}

func normalizeFood(value string) string {
	return strings.Map(func(r rune) rune {
		if unicode.Is(unicode.Mn, r) {
			return -1
		}
		if unicode.IsPunct(r) {
			return ' '
		}
		return r
	}, norm.NFD.String(cases.Fold().String(value)))
}

func SearchFoods(c *gin.Context) {
	query := strings.Fields(normalizeFood(c.Query("q")))
	results := []tacoFood{}
	if len(strings.Join(query, "")) >= 2 {
		for _, food := range tacoFoods {
			if slices.ContainsFunc(query, func(word string) bool {
				return !strings.Contains(food.searchName, word)
			}) {
				continue
			}
			results = append(results, food)
			if len(results) == 20 {
				break
			}
		}
	}
	c.JSON(http.StatusOK, gin.H{"alimentos": results})
}

type mealFood struct {
	TacoID          int     `json:"taco_id" binding:"required,gt=0"`
	Nome            string  `json:"nome"`
	Medida          string  `json:"medida" binding:"required,oneof=g unidade fatia colher xícara"`
	Quantidade      float64 `json:"quantidade" binding:"required,gt=0,lte=100000"`
	GramasPorMedida float64 `json:"gramas_por_medida" binding:"omitempty,gt=0,lte=100000"`
	PesoGramas      float64 `json:"peso_gramas"`
}

type mealPlanMeal struct {
	ID         int        `json:"id"`
	Periodo    string     `json:"periodo"`
	Horario    string     `json:"horario"`
	Observacao string     `json:"observacao"`
	Alimentos  []mealFood `json:"alimentos"`
}

var mealPlanPeriods = map[string]string{
	"cafe_da_manha": "Café da manhã",
	"almoco":        "Almoço",
	"lanche_tarde":  "Café da Tarde",
	"jantar":        "Janta",
}

func planError(c *gin.Context, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Paciente ou plano não encontrado."})
		return
	}
	log.Printf("meal plan: %v", err)
	c.JSON(http.StatusInternalServerError, gin.H{"error": "Não foi possível acessar o plano alimentar."})
}

func SavePlanMeal(c *gin.Context) {
	var input struct {
		UsuarioID  int        `json:"usuario_id" binding:"required,gt=0"`
		DietaID    int        `json:"dieta_id" binding:"gte=0"`
		PedidoID   string     `json:"pedido_id" binding:"required,uuid4"`
		Periodo    string     `json:"periodo" binding:"required"`
		Horario    string     `json:"horario" binding:"required"`
		Observacao string     `json:"observacao" binding:"max=2000"`
		Alimentos  []mealFood `json:"alimentos" binding:"required,min=1,max=100,dive"`
	}
	pacienteID, err := strconv.Atoi(c.Param("pacienteID"))
	if err != nil || pacienteID <= 0 || c.ShouldBindJSON(&input) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Confira os dados da refeição."})
		return
	}
	label, validPeriod := mealPlanPeriods[input.Periodo]
	hour, timeErr := time.Parse("15:04", input.Horario)
	if !validPeriod || timeErr != nil || hour.Format("15:04") != input.Horario {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Selecione o nome e o horário da refeição."})
		return
	}
	for i := range input.Alimentos {
		food := &input.Alimentos[i]
		if food.TacoID > len(tacoFoods) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Confira o alimento selecionado."})
			return
		}
		food.Nome = tacoFoods[food.TacoID-1].Nome
		food.PesoGramas = food.Quantidade
		if food.Medida != "g" {
			food.PesoGramas *= food.GramasPorMedida
		}
	}

	ctx := c.Request.Context()
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		planError(c, err)
		return
	}
	defer tx.Rollback(ctx)

	var nutritionistID int
	err = tx.QueryRow(ctx, `
		SELECT p.nutricionista_id FROM pacientes p
		JOIN nutricionistas n ON n.id = p.nutricionista_id
		WHERE p.id = $1 AND n.usuario_id = $2 FOR UPDATE OF p`, pacienteID, input.UsuarioID).Scan(&nutritionistID)
	if err != nil {
		planError(c, err)
		return
	}

	var previousPlan int
	err = tx.QueryRow(ctx, `
		SELECT r.dieta_id FROM refeicao r JOIN dieta d ON d.id = r.dieta_id
		WHERE r.pedido_id = $1::text::uuid AND d.paciente_id = $2 AND d.nutricionista_id = $3`,
		input.PedidoID, pacienteID, nutritionistID).Scan(&previousPlan)
	if err == nil {
		c.JSON(http.StatusOK, gin.H{"dieta_id": previousPlan})
		return
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		planError(c, err)
		return
	}

	planID := input.DietaID
	if planID == 0 {
		err = tx.QueryRow(ctx, `
			INSERT INTO dieta (paciente_id, nutricionista_id) VALUES ($1, $2) RETURNING id`,
			pacienteID, nutritionistID).Scan(&planID)
	} else {
		err = tx.QueryRow(ctx, `
			SELECT id FROM dieta WHERE id = $1 AND paciente_id = $2 AND nutricionista_id = $3 FOR UPDATE`,
			planID, pacienteID, nutritionistID).Scan(&planID)
	}
	if err != nil {
		planError(c, err)
		return
	}

	var mealID int
	err = tx.QueryRow(ctx, `
		INSERT INTO refeicao (dieta_id, periodo, descricao, horario, pedido_id, observacao)
		VALUES ($1, $2, $3, $4::text::time, $5::text::uuid, $6) RETURNING id`,
		planID, input.Periodo, label, input.Horario, input.PedidoID, strings.TrimSpace(input.Observacao)).Scan(&mealID)
	if err != nil {
		planError(c, err)
		return
	}
	for i, food := range input.Alimentos {
		_, err = tx.Exec(ctx, `
			INSERT INTO refeicao_alimento (refeicao_id, ordem, taco_id, nome, medida, quantidade, peso_gramas)
			VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7::numeric, 0))`,
			mealID, i, food.TacoID, food.Nome, food.Medida, food.Quantidade, food.PesoGramas)
		if err != nil {
			planError(c, err)
			return
		}
	}
	if err = tx.Commit(ctx); err != nil {
		planError(c, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"dieta_id": planID})
}

func GetMealPlan(c *gin.Context) {
	pacienteID, errPatient := strconv.Atoi(c.Param("pacienteID"))
	planID, errPlan := strconv.Atoi(c.Param("dietaID"))
	usuarioID, errUser := strconv.Atoi(c.Query("usuario_id"))
	if errPatient != nil || errPlan != nil || errUser != nil || min(pacienteID, planID, usuarioID) <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Plano inválido."})
		return
	}
	var meals []mealPlanMeal
	err := db.Pool.QueryRow(c.Request.Context(), `
		SELECT COALESCE((
			SELECT jsonb_agg(jsonb_build_object(
				'id', r.id, 'periodo', r.periodo, 'horario', left(r.horario::text, 5),
				'observacao', COALESCE(r.observacao, ''), 'alimentos', COALESCE((
					SELECT jsonb_agg(jsonb_build_object(
						'taco_id', a.taco_id, 'nome', a.nome, 'medida', a.medida,
						'quantidade', a.quantidade, 'peso_gramas', a.peso_gramas) ORDER BY a.ordem)
					FROM refeicao_alimento a WHERE a.refeicao_id = r.id
				), '[]'::jsonb)) ORDER BY r.horario, r.id)
			FROM refeicao r WHERE r.dieta_id = d.id AND r.horario IS NOT NULL
		), '[]'::jsonb)
		FROM dieta d JOIN pacientes p ON p.id = d.paciente_id AND p.nutricionista_id = d.nutricionista_id
		JOIN nutricionistas n ON n.id = d.nutricionista_id
		WHERE d.id = $1 AND p.id = $2 AND n.usuario_id = $3`, planID, pacienteID, usuarioID).Scan(&meals)
	if err != nil {
		planError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"refeicoes": meals})
}
