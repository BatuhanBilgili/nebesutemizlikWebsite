
// Global Variables
let currentRating = 0;
let reviews = null; // null olarak başlat
let showAllReviews = false; // Yorumları genişletme/daraltma durumu
const DEFAULT_VISIBLE_REVIEWS = 3;
let currentRatingFilter = '';
let currentServiceFilter = '';

// API Configuration (admin panel ile aynı endpoint)
const API_BASE = '/api';

// Services data for search
const services = [
    { name: "Ev Temizliği", description: "Günlük, haftalık ve aylık ev temizlik hizmetleri", keywords: ["ev", "temizlik", "günlük", "haftalık", "aylık"] },
    { name: "Ofis Temizliği", description: "Profesyonel ofis ve işyeri temizlik hizmetleri", keywords: ["ofis", "işyeri", "profesyonel", "temizlik"] },
    { name: "Apartman Temizliği", description: "Apartman ve site ortak alan temizlik hizmetleri", keywords: ["apartman", "site", "ortak", "alan", "temizlik"] },
    { name: "İnşaat Sonrası Temizlik", description: "İnşaat ve tadilat sonrası derinlemesine temizlik", keywords: ["inşaat", "tadilat", "sonrası", "derinlemesine", "temizlik"] },
    { name: "Villa Temizliği", description: "Lüks villa ve müstakil ev temizlik hizmetleri", keywords: ["villa", "müstakil", "lüks", "ev", "temizlik"] },
    { name: "Merdiven Temizliği", description: "Apartman ve bina merdiven temizlik hizmetleri", keywords: ["merdiven", "apartman", "bina", "temizlik"] },
    { name: "Zemin Cilalama ve Temizliği", description: "Mermer, granit, parke ve sert zeminlerde cilalama ve derin temizlik", keywords: ["zemin", "cilalama", "mermer", "granit", "parke"] },
    { name: "Yat Temizliği", description: "Marina ve iskelelerde iç-dış yat temizliği", keywords: ["yat", "tekne", "marina", "temizlik"] }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sayfa yüklendi, uygulama başlatılıyor...');
    initializeApp();
});

function initializeApp() {
    console.log('initializeApp çalıştırıldı');
    
    // Load reviews from API
    loadReviewsFromAPI();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup smooth scrolling
    setupSmoothScrolling();
    
    // Setup mobile menu
    setupMobileMenu();
    
    // Setup rating system
    setupRatingSystem();
    
    // Setup form submissions
    setupFormSubmissions();
    
    // Setup animations
    setupAnimations();
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('serviceSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchServices();
            }
        });
    }

    // Load more / show less toggle
    const loadMoreBtn = document.getElementById('loadMoreReviews');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', toggleReviewsVisibility);
    }

    // Filters
    const ratingFilterEl = document.getElementById('ratingFilter');
    const serviceFilterEl = document.getElementById('serviceFilter');
    if (ratingFilterEl) {
        ratingFilterEl.addEventListener('change', () => {
            currentRatingFilter = ratingFilterEl.value;
            showAllReviews = false; // filtre değişince başa dön
            displayReviews();
            // filtre sonrası ilgili bölüme kay
            const reviewsSection = document.getElementById('reviews');
            if (reviewsSection) reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
    if (serviceFilterEl) {
        serviceFilterEl.addEventListener('change', () => {
            currentServiceFilter = serviceFilterEl.value;
            showAllReviews = false;
            displayReviews();
            const reviewsSection = document.getElementById('reviews');
            if (reviewsSection) reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
}

function setupSmoothScrolling() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function setupMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
}

function setupRatingSystem() {
    const stars = document.querySelectorAll('.stars i');
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            currentRating = index + 1;
            updateStars();
        });
        
        star.addEventListener('mouseenter', function() {
            highlightStars(index + 1);
        });
    });
    
    const starsContainer = document.querySelector('.stars');
    if (starsContainer) {
        starsContainer.addEventListener('mouseleave', function() {
            updateStars();
        });
    }
}

function updateStars() {
    const stars = document.querySelectorAll('.stars i');
    stars.forEach((star, index) => {
        if (index < currentRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.stars i');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = '#fbbf24';
        } else {
            star.style.color = '#d1d5db';
        }
    });
}

function setupFormSubmissions() {
    // Review form submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmission);
    }
    
    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmission);
    }
}

function setupAnimations() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.service-card, .review-card, .contact-item').forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// Search functionality
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    if (query.length > 2) {
        searchServices(query);
    } else {
        hideSearchResults();
    }
}

