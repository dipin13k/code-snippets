/**
 * Storage Manager Class
 * Handles all localStorage operations for code snippets.
 * This implementation uses an in-memory cache to minimize localStorage access,
 * which improves performance by reducing costly JSON parsing and I/O operations.
 */
class StorageManager {
    constructor() {
        this.storageKey = 'codeSnippets';
        // Initialize the in-memory cache by loading snippets from localStorage.
        this.snippets = this._loadSnippets();
    }

    /**
     * Private method to load snippets from localStorage into the cache.
     * This is called only once on initialization.
     * @returns {Array} Array of snippet objects
     */
    _loadSnippets() {
        try {
            const snippetsJSON = localStorage.getItem(this.storageKey);
            // If no data exists in localStorage, initialize it with an empty array.
            if (!snippetsJSON) {
                localStorage.setItem(this.storageKey, JSON.stringify([]));
                return [];
            }
            return JSON.parse(snippetsJSON);
        } catch (error) {
            console.error('Error parsing snippets from localStorage:', error);
            // Return an empty array on error to prevent the application from crashing.
            return [];
        }
    }

    /**
     * Get all snippets from the in-memory cache.
     * @returns {Array} Array of snippet objects
     */
    getSnippets() {
        return this.snippets;
    }

    /**
     * Save the snippets array to both the in-memory cache and localStorage.
     * This method centralizes write operations, ensuring the cache and localStorage are synchronized.
     * @param {Array} snippets - Array of snippet objects
     * @returns {boolean} Success status
     */
    saveSnippets(snippets) {
        try {
            // Update the in-memory cache for immediate access.
            this.snippets = snippets;
            localStorage.setItem(this.storageKey, JSON.stringify(snippets));
            return true;
        } catch (error) {
            console.error('Error saving snippets to localStorage:', error);
            return false;
        }
    }

    /**
     * Add a new snippet.
     * @param {Object} snippet - Snippet object
     * @returns {boolean} Success status
     */
    addSnippet(snippet) {
        // Create a new array to maintain immutability of the cache.
        const snippets = [...this.getSnippets()];
        snippet.id = Date.now().toString();
        snippet.createdAt = new Date().toISOString();
        snippets.push(snippet);
        return this.saveSnippets(snippets);
    }

    /**
     * Update an existing snippet.
     * @param {string} id - Snippet ID
     * @param {Object} updatedSnippet - Updated snippet object
     * @returns {boolean} Success status
     */
    updateSnippet(id, updatedSnippet) {
        const snippets = this.getSnippets();
        let snippetFound = false;

        // Use map to create a new array, preventing direct mutation of the cache.
        const newSnippets = snippets.map(snippet => {
            if (snippet.id === id) {
                snippetFound = true;
                return {
                    ...snippet,
                    ...updatedSnippet,
                    updatedAt: new Date().toISOString()
                };
            }
            return snippet;
        });
        
        if (snippetFound) {
            return this.saveSnippets(newSnippets);
        }
        return false;
    }

    /**
     * Delete a snippet by ID.
     * @param {string} id - Snippet ID
     * @returns {boolean} Success status
     */
    deleteSnippet(id) {
        const snippets = this.getSnippets();
        // The filter method creates a new array, which is ideal for immutability.
        const filteredSnippets = snippets.filter(snippet => snippet.id !== id);

        // Only save if a snippet was actually deleted.
        if (snippets.length !== filteredSnippets.length) {
            return this.saveSnippets(filteredSnippets);
        }
        return false;
    }

    /**
     * Get a single snippet by ID from the cache.
     * @param {string} id - Snippet ID
     * @returns {Object|null} Snippet object or null
     */
    getSnippetById(id) {
        // Reads directly from the fast in-memory cache.
        return this.getSnippets().find(snippet => snippet.id === id) || null;
    }

    /**
     * Export all snippets as a JSON string.
     * @returns {string} JSON string of snippets
     */
    exportSnippets() {
        // Uses the cached snippets for faster export.
        return JSON.stringify(this.getSnippets(), null, 2);
    }

    /**
     * Import snippets from a JSON string.
     * @param {string} jsonData - JSON string of snippets
     * @returns {boolean} Success status
     */
    importSnippets(jsonData) {
        try {
            const snippetsToImport = JSON.parse(jsonData);
            if (!Array.isArray(snippetsToImport)) {
                return false;
            }
            // Validate that each snippet has the required fields.
            const validSnippets = snippetsToImport.filter(snippet =>
                snippet.title && snippet.language && snippet.code
            );
            // saveSnippets updates both the cache and localStorage.
            return this.saveSnippets(validSnippets);
        } catch (error) {
            console.error('Error importing snippets:', error);
            return false;
        }
    }

    /**
     * Get all unique tags from all snippets in the cache.
     * @returns {Array} Array of unique tags
     */
    getAllTags() {
        // Operates on the fast in-memory cache.
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
     * Search snippets by query from the cache.
     * @param {string} query - Search query
     * @returns {Array} Array of matching snippets
     */
    searchSnippets(query) {
        // Searches the fast in-memory cache.
        const snippets = this.getSnippets();
        const lowerQuery = query.toLowerCase();
        
        return snippets.filter(snippet => {
            const inTitle = snippet.title && snippet.title.toLowerCase().includes(lowerQuery);
            const inDescription = snippet.description && snippet.description.toLowerCase().includes(lowerQuery);
            const inCode = snippet.code && snippet.code.toLowerCase().includes(lowerQuery);
            const inTags = snippet.tags && snippet.tags.some(tag => tag.toLowerCase().includes(lowerQuery));

            return inTitle || inDescription || inCode || inTags;
        });
    }
}

// Create and export a single instance to ensure a singleton pattern.
const storageManager = new StorageManager();
