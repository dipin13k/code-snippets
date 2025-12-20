/**
 * Main Application Controller
 * Handles all UI interactions and application logic
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const snippetsContainer = document.getElementById('snippets-container');
    const searchInput = document.getElementById('search-input');
    const languageFilter = document.getElementById('language-filter');
    const tagFilter = document.getElementById('tag-filter');
    const addSnippetBtn = document.getElementById('add-snippet-btn');
    const snippetModal = document.getElementById('snippet-modal');
    const viewModal = document.getElementById('view-modal');
    const snippetForm = document.getElementById('snippet-form');
    const cancelBtn = document.getElementById('cancel-btn');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const copyBtn = document.getElementById('copy-btn');
    const editBtn = document.getElementById('edit-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const modalTitle = document.getElementById('modal-title');
    
    // Close buttons
    const closeButtons = document.querySelectorAll('.close');
    
    // Storage manager instance
    const storage = new StorageManager();
    
    // Current snippet ID for editing/viewing
    let currentSnippetId = null;
    
    // Initialize the app
    function init() {
        renderSnippets();
        updateTagFilter();
        setupEventListeners();
        
        // Add some sample snippets if storage is empty
        if (storage.getSnippets().length === 0) {
            addSampleSnippets();
        }
    }
    
    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Search and filters
        searchInput.addEventListener('input', debounce(renderSnippets, 300));
        languageFilter.addEventListener('change', renderSnippets);
        tagFilter.addEventListener('change', renderSnippets);
        
        // Add snippet button
        addSnippetBtn.addEventListener('click', openAddModal);
        
        // Modal close buttons
        closeButtons.forEach(button => {
            button.addEventListener('click', closeModal);
        });
        
        // Cancel button
        cancelBtn.addEventListener('click', closeModal);
        
        // Form submission
        snippetForm.addEventListener('submit', handleFormSubmit);
        
        // Export and import
        exportBtn.addEventListener('click', exportSnippets);
        importBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', importSnippets);
        
        // Copy button
        copyBtn.addEventListener('click', copyCode);
        
        // Edit and delete buttons
        editBtn.addEventListener('click', openEditModal);
        deleteBtn.addEventListener('click', deleteSnippet);
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === snippetModal || e.target === viewModal) {
                closeModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search focus
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    }
    
    /**
     * Render snippets based on current filters
     */
    function renderSnippets() {
        const snippets = storage.getSnippets();
        const searchTerm = searchInput.value.toLowerCase();
        const language = languageFilter.value;
        const tag = tagFilter.value;
        
        // Filter snippets
        const filteredSnippets = snippets.filter(snippet => {
            const matchesSearch = !searchTerm || 
                snippet.title.toLowerCase().includes(searchTerm) || 
                snippet.description.toLowerCase().includes(searchTerm) ||
                snippet.code.toLowerCase().includes(searchTerm) ||
                snippet.tags.some(t => t.toLowerCase().includes(searchTerm));
            
            const matchesLanguage = !language || snippet.language === language;
            const matchesTag = !tag || snippet.tags.includes(tag);
            
            return matchesSearch && matchesLanguage && matchesTag;
        });
        
        // Clear container
        snippetsContainer.innerHTML = '';
        
        // Check if there are any snippets
        if (filteredSnippets.length === 0) {
            snippetsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-code"></i>
                    <h3>No snippets found</h3>
                    <p>Try adjusting your search or filters, or add a new snippet.</p>
                </div>
            `;
            return;
        }
        
        // ⚡ Bolt: Use a DocumentFragment to batch DOM manipulations for performance.
        // Appending elements one by one to the DOM can cause multiple reflows.
        // A DocumentFragment allows us to build a piece of the DOM in memory
        // and append it to the live DOM in a single operation, which is much faster.
        const fragment = document.createDocumentFragment();
        filteredSnippets.forEach(snippet => {
            const snippetCard = createSnippetCard(snippet);
            fragment.appendChild(snippetCard);
        });

        snippetsContainer.appendChild(fragment);
    }
    
    /**
     * Create snippet card element
     * @param {Object} snippet - Snippet object
     * @returns {HTMLElement} Snippet card element
     */
    function createSnippetCard(snippet) {
        const card = document.createElement('div');
        card.className = 'snippet-card';
        card.dataset.id = snippet.id;
        
        // Create tags HTML
        const tagsHtml = snippet.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
        
        // Truncate code for preview
        const truncatedCode = snippet.code.length > 150 
            ? snippet.code.substring(0, 150) + '...' 
            : snippet.code;
        
        card.innerHTML = `
            <div class="snippet-header">
                <h3 class="snippet-title">${escapeHtml(snippet.title)}</h3>
                <div class="snippet-meta">
                    <span class="language-badge language-${snippet.language}">${snippet.language}</span>
                    <div class="snippet-tags">${tagsHtml}</div>
                </div>
            </div>
            <div class="snippet-body">
                <p class="snippet-description">${escapeHtml(snippet.description) || 'No description'}</p>
                <pre class="snippet-code">${escapeHtml(truncatedCode)}</pre>
            </div>
        `;
        
        // Add click event to open view modal
        card.addEventListener('click', () => openViewModal(snippet.id));
        
        return card;
    }
    
    /**
     * Open add modal
     */
    function openAddModal() {
        currentSnippetId = null;
        modalTitle.textContent = 'Add New Snippet';
        snippetForm.reset();
        snippetModal.style.display = 'block';
    }
    
    /**
     * Open view modal
     * @param {string} id - Snippet ID
     */
    function openViewModal(id) {
        const snippet = storage.getSnippetById(id);
        if (!snippet) return;
        
        currentSnippetId = id;
        
        // Set view modal content
        document.getElementById('view-title').textContent = snippet.title;
        document.getElementById('view-language').textContent = snippet.language;
        document.getElementById('view-language').className = `language-badge language-${snippet.language}`;
        document.getElementById('view-description').textContent = snippet.description || 'No description';
        
        // Set tags
        const tagsContainer = document.getElementById('view-tags');
        tagsContainer.innerHTML = snippet.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');
        
        // Set code with syntax highlighting
        const codeElement = document.getElementById('view-code');
        codeElement.textContent = snippet.code;
        codeElement.className = `language-${snippet.language}`;
        
        // Re-highlight code
        if (typeof Prism !== 'undefined') {
            Prism.highlightElement(codeElement);
        }
        
        // Show view modal
        viewModal.style.display = 'block';
    }
    
    /**
     * Open edit modal
     */
    function openEditModal() {
        const snippet = storage.getSnippetById(currentSnippetId);
        if (!snippet) return;
        
        // Close view modal first
        viewModal.style.display = 'none';
        
        // Set form values
        modalTitle.textContent = 'Edit Snippet';
        document.getElementById('snippet-title').value = snippet.title;
        document.getElementById('snippet-language').value = snippet.language;
        document.getElementById('snippet-tags').value = snippet.tags.join(', ');
        document.getElementById('snippet-description').value = snippet.description;
        document.getElementById('snippet-code').value = snippet.code;
        
        // Show snippet modal
        snippetModal.style.display = 'block';
    }
    
    /**
     * Close modal
     */
    function closeModal() {
        snippetModal.style.display = 'none';
        viewModal.style.display = 'none';
        snippetForm.reset();
        currentSnippetId = null;
    }
    
    /**
     * Handle form submission
     * @param {Event} e - Form submit event
     */
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Get form values
        const title = document.getElementById('snippet-title').value.trim();
        const language = document.getElementById('snippet-language').value;
        const tagsInput = document.getElementById('snippet-tags').value.trim();
        const description = document.getElementById('snippet-description').value.trim();
        const code = document.getElementById('snippet-code').value.trim();
        
        // Process tags
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
        
        // Create snippet object
        const snippet = {
            title,
            language,
            tags,
            description,
            code
        };
        
        // Save snippet
        let success;
        if (currentSnippetId) {
            // Update existing snippet
            success = storage.updateSnippet(currentSnippetId, snippet);
        } else {
            // Add new snippet
            success = storage.addSnippet(snippet);
        }
        
        if (success) {
            // Close modal and refresh snippets
            closeModal();
            renderSnippets();
            updateTagFilter();
            showNotification('Snippet saved successfully!', 'success');
        } else {
            showNotification('Failed to save snippet. Please try again.', 'error');
        }
    }
    
    /**
     * Delete snippet
     */
    function deleteSnippet() {
        if (!currentSnippetId) return;
        
        if (confirm('Are you sure you want to delete this snippet?')) {
            if (storage.deleteSnippet(currentSnippetId)) {
                viewModal.style.display = 'none';
                renderSnippets();
                updateTagFilter();
                showNotification('Snippet deleted successfully!', 'success');
            } else {
                showNotification('Failed to delete snippet. Please try again.', 'error');
            }
        }
    }
    
    /**
     * Copy code to clipboard
     */
    async function copyCode() {
        const codeElement = document.getElementById('view-code');
        const text = codeElement.textContent;
        
        try {
            await navigator.clipboard.writeText(text);
            
            // Change button text temporarily
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            showNotification('Code copied to clipboard!', 'success');
        }
    }
    
    /**
     * Export snippets
     */
    function exportSnippets() {
        const data = storage.exportSnippets();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `code-snippets-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        showNotification('Snippets exported successfully!', 'success');
    }
    
    /**
     * Import snippets
     * @param {Event} e - File input change event
     */
    function importSnippets(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const jsonData = event.target.result;
            
            if (storage.importSnippets(jsonData)) {
                renderSnippets();
                updateTagFilter();
                showNotification('Snippets imported successfully!', 'success');
            } else {
                showNotification('Failed to import snippets. Please check the file format.', 'error');
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input
        e.target.value = '';
    }
    
    /**
     * Update tag filter options
     */
    function updateTagFilter() {
        const tags = storage.getAllTags();
        
        // Clear existing options except the first one
        while (tagFilter.children.length > 1) {
            tagFilter.removeChild(tagFilter.lastChild);
        }
        
        // Add new options
        tags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagFilter.appendChild(option);
        });
    }
    
    /**
     * Show notification message
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: 'var(--border-radius)',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        // Set background color based on type
        const colors = {
            success: '#2ecc71',
            error: '#e74c3c',
            info: '#3498db'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    /**
     * Add sample snippets for demo
     */
    function addSampleSnippets() {
        const sampleSnippets = [
            {
                title: 'JavaScript Array Map',
                language: 'javascript',
                tags: ['javascript', 'array', 'utility'],
                description: 'Map over an array to transform each element',
                code: `const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(num => num * 2);
console.log(doubled); // [2, 4, 6, 8, 10]`
            },
            {
                title: 'Python List Comprehension',
                language: 'python',
                tags: ['python', 'list', 'comprehension'],
                description: 'Create a list using list comprehension',
                code: `# Create a list of squares
squares = [x**2 for x in range(10)]
print(squares)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]`
            },
            {
                title: 'CSS Flexbox Center',
                language: 'css',
                tags: ['css', 'flexbox', 'layout'],
                description: 'Center content using flexbox',
                code: `.container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}`
            }
        ];
        
        sampleSnippets.forEach(snippet => {
            storage.addSnippet(snippet);
        });
        
        renderSnippets();
        updateTagFilter();
    }
    
    /**
     * Utility function to escape HTML
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        
        return text.replace(/[&<>"']/g, m => map[m]);
    }
    
    /**
     * Debounce function to limit API calls
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
    
    // Initialize the app
    init();
});
