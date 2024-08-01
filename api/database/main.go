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
	host := getEnv("DB_HOST", "0.0.0.0")
	user := getEnv("DB_USER", "root")
	password := getEnv("DB_PASSWORD", "password")
	dbname := getEnv("DB_NAME", "ts")
	port := getEnv("DB_PORT", "33306")

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

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
