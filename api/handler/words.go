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
	ID             int    `json:"id"`
	Lowercase      string `json:"lowercase"`
	Attempts       string `json:"attempts"`
	RecentAttempts string `json:"recentAttempts"`
	RecentAverage  int    `json:"recentAverage"`
	SuccessAverage int    `json:"successAverage"`
	PR             int    `json:"pr"`
	Wordset        int    `json:"wordset"`
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
	fmt.Println("Setting up words handler")
	mux.HandleFunc("GET /words/slow/{wordsetId}", wh.slowWords)
	mux.HandleFunc("POST /word", wh.upsertWord)
	mux.HandleFunc("GET /userwords/{wordsetId}", wh.userWords)
	fmt.Println("Setting up words handler")
}

func (wh *WordsHandler) userWords(w http.ResponseWriter, r *http.Request) {
	fmt.Println("getuserwords")
	path := r.URL.Path
	pathParts := strings.Split(path, "/")
	fmt.Println("yo")
	if len(pathParts) < 3 {
		http.Error(w, "Missing wordsetId", http.StatusBadRequest)
		return
	}
	fmt.Println("yo")
	wordsetIdStr := pathParts[2]
	wordsetId, err := strconv.Atoi(wordsetIdStr)
	fmt.Println("yo")
	if err != nil {
		http.Error(w, "Invalid wordsetId", http.StatusBadRequest)
		return
	}
	fmt.Println("yo")
	rows, err := wh.db.Query(`
    SELECT id, lowercase, recentAttempts, recentAverage, successAverage, pr, wordset
    FROM words
    WHERE wordset = ?
    ORDER BY recentAverage ASC
  `, wordsetId)
	fmt.Println("yo")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		log.Printf("Database query error: %v", err)
		return
	}
	fmt.Println("yo")
	defer rows.Close()
	fmt.Println("yo")
	var words []Word
	fmt.Println("yo")
	for rows.Next() {
		var word Word
		if err := rows.Scan(&word.ID, &word.Lowercase, &word.RecentAttempts, &word.RecentAverage, &word.SuccessAverage, &word.PR, &word.Wordset); err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			return
		}
		words = append(words, word)
	}
	fmt.Println("yo")
	if err := rows.Err(); err != nil {
		http.Error(w, "Error iterating rows", http.StatusInternalServerError)
		return
	}
	fmt.Println("yo")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(words); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
	fmt.Println("yo")
}

func (wh *WordsHandler) slowWords(w http.ResponseWriter, r *http.Request) {
	fmt.Println("slow")
	path := r.URL.Path
	pathParts := strings.Split(path, "/")

	if len(pathParts) < 3 {
		http.Error(w, "Missing wordsetId", http.StatusBadRequest)
		return
	}

	wordsetIdStr := pathParts[3]
	wordsetId, err := strconv.Atoi(wordsetIdStr)
	if err != nil {
		http.Error(w, "Invalid wordsetId", http.StatusBadRequest)
		return
	}

	fmt.Println("wordsetId", wordsetId)
	rows, err := wh.db.Query(`
		SELECT id, lowercase, recentAttempts, recentAverage, successAverage, pr, wordset
		FROM words
		WHERE wordset = ?
    AND lowercase = 'out'
		ORDER BY pr DESC
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
		if err := rows.Scan(&word.ID, &word.Lowercase, &word.RecentAttempts, &word.RecentAverage, &word.SuccessAverage, &word.PR, &word.Wordset); err != nil {
			http.Error(w, "Error scanning data", http.StatusInternalServerError)
			return
		}
		words = append(words, word)
	}

	fmt.Println("words", words)

	if err := rows.Err(); err != nil {
		http.Error(w, "Error iterating rows", http.StatusInternalServerError)
		return
	}

	// now let's loop through the words, track the average pr of the words iterated over, and if the pr drops below 200 we stop pushing to the finalWords slice
	var fastWords []Word
	var totalPR int

	for _, word := range words {
		totalPR += word.PR
		if len(fastWords) == 0 || totalPR/len(fastWords)+1 > 200 {
			fmt.Println("appending", word)
			fastWords = append(fastWords, word)
		} else {
			break
		}
	}

	var finalWords []Word

	finalWords = fastWords

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(finalWords); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func (wh *WordsHandler) upsertWord(w http.ResponseWriter, r *http.Request) {
	fmt.Println("upsert")
	var word WordJSON
	err := json.NewDecoder(r.Body).Decode(&word)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	lowercaseWord := strings.ToLower(word.Word)

	var pr int
	var existingAttemptsJSON string
	row := wh.db.QueryRow("SELECT attempts, pr FROM words WHERE lowercase = ? AND wordset = ?", lowercaseWord, word.Wordset)
	err = row.Scan(&existingAttemptsJSON, &pr)

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

	// attempts
	attempts := append(existingAttempts, word.WPM)
	attemptsJSON, err := json.Marshal(attempts)
	if err != nil {
		http.Error(w, "Failed to marshal attempts", http.StatusInternalServerError)
		return
	}

	// recentAttempts
	var recentAttempts []int
	recencyDefinition := 20

	if len(attempts) > recencyDefinition {
		recentAttempts = attempts[len(attempts)-recencyDefinition:]
	} else {
		recentAttempts = attempts
	}
	recentAttemptsJSON, err := json.Marshal(recentAttempts)
	if err != nil {
		http.Error(w, "Failed to marshal recent attempts", http.StatusInternalServerError)
	}

	unmarshalledRecentAttempts := []int{}
	err = json.Unmarshal(recentAttemptsJSON, &unmarshalledRecentAttempts)
	if err != nil {
		http.Error(w, "Failed to unmarshal recent attempts", http.StatusInternalServerError)
	}

	// recentAverage
	total := 0
	for _, attempt := range recentAttempts {
		total += attempt
	}
	recentAverage := total / len(recentAttempts)

	// success Average
	var successfulAttempts []int
	for _, attempt := range attempts {
		if attempt > 0 {
			successfulAttempts = append(successfulAttempts, attempt)
		}
	}

	total = 0
	for _, attempt := range successfulAttempts {
		total += attempt
	}
	var successfulAverage int
	if total == 0 {
		successfulAverage = 0
	} else {
		successfulAverage = total / len(successfulAttempts)
	}

	// pr
	if word.WPM > pr {
		pr = word.WPM
	}

	_, err = wh.db.Exec(`
		INSERT INTO words (lowercase, attempts, recentAttempts, recentAverage, successAverage, pr, wordset)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE attempts = VALUES(attempts), recentAttempts = VALUES(recentAttempts), recentAverage = VALUES(recentAverage), successAverage = VALUES(successAverage), pr = VALUES(pr)
	`, lowercaseWord, attemptsJSON, recentAttemptsJSON, recentAverage, successfulAverage, pr, word.Wordset)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, "Word upserted successfully")
}
