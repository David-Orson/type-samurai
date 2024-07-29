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

	h.setupChildren(mux)

	server := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	go func() {
		if err := server.ListenAndServe(); err != nil {
			log.Printf("server error: %v", err)
			cancel <- true
		}
	}()
	ready <- true
}

func (h *Handler) setupChildren(mux *http.ServeMux) {
	h.words.setup(mux)
}
