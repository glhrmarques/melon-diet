package main

import (
	"net/http"
	"github.com/gin-gonic/gin"
	//CORS middleware to solve requests from different servers
	"github.com/gin-contrib/cors"
)


type patient struct {
	Name string `json:"name"`
	Email string `json:"email"`
	Cellphone string `json:"cellphone"`
	Age string `json:"age"`
	Weight string `json:"weight"`
}

var patientList = []patient{

}

func main() {
	router := gin.Default()
	//Creates a middleware that allow all origins, which is fine for local development
	router.Use(cors.Default())

	router.POST("/addPatient", addPatient)
	router.GET("/allPatients",getPatients)
	router.Run("localhost:8080")
}


//endpoint to read all patients
func getPatients(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, patientList)
}


//endpoint that creates new patient
func addPatient(c *gin.Context){
	var newPatient patient 

	if err := c.BindJSON(&newPatient); err != nil {
		//error if the addign patient failed
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to add patient"})
		return 
	}

	patientList = append(patientList, newPatient)
	c.IndentedJSON(http.StatusCreated, newPatient)
}
