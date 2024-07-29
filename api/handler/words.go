package handler

import (
	"database/sql"
	"fmt"
	"net/http"
)

type WordsHandler struct {
	db *sql.DB
}

func (wh *WordsHandler) setup(mux *http.ServeMux) {
	mux.HandleFunc("GET /words", wh.words)
}

func (wh *WordsHandler) words(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Hello, world!")
}
