package database

import (
	"database/sql"
	"fmt"
	"os"
)

type DataBase struct {
	Sql *sql.DB
}

func Setup() (DataBase, error) {
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", user, password, host, port, dbname)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return DataBase{}, err
	}

	p := db.Ping()
	if p != nil {
		fmt.Println("Error pinging db", p)
	}

	c, err := os.ReadFile("./database/migrations/main.sql")
	if err != nil {
		fmt.Println("Error reading migrations file", err)
		return DataBase{}, err
	}

	mg := string(c)

	_, err = db.Exec(mg)
	if err != nil {
		fmt.Println("Error executing migrations", err)
		return DataBase{}, err
	}

	return DataBase{Sql: db}, nil
}