function searchServices(query = null) {
    const searchInput = document.getElementById('serviceSearch');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchResults) return;
    
    const searchQuery = query || searchInput.value.toLowerCase().trim();
    
    if (searchQuery.length < 2) {
        hideSearchResults();
        return;
    }
    
    const results = services.filter(service => {
        return service.name.toLowerCase().includes(searchQuery) ||
               service.description.toLowerCase().includes(searchQuery) ||
               service.keywords.some(keyword => keyword.includes(searchQuery));
    });
    
    displaySearchResults(results, searchQuery);
}

function displaySearchResults(results, query) {
    const searchResults = document.getElementById('searchResults');
    
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div style="text-align: center; color: #666; padding: 1rem;">
                <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>"${query}" için sonuç bulunamadı.</p>
                <p>Farklı anahtar kelimeler deneyin.</p>
            </div>
        `;
    } else {
        const resultsHTML = results.map(service => `
            <div class="search-result-item" style="padding: 1rem; border-bottom: 1px solid #e5e7eb; cursor: pointer;" onclick="scrollToService('${service.name}')">
                <h4 style="color: #2563eb; margin-bottom: 0.5rem;">${service.name}</h4>
                <p style="color: #666; margin: 0;">${service.description}</p>
            </div>
        `).join('');
        
        searchResults.innerHTML = `
            <div style="margin-bottom: 1rem; color: #333; font-weight: 600;">
                <i class="fas fa-search"></i> "${query}" için ${results.length} sonuç bulundu:
            </div>
            ${resultsHTML}
        `;
    }
    
    searchResults.classList.add('show');
}

function hideSearchResults() {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.classList.remove('show');
    }
}

function scrollToService(serviceName) {
    // Scroll to services section
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Hide search results
    hideSearchResults();
    
    // Clear search input
    const searchInput = document.getElementById('serviceSearch');
    if (searchInput) {
        searchInput.value = '';
    }
}

// Load reviews from API
async function loadReviewsFromAPI() {
    console.log('loadReviewsFromAPI başlatıldı');
    
    const reviewsGrid = document.getElementById('reviewsGrid');
    if (!reviewsGrid) {
        console.error('reviewsGrid elementi bulunamadı!');
        return;
    }

    reviewsGrid.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #6366f1; margin-bottom: 1rem;"></i>
            <p>Yorumlar yükleniyor...</p>
        </div>
    `;
    
    try {
        console.log('API\'ye istek yapılıyor:', `${API_BASE}/admin/reviews`);
        
        // Önce admin endpointini dene (tüm yorumlar). 401/403 gelirse public endpointi dene (onaylı yorumlar)
        let data;
        let response = await fetch(`${API_BASE}/admin/reviews`);
        console.log('Admin reviews yanıtı:', response.status);
        if (response.status === 401 || response.status === 403) {
            console.warn('Admin endpointine yetki yok, onaylı yorumları çekeceğim.');
            response = await fetch(`${API_BASE}/reviews`);
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        data = await response.json();
        console.log('Alınan yorumlar:', data);
        
        if (!Array.isArray(data)) {
            throw new Error('API beklenmeyen bir yanıt döndürdü');
        }
        
        reviews = data;
        console.log('Reviews güncellendi:', reviews);
        
        // Yorumları göster
        displayReviews();
        
    } catch (error) {
        console.error('Yorumları yükleme hatası:', error);
        reviewsGrid.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #ef4444;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Yorumlar yüklenirken bir hata oluştu.</p>
                <p style="font-size: 0.9rem; color: #666;">${error.message}</p>
            </div>
        `;
    }
}

// Review system
function displayReviews() {
    console.log('displayReviews başlatıldı');
    
    const reviewsGrid = document.getElementById('reviewsGrid');
    if (!reviewsGrid) {
        console.error('reviewsGrid elementi bulunamadı');
        return;
    }
    
    console.log('Mevcut yorumlar:', reviews);
    
    if (!reviews || reviews.length === 0) {
        console.log('Hiç yorum bulunamadı');
        reviewsGrid.innerHTML = `
            <div style="text-align: center; color: #666; padding: 2rem;">
                <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Henüz yorum bulunmuyor. İlk yorumu siz yapın!</p>
            </div>
        `;
        return;
    }

    // Yorumları tarihe göre sırala (en yeniden en eskiye)
    const sortedReviews = [...reviews].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
    );

    // Filtre uygula
    let filteredReviews = [...sortedReviews];
    if (currentRatingFilter) {
        const r = Number(currentRatingFilter);
        filteredReviews = filteredReviews.filter(rv => Number(rv.rating) === r);
    }
    if (currentServiceFilter) {
        filteredReviews = filteredReviews.filter(rv => String(rv.service) === String(currentServiceFilter));
    }

    // Görünecek yorumları belirle (3 adet veya tümü)
    const visibleReviews = showAllReviews
        ? filteredReviews
        : filteredReviews.slice(0, DEFAULT_VISIBLE_REVIEWS);
    
    console.log('Sıralanmış yorumlar:', sortedReviews);
    
    const reviewsHTML = visibleReviews.map(review => `
        <div class="review-item" style="background: white; padding: 2rem 1.5rem; border-radius: 18px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; border-left: 5px solid #10b981; display: flex; flex-direction: column; gap: 1rem; transition: all 0.3s ease; margin-bottom: 1rem;">
            <div class="review-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <strong style="font-size: 1.1rem; color: #1f2937;">${review.name}</strong>
                </div>
                <div class="review-rating" style="color: #fbbf24;">
                    ${generateStars(review.rating)}
                </div>
            </div>
            <div class="review-details">
                <div class="review-service" style="color: #4b5563; font-size: 0.95rem; margin: 0.5rem 0;">
                    <i class="fas fa-check-circle" style="color: #10b981; margin-right: 5px;"></i>
                    ${getServiceDisplayName(review.service)}
                </div>
                <div class="review-text" style="color: #1f2937; line-height: 1.6; margin: 0.5rem 0;">${review.text}</div>
                <div style="font-size: 0.9rem; color: #6b7280; margin-top: 0.5rem; display: flex; align-items: center;">
                    <i class="far fa-calendar-alt" style="margin-right: 5px;"></i>
                    ${formatDate(review.created_at)}
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('HTML oluşturuldu, sayfaya ekleniyor');
    reviewsGrid.innerHTML = reviewsHTML;
    console.log('Yorumlar başarıyla görüntülendi');

    // Buton metni ve görünürlüğü ayarla
    const loadMoreBtn = document.getElementById('loadMoreReviews');
    if (loadMoreBtn) {
        if (filteredReviews.length > DEFAULT_VISIBLE_REVIEWS) {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.textContent = showAllReviews ? 'Daha Az Göster' : 'Daha Fazla Yorum Göster';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    }
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function getServiceDisplayName(service) {
    const serviceMap = {
        'ev-temizligi': 'Ev Temizliği',
        'ofis-temizligi': 'Ofis Temizliği',
        'apartman-temizligi': 'Apartman Temizliği',
        'insaat-sonrasi': 'İnşaat Sonrası Temizlik',
        'villa-temizligi': 'Villa Temizliği',
        'merdiven-temizligi': 'Merdiven Temizliği',
        'zemin-cilalama': 'Zemin Cilalama ve Temizliği',
        'yat-temizligi': 'Yat Temizliği'
    };
    return serviceMap[service] || service;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function toggleReviewsVisibility() {
    showAllReviews = !showAllReviews;
    displayReviews();

    // Daraltıldıysa ilgili bölüme dön
    if (!showAllReviews) {
        const reviewsSection = document.getElementById('reviews');
        if (reviewsSection) {
            reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

async function handleReviewSubmission(e) {
    e.preventDefault();
    console.log('Form gönderiliyor...');

    const name = document.getElementById('reviewerName').value.trim();
    const email = document.getElementById('reviewerEmail').value.trim();
    const service = document.getElementById('serviceType').value;
    const text = document.getElementById('reviewText').value.trim();
    const rating = parseInt(document.getElementById('reviewRating').value, 10);

    const formData = {
        name,
        email,
        service,
        rating,
        text
    };
    
    console.log('Gönderilecek veri:', formData);

    if (!name || !service || !text || !rating) {
        showNotification('Lütfen tüm alanları doldurun ve bir puan verin.', 'error');
        return;
    }

    try {
        console.log('API isteği yapılıyor:', `${API_BASE}/reviews`);
        const response = await fetch(`${API_BASE}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        console.log('API yanıtı:', response.status);
        
        if (response.ok) {
            const responseData = await response.json();
            console.log('Başarılı yanıt:', responseData);

            // Reset form
            const formEl = document.getElementById('reviewForm');
            if (formEl) formEl.reset();
            const ratingEl = document.getElementById('reviewRating');
            if (ratingEl) ratingEl.value = '5';

            // Show success message
            showNotification('Yorumunuz başarıyla gönderildi! Onay bekliyor, ancak sitede hemen gösterdik.', 'success');

            // Optimistic UI: Yorumu hemen ekrana yansıt
            const nowIso = new Date().toISOString();
            const apiReview = responseData?.review || {};
            const newReview = {
                id: apiReview.id || Date.now(),
                name: apiReview.name || name,
                email: apiReview.email || email,
                service: apiReview.service || service,
                rating: apiReview.rating || rating,
                text: apiReview.text || text,
                created_at: apiReview.created_at || nowIso,
                is_approved: apiReview.is_approved ?? false,
            };

            // Mevcut liste yoksa başlat, varsa başa ekle
            if (!Array.isArray(reviews)) {
                reviews = [newReview];
            } else {
                reviews = [newReview, ...reviews];
            }
            displayReviews();

            // Scroll to reviews
            const reviewsSection = document.getElementById('reviews');
            if (reviewsSection) {
                setTimeout(() => {
                    reviewsSection.scrollIntoView({ behavior: 'smooth' });
                }, 300);
            }
        } else {
            const errorData = await response.json();
            console.error('API Hatası:', errorData);
            showNotification(errorData.error || 'Yorum gönderilirken bir hata oluştu.', 'error');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showNotification('Yorum gönderilirken bir hata oluştu. Lütfen tekrar deneyin.', 'error');
    }
}

async function handleContactSubmission(e) {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const service = document.getElementById('contactService').value;
    const message = document.getElementById('contactMessage').value.trim();
    
    if (!name || !phone || !service) {
        alert('Lütfen ad, telefon ve hizmet alanlarını doldurun.');
        return;
    }
    
    try {
        // Save contact request to database
        const response = await fetch(`${API_BASE}/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                service: service,
                message: message
            })
        });
        
        if (response.ok) {
            // Create WhatsApp message
            const whatsappMessage = `Merhaba! ${getServiceDisplayName(service)} hizmeti için teklif almak istiyorum.

Ad: ${name}
Telefon: ${phone}
Hizmet: ${getServiceDisplayName(service)}
${message ? `Mesaj: ${message}` : ''}

Lütfen benimle iletişime geçin. Teşekkürler!`;
            
            // Open WhatsApp
            const whatsappUrl = `https://wa.me/905317951590?text=${encodeURIComponent(whatsappMessage)}`;
            window.open(whatsappUrl, '_blank');
            
            // Reset form
            document.getElementById('contactForm').reset();
            
            // Show success message
            showNotification('Talebiniz kaydedildi ve WhatsApp üzerinden yönlendiriliyorsunuz...', 'success');
        } else {
            const error = await response.json();
            showNotification('Talep gönderilirken hata oluştu: ' + error.error, 'error');
        }
    } catch (error) {
        console.error('Error submitting contact request:', error);
        showNotification('Talep gönderilirken hata oluştu.', 'error');
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.3s ease;
        ">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Add CSS for notifications
const notificationStyles = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Utility functions
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

// Debounced search
const debouncedSearch = debounce(searchServices, 300);

// Update search input event listener
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('serviceSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase().trim();
            if (query.length > 2) {
                debouncedSearch(query);
            } else {
                hideSearchResults();
            }
        });
    }
});

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        navMenu.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    }
});

// Add mobile menu styles
const mobileMenuStyles = `
    @media (max-width: 768px) {
        .nav-menu {
            position: fixed;
            left: -100%;
            top: 70px;
            flex-direction: column;
            background-color: white;
            width: 100%;
            text-align: center;
            transition: 0.3s;
            box-shadow: 0 10px 27px rgba(0, 0, 0, 0.05);
            padding: 2rem 0;
        }
        
        .nav-menu.active {
            left: 0;
        }
        
        .nav-menu li {
            margin: 1rem 0;
        }
        
        .nav-toggle.active span:nth-child(2) {
            opacity: 0;
        }
        
        .nav-toggle.active span:nth-child(1) {
            transform: translateY(8px) rotate(45deg);
        }
        
        .nav-toggle.active span:nth-child(3) {
            transform: translateY(-8px) rotate(-45deg);
        }
    }
`;

const mobileStyleSheet = document.createElement('style');
mobileStyleSheet.textContent = mobileMenuStyles;
document.head.appendChild(mobileStyleSheet);
