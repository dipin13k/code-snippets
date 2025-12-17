/**
 * Storage Manager
 * Handles all data operations for snippets using localStorage
 */
class StorageManager {
    constructor() {
        this.storageKey = 'code_snippets';
        this.snippets = this.getSnippets();
    }

    /**
     * Save snippets to localStorage
     * @param {Array} snippets - Array of snippets to save
     */
    _saveSnippets(snippets) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(snippets));
            return true;
        } catch (error) {
            console.error("Error saving snippets to localStorage:", error);
            return false;
        }
    }

    /**
     * Generate a unique ID for a new snippet
     * @returns {string} Unique ID
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get all snippets from localStorage
     * @returns {Array} Array of snippets
     */
    getSnippets() {
        try {
            const snippetsJson = localStorage.getItem(this.storageKey);
            return snippetsJson ? JSON.parse(snippetsJson) : [];
        } catch (error) {
            console.error("Error getting snippets from localStorage:", error);
            return [];
        }
    }

    /**
     * Add a new snippet
     * @param {Object} snippet - Snippet object to add
     * @returns {boolean} Success or failure
     */
    addSnippet(snippet) {
        const newSnippet = {
            id: this._generateId(),
            createdAt: new Date().toISOString(),
            ...snippet
        };
        this.snippets.push(newSnippet);
        return this._saveSnippets(this.snippets);
    }

    /**
     * Get a snippet by its ID
     * @param {string} id - Snippet ID
     * @returns {Object|null} Snippet object or null if not found
     */
    getSnippetById(id) {
        return this.snippets.find(snippet => snippet.id === id) || null;
    }

    /**
     * Update an existing snippet
     * @param {string} id - Snippet ID
     * @param {Object} updatedSnippet - Updated snippet data
     * @returns {boolean} Success or failure
     */
    updateSnippet(id, updatedSnippet) {
        const index = this.snippets.findIndex(snippet => snippet.id === id);
        if (index === -1) {
            return false;
        }
        this.snippets[index] = { ...this.snippets[index], ...updatedSnippet };
        return this._saveSnippets(this.snippets);
    }

    /**
     * Delete a snippet
     * @param {string} id - Snippet ID
     * @returns {boolean} Success or failure
     */
    deleteSnippet(id) {
        const initialLength = this.snippets.length;
        this.snippets = this.snippets.filter(snippet => snippet.id !== id);
        return this.snippets.length < initialLength && this._saveSnippets(this.snippets);
    }

    /**
     * Export snippets as JSON
     * @returns {string} JSON string of snippets
     */
    exportSnippets() {
        return JSON.stringify(this.getSnippets(), null, 2);
    }

    /**
     * Import snippets from JSON
     * @param {string} jsonData - JSON string of snippets
     * @returns {boolean} Success or failure
     */
    importSnippets(jsonData) {
        try {
            const importedSnippets = JSON.parse(jsonData);
            if (!Array.isArray(importedSnippets)) {
                return false;
            }
            // A simple validation to check if objects have required properties
            const valid = importedSnippets.every(s => s.title && s.code && s.language);
            if (!valid) return false;

            this.snippets = importedSnippets;
            return this._saveSnippets(this.snippets);
        } catch (error) {
            console.error("Error importing snippets:", error);
            return false;
        }
    }

    /**
     * Get all unique tags
     * @returns {Array<string>} Sorted array of unique tags
     */
    getAllTags() {
        const allTags = this.snippets.reduce((acc, snippet) => {
            if (snippet.tags && Array.isArray(snippet.tags)) {
                snippet.tags.forEach(tag => acc.add(tag));
            }
            return acc;
        }, new Set());

        return Array.from(allTags).sort();
    }
}
