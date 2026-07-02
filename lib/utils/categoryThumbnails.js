/**
 * Category Thumbnail Generator
 * Generates SVG-based thumbnails for courses based on their category
 */

export const categoryConfig = {
  programming: {
    name: 'Programming',
    icon: 'code',
    gradient: 'from-blue-500 to-cyan-500',
    colors: { from: '#3b82f6', to: '#06b6d4' },
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`
  },
  health: {
    name: 'Health & Fitness',
    icon: 'heart',
    gradient: 'from-red-500 to-pink-500',
    colors: { from: '#ef4444', to: '#ec4899' },
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`
  },
  creative: {
    name: 'Creative Arts',
    icon: 'palette',
    gradient: 'from-purple-500 to-indigo-500',
    colors: { from: '#a855f7', to: '#6366f1' },
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>`
  },
  business: {
    name: 'Business',
    icon: 'bookOpen',
    gradient: 'from-green-500 to-emerald-500',
    colors: { from: '#22c55e', to: '#10b981' },
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>`
  },
  science: {
    name: 'Science',
    icon: 'brain',
    gradient: 'from-indigo-500 to-blue-500',
    colors: { from: '#6366f1', to: '#3b82f6' },
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"></path></svg>`
  },
  technology: {
    name: 'Technology',
    icon: 'zap',
    gradient: 'from-yellow-500 to-orange-500',
    colors: { from: '#eab308', to: '#f97316' },
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`
  }
};

/**
 * Generate an SVG thumbnail for a course based on its category
 * @param {string} category - The course category (programming, health, creative, business, science, technology)
 * @param {string} categoryLabel - Optional label text to display (defaults to category name)
 * @returns {string} Data URI of the SVG thumbnail
 */
export function generateCategoryThumbnail(category, categoryLabel = null) {
  const normalizedCategory = category?.toLowerCase() || 'programming';
  const config = categoryConfig[normalizedCategory] || categoryConfig.programming;
  const label = categoryLabel || normalizedCategory;
  
  // Generate unique gradient ID to avoid conflicts when multiple thumbnails are on the same page
  const gradientId = `grad-${normalizedCategory}`;
  
  // Generate SVG thumbnail
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <!-- Background Gradient -->
      <defs>
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${config.colors.from};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${config.colors.to};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background Rectangle -->
      <rect width="400" height="300" fill="url(#${gradientId})" />
      
      <!-- Icon Container Circle -->
      <circle cx="200" cy="120" r="50" fill="rgba(255, 255, 255, 0.2)" />
      
      <!-- Category Icon (centered) -->
      <g transform="translate(176, 96)">
        ${config.iconSvg}
      </g>
      
      <!-- Category Label -->
      <text 
        x="200" 
        y="220" 
        font-family="Arial, sans-serif" 
        font-size="24" 
        font-weight="600" 
        fill="white" 
        text-anchor="middle"
      >
        ${label}
      </text>
    </svg>
  `;
  
  // Convert SVG to data URI
  const encodedSvg = encodeURIComponent(svg.trim());
  return `data:image/svg+xml,${encodedSvg}`;
}

/**
 * Get category configuration
 * @param {string} category - The course category
 * @returns {object} Category configuration object
 */
export function getCategoryConfig(category) {
  const normalizedCategory = category?.toLowerCase() || 'programming';
  return categoryConfig[normalizedCategory] || categoryConfig.programming;
}

/**
 * Get all available categories
 * @returns {Array} Array of category keys
 */
export function getAllCategories() {
  return Object.keys(categoryConfig);
}
