package main

import (
	"fmt"

	_ "github.com/go-sql-driver/mysql"
	"type-samurai.com/m/v2/database"
	"type-samurai.com/m/v2/handler"
)

func main() {
	db, err := database.Setup()
	if err != nil {
		fmt.Printf("Error initializing database: %v\n", err)
		return
	}

	api := handler.NewHandler(db.Sql)
	ready := make(chan bool, 1)
	cancel := make(chan bool, 1)
	port := "8080"

	api.Serve(port, ready, cancel)

	<-ready
	fmt.Printf("Server is ready on port %s\n", port)
	<-cancel
}
