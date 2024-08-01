package handler

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
)

type Word struct {
	ID            int    `json:"id"`
	Lowercase     string `json:"lowercase"`
	Attempts      string `json:"attempts"`
	RecentAverage int    `json:"recentAverage"`
	Wordset       int    `json:"wordset"`
}

type WordJSON struct {
	Word    string `json:"word"`
	WPM     int    `json:"wpm"`
	Wordset int    `json:"wordset"`
}

type WordsHandler struct {
	db *sql.DB
}

func (wh *WordsHandler) setup(mux *http.ServeMux) {
	mux.HandleFunc("GET /words/{wordsetId}", wh.words)
	mux.HandleFunc("POST /word", wh.upsertWord)
}

func (wh *WordsHandler) words(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	pathParts := strings.Split(path, "/")

	if len(pathParts) < 3 {
		http.Error(w, "Missing wordsetId", http.StatusBadRequest)
		return
	}

	wordsetIdStr := pathParts[2]
	wordsetId, err := strconv.Atoi(wordsetIdStr)
	if err != nil {
		http.Error(w, "Invalid wordsetId", http.StatusBadRequest)
		return
	}

	rows, err := wh.db.Query(`
		SELECT id, lowercase, attempts, recentAverage, wordset
		FROM words
		WHERE wordset = ?
		ORDER BY recentAverage ASC
		LIMIT 25
	`, wordsetId)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		log.Printf("Database query error: %v", err)
		return
	}
	defer rows.Close()

	var words []Word
	for rows.Next() {
		var word Word
		if err := rows.Scan(&word.ID, &word.Lowercase, &word.Attempts, &word.RecentAverage, &word.Wordset); err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			return
		}
		words = append(words, word)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Error iterating rows", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(words); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func (wh *WordsHandler) upsertWord(w http.ResponseWriter, r *http.Request) {
	var word WordJSON
	err := json.NewDecoder(r.Body).Decode(&word)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	lowercaseWord := strings.ToLower(word.Word)

	var existingAttemptsJSON string
	var existingRecentAverage int
	row := wh.db.QueryRow("SELECT attempts, recentAverage FROM words WHERE lowercase = ? AND wordset = ?", lowercaseWord, word.Wordset)
	err = row.Scan(&existingAttemptsJSON, &existingRecentAverage)

	var existingAttempts []int
	if err == sql.ErrNoRows {
		existingAttempts = []int{}
	} else if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	} else {
		err = json.Unmarshal([]byte(existingAttemptsJSON), &existingAttempts)
		if err != nil {
			http.Error(w, "Failed to parse existing attempts", http.StatusInternalServerError)
			return
		}
	}

	var recentAttempts []int
	recentAttempts = append(existingAttempts, word.WPM)
	existingAttempts = append(existingAttempts, word.WPM)

	if len(existingAttempts) > 10 {
		recentAttempts = existingAttempts[len(existingAttempts)-10:]
	}

	total := 0
	for _, attempt := range recentAttempts {
		total += attempt
	}
	recentAverage := total / len(recentAttempts)

	attemptsJSON, err := json.Marshal(existingAttempts)
	if err != nil {
		http.Error(w, "Failed to marshal attempts", http.StatusInternalServerError)
		return
	}

	_, err = wh.db.Exec(`
		INSERT INTO words (lowercase, attempts, recentAverage, wordset)
		VALUES (?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE attempts = VALUES(attempts), recentAverage = VALUES(recentAverage)
	`, lowercaseWord, attemptsJSON, recentAverage, word.Wordset)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "Word upserted successfully")
}
