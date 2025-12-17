/**
 * Storage Manager Class
 * Handles all localStorage operations for code snippets
 */
class StorageManager {
    constructor() {
        this.storageKey = 'codeSnippets';
        this.initializeStorage();
    }

    /**
     * Initialize localStorage with empty array if not exists
     */
    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
    }

    /**
     * Get all snippets from localStorage
     * @returns {Array} Array of snippet objects
     */
    getSnippets() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || [];
        } catch (error) {
            console.error('Error parsing snippets from localStorage:', error);
            return [];
        }
    }

    /**
     * Save snippets array to localStorage
     * @param {Array} snippets - Array of snippet objects
     * @returns {boolean} Success status
     */
    saveSnippets(snippets) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(snippets));
            return true;
        } catch (error) {
            console.error('Error saving snippets to localStorage:', error);
            return false;
        }
    }

    /**
     * Add a new snippet
     * @param {Object} snippet - Snippet object
     * @returns {boolean} Success status
     */
    addSnippet(snippet) {
        const snippets = this.getSnippets();
        snippet.id = Date.now().toString();
        snippet.createdAt = new Date().toISOString();
        snippets.push(snippet);
        return this.saveSnippets(snippets);
    }

    /**
     * Update an existing snippet
     * @param {string} id - Snippet ID
     * @param {Object} updatedSnippet - Updated snippet object
     * @returns {boolean} Success status
     */
    updateSnippet(id, updatedSnippet) {
        const snippets = this.getSnippets();
        const index = snippets.findIndex(snippet => snippet.id === id);
        
        if (index !== -1) {
            snippets[index] = { 
                ...snippets[index], 
                ...updatedSnippet, 
                updatedAt: new Date().toISOString() 
            };
            return this.saveSnippets(snippets);
        }
        return false;
    }

    /**
     * Delete a snippet by ID
     * @param {string} id - Snippet ID
     * @returns {boolean} Success status
     */
    deleteSnippet(id) {
        const snippets = this.getSnippets();
        const filteredSnippets = snippets.filter(snippet => snippet.id !== id);
        return this.saveSnippets(filteredSnippets);
    }

    /**
     * Get a single snippet by ID
     * @param {string} id - Snippet ID
     * @returns {Object|null} Snippet object or null
     */
    getSnippetById(id) {
        const snippets = this.getSnippets();
        return snippets.find(snippet => snippet.id === id) || null;
    }

    /**
     * Export all snippets as JSON string
     * @returns {string} JSON string of snippets
     */
    exportSnippets() {
        const snippets = this.getSnippets();
        return JSON.stringify(snippets, null, 2);
    }

    /**
     * Import snippets from JSON string
     * @param {string} jsonData - JSON string of snippets
     * @returns {boolean} Success status
     */
    importSnippets(jsonData) {
        try {
            const snippets = JSON.parse(jsonData);
            if (Array.isArray(snippets)) {
                // Validate each snippet has required fields
                const validSnippets = snippets.filter(snippet => 
                    snippet.title && snippet.language && snippet.code
                );
                return this.saveSnippets(validSnippets);
            }
            return false;
        } catch (error) {
            console.error('Error importing snippets:', error);
            return false;
        }
    }

    /**
     * Get all unique tags from all snippets
     * @returns {Array} Array of unique tags
     */
    getAllTags() {
        const snippets = this.getSnippets();
        const allTags = new Set();
        
        snippets.forEach(snippet => {
            if (snippet.tags && Array.isArray(snippet.tags)) {
                snippet.tags.forEach(tag => allTags.add(tag));
            }
        });
        
        return Array.from(allTags).sort();
    }

    /**
     * Search snippets by query
     * @param {string} query - Search query
     * @returns {Array} Array of matching snippets
     */
    searchSnippets(query) {
        const snippets = this.getSnippets();
        const lowerQuery = query.toLowerCase();
        
        return snippets.filter(snippet => {
            return snippet.title.toLowerCase().includes(lowerQuery) ||
                   snippet.description.toLowerCase().includes(lowerQuery) ||
                   snippet.code.toLowerCase().includes(lowerQuery) ||
                   snippet.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
        });
    }
}
