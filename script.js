// Global variables
let allStandards = [];
let filteredStandards = [];
let currentViewMode = 'cards';
let showActivitiesOnly = false;

// DOM Elements
const loadingSpinner = document.getElementById('loadingSpinner');
const contentContainer = document.getElementById('contentContainer');
const standardsContainer = document.getElementById('standardsContainer');
const searchInput = document.getElementById('searchInput');
const gradeFilter = document.getElementById('gradeFilter');
const viewModeSelect = document.getElementById('viewMode');
const showActivitiesBtn = document.getElementById('showActivitiesOnly');
const totalItemsSpan = document.getElementById('totalItems');
const filteredItemsSpan = document.getElementById('filteredItems');
const noResults = document.getElementById('noResults');

// Modal elements
const standardModal = document.getElementById('standardModal');
const activityModal = document.getElementById('activityModal');
const closeModalBtn = document.getElementById('closeModal');
const closeActivityModalBtn = document.getElementById('closeActivityModal');

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    setupEventListeners();
    populateFilters();
    displayStandards();
});

// Load JSON data
async function loadData() {
    try {
        const response = await fetch('logica_dba_actividades.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allStandards = await response.json();
        filteredStandards = [...allStandards];
        
        loadingSpinner.style.display = 'none';
        contentContainer.style.display = 'block';
        
        console.log(`Loaded ${allStandards.length} standards`);
    } catch (error) {
        console.error('Error loading data:', error);
        loadingSpinner.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>Error al cargar los datos. Asegúrate de que el archivo JSON esté disponible.</p>
            <p>Error: ${error.message}</p>
        `;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', debounce(filterStandards, 300));
    
    // Filter changes
    gradeFilter.addEventListener('change', filterStandards);
    viewModeSelect.addEventListener('change', changeViewMode);
    showActivitiesBtn.addEventListener('click', toggleActivitiesOnly);
    
    // Back to Skills Tree button
    const backToSkillsTreeBtn = document.getElementById('backToSkillsTree');
    if (backToSkillsTreeBtn) {
        backToSkillsTreeBtn.addEventListener('click', backToSkillsTree);
    }
    
    // Modal functionality
    closeModalBtn.addEventListener('click', closeModal);
    closeActivityModalBtn.addEventListener('click', closeActivityModal);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === standardModal) {
            closeModal();
        }
        if (event.target === activityModal) {
            closeActivityModal();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
            closeActivityModal();
        }
    });
}

// Populate filter options
function populateFilters() {
    const grades = [...new Set(allStandards.map(std => std.nivel))].sort();
    
    gradeFilter.innerHTML = '<option value="">Todos los grados</option>';
    grades.forEach(grade => {
        const option = document.createElement('option');
        option.value = grade;
        option.textContent = grade;
        gradeFilter.appendChild(option);
    });
}

// Filter standards based on search and filters
function filterStandards() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedGrade = gradeFilter.value;
    
    filteredStandards = allStandards.filter(standard => {
        // Grade filter
        if (selectedGrade && standard.nivel !== selectedGrade) {
            return false;
        }
        
        // Activities only filter
        if (showActivitiesOnly && (!standard.actividades_en_casa || standard.actividades_en_casa.length === 0)) {
            return false;
        }
        
        // Search filter
        if (searchTerm) {
            const searchFields = [
                standard.enunciado || '',
                standard.ejemplo || '',
                ...(standard.evidencias_de_aprendizaje || []),
                ...(standard.actividades_en_casa || []).flatMap(act => [
                    act.titulo || '',
                    ...(act.materiales || []),
                    ...(act.paso_a_paso || [])
                ])
            ].join(' ').toLowerCase();
            
            return searchFields.includes(searchTerm);
        }
        
        return true;
    });
    
    updateStats();
    displayStandards();
}

// Update statistics display
function updateStats() {
    const total = allStandards.length;
    const filtered = filteredStandards.length;
    
    totalItemsSpan.textContent = `${total} estándares en total`;
    
    if (filtered !== total) {
        filteredItemsSpan.textContent = `${filtered} mostrados`;
        filteredItemsSpan.style.display = 'inline';
    } else {
        filteredItemsSpan.style.display = 'none';
    }
}

// Change view mode
function changeViewMode() {
    currentViewMode = viewModeSelect.value;
    displayStandards();
}

// Toggle activities only mode
function toggleActivitiesOnly() {
    showActivitiesOnly = !showActivitiesOnly;
    showActivitiesBtn.classList.toggle('active', showActivitiesOnly);
    showActivitiesBtn.innerHTML = showActivitiesOnly 
        ? '<i class="fas fa-home"></i> Mostrando Solo Actividades'
        : '<i class="fas fa-home"></i> Solo Actividades';
    filterStandards();
}

// Display standards based on current view mode and filters
function displayStandards() {
    if (filteredStandards.length === 0) {
        standardsContainer.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    standardsContainer.style.display = 'grid';
    noResults.style.display = 'none';
    
    // Apply view mode class
    standardsContainer.className = `standards-container ${currentViewMode}-view`;
    
    // Generate HTML
    standardsContainer.innerHTML = filteredStandards.map(standard => 
        createStandardCard(standard)
    ).join('');
    
    // Add click event listeners to cards and activities
    addCardEventListeners();
}

// Create HTML for a standard card
function createStandardCard(standard) {
    const hasActivities = standard.actividades_en_casa && standard.actividades_en_casa.length > 0;
    const evidencePreview = (standard.evidencias_de_aprendizaje || []).slice(0, 3);
    const activitiesPreview = hasActivities ? standard.actividades_en_casa.slice(0, 2) : [];
    
    return `
        <div class="standard-card" data-standard-id="${allStandards.indexOf(standard)}">
            <div class="standard-header">
                <div class="grade-badge">${standard.nivel || 'N/A'}</div>
                <div class="subject-tag">${standard.area || 'Matemáticas'}</div>
            </div>
            
            <h3 class="standard-title">${truncateText(standard.enunciado || 'Sin enunciado', 120)}</h3>
            
            ${standard.ejemplo ? `
                <div class="standard-example">
                    <strong>Ejemplo:</strong><br>
                    ${truncateText(standard.ejemplo, 150)}
                </div>
            ` : ''}
            
            <div class="evidence-preview">
                <h4><i class="fas fa-check-circle"></i> Evidencias de Aprendizaje</h4>
                <ul class="evidence-list">
                    ${evidencePreview.map(evidence => `
                        <li class="evidence-item">${truncateText(evidence, 80)}</li>
                    `).join('')}
                    ${evidencePreview.length < (standard.evidencias_de_aprendizaje || []).length ? `
                        <li class="evidence-item" style="font-style: italic; color: #666;">
                            +${(standard.evidencias_de_aprendizaje || []).length - evidencePreview.length} más...
                        </li>
                    ` : ''}
                </ul>
            </div>
            
            ${hasActivities ? `
                <div class="activities-section">
                    <h4 class="activities-title">
                        <i class="fas fa-home"></i> Actividades en Casa
                    </h4>
                    ${activitiesPreview.map((activity, index) => `
                        <div class="activity-preview" data-activity-index="${index}" data-standard-id="${allStandards.indexOf(standard)}">
                            <div class="activity-title">
                                <i class="fas fa-play-circle"></i>
                                ${activity.titulo || 'Actividad sin título'}
                            </div>
                            <div class="activity-materials">
                                <strong>Materiales:</strong> ${(activity.materiales || []).slice(0, 3).join(', ')}${(activity.materiales || []).length > 3 ? '...' : ''}
                            </div>
                        </div>
                    `).join('')}
                    ${activitiesPreview.length < standard.actividades_en_casa.length ? `
                        <button class="show-more-btn" data-standard-id="${allStandards.indexOf(standard)}">
                            Ver todas las ${standard.actividades_en_casa.length} actividades
                        </button>
                    ` : ''}
                </div>
            ` : ''}
            
            <button class="show-more-btn" data-standard-id="${allStandards.indexOf(standard)}">
                Ver detalles completos
            </button>
        </div>
    `;
}

// Add event listeners to cards and activities
function addCardEventListeners() {
    // Standard card clicks
    document.querySelectorAll('.standard-card').forEach(card => {
        card.addEventListener('click', function(event) {
            // Don't trigger if clicking on activity or button
            if (event.target.closest('.activity-preview') || event.target.closest('.show-more-btn')) {
                return;
            }
            
            const standardId = parseInt(this.dataset.standardId);
            showStandardModal(allStandards[standardId]);
        });
    });
    
    // Activity preview clicks
    document.querySelectorAll('.activity-preview').forEach(activity => {
        activity.addEventListener('click', function(event) {
            event.stopPropagation();
            const standardId = parseInt(this.dataset.standardId);
            const activityIndex = parseInt(this.dataset.activityIndex);
            showActivityModal(allStandards[standardId], activityIndex);
        });
    });
    
    // Show more buttons
    document.querySelectorAll('.show-more-btn').forEach(btn => {
        btn.addEventListener('click', function(event) {
            event.stopPropagation();
            const standardId = parseInt(this.dataset.standardId);
            showStandardModal(allStandards[standardId]);
        });
    });
}

// Show standard detail modal
function showStandardModal(standard) {
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `${standard.area || 'Matemáticas'} - ${standard.nivel || 'N/A'}`;
    
    modalBody.innerHTML = `
        <div class="modal-section">
            <h3><i class="fas fa-bullseye"></i> Enunciado</h3>
            <p>${standard.enunciado || 'No disponible'}</p>
        </div>
        
        ${standard.ejemplo ? `
            <div class="modal-section">
                <h3><i class="fas fa-lightbulb"></i> Ejemplo</h3>
                <div class="modal-example">${standard.ejemplo}</div>
            </div>
        ` : ''}
        
        ${(standard.evidencias_de_aprendizaje || []).length > 0 ? `
            <div class="modal-section">
                <h3><i class="fas fa-check-circle"></i> Evidencias de Aprendizaje</h3>
                <div class="evidence-grid">
                    ${(standard.evidencias_de_aprendizaje || []).map(evidence => `
                        <div class="evidence-card">${evidence}</div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${(standard.actividades_en_casa || []).length > 0 ? `
            <div class="modal-section">
                <h3><i class="fas fa-home"></i> Actividades en Casa</h3>
                ${(standard.actividades_en_casa || []).map((activity, index) => `
                    <div class="activity-details" data-activity-index="${index}" data-standard-id="${allStandards.indexOf(standard)}" style="cursor: pointer;">
                        <h4><i class="fas fa-play-circle"></i> ${activity.titulo || 'Actividad sin título'}</h4>
                        <p><strong>Materiales:</strong> ${(activity.materiales || []).join(', ')}</p>
                        <p><em>Haz clic para ver detalles completos...</em></p>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
    
    // Add click listeners to activity details in modal
    modalBody.querySelectorAll('.activity-details').forEach(activity => {
        activity.addEventListener('click', function() {
            const standardId = parseInt(this.dataset.standardId);
            const activityIndex = parseInt(this.dataset.activityIndex);
            closeModal();
            showActivityModal(allStandards[standardId], activityIndex);
        });
    });
    
    standardModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Show activity detail modal
function showActivityModal(standard, activityIndex) {
    const activity = standard.actividades_en_casa[activityIndex];
    const modalTitle = document.getElementById('activityModalTitle');
    const modalBody = document.getElementById('activityModalBody');
    
    modalTitle.textContent = activity.titulo || 'Actividad sin título';
    
    modalBody.innerHTML = `
        <div class="activity-meta">
            <div class="meta-card">
                <h4><i class="fas fa-tools"></i> Materiales Necesarios</h4>
                <div class="materials-grid">
                    ${(activity.materiales || []).map(material => `
                        <div class="material-item">${material}</div>
                    `).join('')}
                </div>
            </div>
            
            <div class="meta-card">
                <h4><i class="fas fa-info-circle"></i> Información</h4>
                <p><strong>Grado:</strong> ${standard.nivel || 'N/A'}</p>
                <p><strong>Área:</strong> ${standard.area || 'Matemáticas'}</p>
                <p><strong>Pasos:</strong> ${(activity.paso_a_paso || []).length}</p>
            </div>
        </div>
        
        ${(activity.paso_a_paso || []).length > 0 ? `
            <div class="modal-section">
                <h3><i class="fas fa-list-ol"></i> Instrucciones Paso a Paso</h3>
                <ol class="steps-list">
                    ${(activity.paso_a_paso || []).map(step => `
                        <li class="step-item">${step}</li>
                    `).join('')}
                </ol>
            </div>
        ` : ''}
        
        <div class="modal-section">
            <h3><i class="fas fa-bullseye"></i> Estándar Relacionado</h3>
            <div class="evidence-card">
                <strong>${standard.area || 'Matemáticas'} - ${standard.nivel || 'N/A'}:</strong><br>
                ${standard.enunciado || 'No disponible'}
            </div>
        </div>
    `;
    
    activityModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close standard modal
function closeModal() {
    standardModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close activity modal
function closeActivityModal() {
    activityModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Utility function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Function to go back to Skills Tree (Canvas)
function backToSkillsTree() {
    console.log('Returning to Skills Tree (Canvas)...');
    
    // Call the global function defined in index.js to show canvas
    if (typeof window.showCanvas === 'function') {
        window.showCanvas();
        console.log('Canvas shown successfully using showCanvas() function');
    } else {
        // Fallback if showCanvas is not available
        console.error('showCanvas function not found. Using manual fallback...');
        
        // Manual fallback
        const animationContainer = document.getElementById('animation_container');
        const dbaContent = document.querySelector('.dba-content');
        
        if (animationContainer) {
            animationContainer.style.display = 'block';
            console.log('Animation container shown');
        }
        
        if (dbaContent) {
            dbaContent.classList.remove('show');
            console.log('DBA content hidden');
        }
    }
}

// Add some helpful console logs for debugging
console.log('DBA Matemáticas UI loaded successfully');
console.log('Features available:');
console.log('- Search across all content');
console.log('- Filter by grade level');
console.log('- Switch between card and list views');
console.log('- Show only standards with home activities');
console.log('- Detailed modals for standards and activities');
