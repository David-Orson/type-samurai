package handler

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
)

type Handler struct {
	words *WordsHandler
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{
		words: &WordsHandler{db: db},
	}
}

func (h *Handler) Serve(port string, ready chan<- bool, cancel chan<- bool) {
	mux := http.NewServeMux()

	h.setupRoutes(mux)

	corsMux := withCORS(mux)

	server := &http.Server{
		Addr:    ":" + port,
		Handler: corsMux,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil {
			log.Printf("server error: %v", err)
			cancel <- true
		}
	}()
	ready <- true
}

func (h *Handler) setupRoutes(mux *http.ServeMux) {
	fmt.Println("Setting up routes")
	h.words.setup(mux)
}

func withCORS(next http.Handler) http.Handler {
	fmt.Println("Setting up CORS")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Setting up CORS 2")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		fmt.Println(r.URL.Path)
		fmt.Println(r.Method)

		if r.Method == http.MethodOptions {
			fmt.Println("Setting up CORS 3")
			w.WriteHeader(http.StatusNoContent)
			return
		}

		fmt.Println("NEXT")
		next.ServeHTTP(w, r)
	})
}
