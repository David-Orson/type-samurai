package handler

import (
	"database/sql"
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
	h.words.setup(mux)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
