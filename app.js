// =====================================================================
// BUSTECH PULSE - FRONTEND APPLICATION LOGIC
// =====================================================================

const CATEGORY_META = {
  electric: {
    vi: "Xe Buýt Điện",
    en: "Electric Bus",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    badge: "⚡ Xe Buýt Điện",
    icon: "zap"
  },
  autonomous: {
    vi: "Xe Tự Hành & AI",
    en: "Autonomous & AI",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    badge: "🤖 Tự Hành & AI",
    icon: "bot"
  },
  hydrogen: {
    vi: "Hydro & Fuel Cell",
    en: "Hydrogen & Fuel Cell",
    color: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    badge: "🔋 Hydro & Pin",
    icon: "flame"
  },
  its: {
    vi: "Quản Lý Đội Xe & ITS",
    en: "Fleet & ITS Tech",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    badge: "📡 ITS & Đội Xe",
    icon: "radio"
  },
  market: {
    vi: "Thị Trường & Dự Án",
    en: "Market & Tenders",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    badge: "📊 Thị Trường",
    icon: "trending-up"
  }
};

let allArticles = [];
let currentFilter = "all";
let searchQuery = "";
let currentSort = "latest";
let showBookmarksOnly = false;
let bookmarkedLinks = new Set(JSON.parse(localStorage.getItem("bus_bookmarks") || "[]"));

// Elements
const articlesGrid = document.getElementById("articlesGrid");
const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const searchInput = document.getElementById("searchInput");
const mobileSearchInput = document.getElementById("mobileSearchInput");
const sortSelect = document.getElementById("sortSelect");
const toggleBookmarksBtn = document.getElementById("toggleBookmarksBtn");
const bookmarkedCount = document.getElementById("bookmarkedCount");
const lastUpdatedText = document.getElementById("lastUpdatedText");
const totalArticlesCount = document.getElementById("totalArticlesCount");
const btnRefresh = document.getElementById("btnRefresh");
const footerRefreshBtn = document.getElementById("footerRefreshBtn");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const autoInfoModal = document.getElementById("autoInfoModal");
const btnAutoInfo = document.getElementById("btnAutoInfo");
const closeAutoInfoBtn = document.getElementById("closeAutoInfoBtn");
const gotItBtn = document.getElementById("gotItBtn");

// Category Stats Elements
const statElectric = document.getElementById("statElectric");
const statAutonomous = document.getElementById("statAutonomous");
const statHydrogen = document.getElementById("statHydrogen");
const statIts = document.getElementById("statIts");

const catCountAll = document.getElementById("catCountAll");
const catCountElectric = document.getElementById("catCountElectric");
const catCountAutonomous = document.getElementById("catCountAutonomous");
const catCountHydrogen = document.getElementById("catCountHydrogen");
const catCountIts = document.getElementById("catCountIts");
const catCountMarket = document.getElementById("catCountMarket");

// Format Relative Time in Vietnamese
function formatRelativeTime(timestamp) {
  if (!timestamp) return "Gần đây";
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 172800) return "Hôm qua";
  return `${Math.floor(diff / 86400)} ngày trước`;
}

// Format Date string
function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch (e) {
    return dateStr;
  }
}

// Fetch Data
async function loadNewsData() {
  // Ưu tiên nạp ngay từ window.__BUS_NEWS_DATA__ nếu có (tránh CORS khi mở bằng file://)
  if (window.__BUS_NEWS_DATA__ && window.__BUS_NEWS_DATA__.articles && window.__BUS_NEWS_DATA__.articles.length > 0) {
    applyDataPayload(window.__BUS_NEWS_DATA__);
  } else {
    loadingState.classList.remove("hidden");
    articlesGrid.classList.add("hidden");
  }

  try {
    const response = await fetch("data/news.json?t=" + Date.now());
    if (response.ok) {
      const data = await response.json();
      applyDataPayload(data);
    }
  } catch (error) {
    if (!allArticles || allArticles.length === 0) {
      console.warn("Lỗi đọc file data/news.json, nạp dữ liệu dự phòng:", error);
      loadFallbackData();
    }
  } finally {
    loadingState.classList.add("hidden");
    articlesGrid.classList.remove("hidden");
    lucide.createIcons();
  }
}

function applyDataPayload(data) {
  allArticles = data.articles || [];
  const meta = data.metadata || {};

  if (meta.last_updated) {
    lastUpdatedText.textContent = meta.last_updated;
  }
  totalArticlesCount.textContent = allArticles.length;

  updateStatsCounters(data);
  renderArticles();
}

// Update counters
function updateStatsCounters(data) {
  const stats = (data && data.metadata && data.metadata.stats) || {};
  statElectric.textContent = stats.electric || allArticles.filter(a => a.category_id === "electric").length;
  statAutonomous.textContent = stats.autonomous || allArticles.filter(a => a.category_id === "autonomous").length;
  statHydrogen.textContent = stats.hydrogen || allArticles.filter(a => a.category_id === "hydrogen").length;
  statIts.textContent = stats.its || allArticles.filter(a => a.category_id === "its").length;

  catCountAll.textContent = allArticles.length;
  catCountElectric.textContent = allArticles.filter(a => a.category_id === "electric").length;
  catCountAutonomous.textContent = allArticles.filter(a => a.category_id === "autonomous").length;
  catCountHydrogen.textContent = allArticles.filter(a => a.category_id === "hydrogen").length;
  catCountIts.textContent = allArticles.filter(a => a.category_id === "its").length;
  catCountMarket.textContent = allArticles.filter(a => a.category_id === "market").length;

  bookmarkedCount.textContent = bookmarkedLinks.size;
}

// Render Filtered Articles
function renderArticles() {
  let filtered = allArticles.filter(item => {
    // Category match
    const catMatch = currentFilter === "all" || item.category_id === currentFilter;
    if (!catMatch) return false;

    // Bookmarks only match
    if (showBookmarksOnly && !bookmarkedLinks.has(item.link)) {
      return false;
    }

    // Search query match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inTitle = (item.title || "").toLowerCase().includes(q);
      const inDesc = (item.description || "").toLowerCase().includes(q);
      const inSource = (item.source || "").toLowerCase().includes(q);
      const inCat = (item.category || "").toLowerCase().includes(q);
      return inTitle || inDesc || inSource || inCat;
    }
    return true;
  });

  // Sort
  if (currentSort === "latest") {
    filtered.sort((a, b) => (b.pub_timestamp || 0) - (a.pub_timestamp || 0));
  } else if (currentSort === "oldest") {
    filtered.sort((a, b) => (a.pub_timestamp || 0) - (b.pub_timestamp || 0));
  } else if (currentSort === "source") {
    filtered.sort((a, b) => (a.source || "").localeCompare(b.source || ""));
  }

  articlesGrid.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  filtered.forEach(article => {
    const isBookmarked = bookmarkedLinks.has(article.link);
    const catMeta = CATEGORY_META[article.category_id] || CATEGORY_META.electric;
    const timeAgo = formatRelativeTime(article.pub_timestamp);
    const formattedDate = formatDisplayDate(article.pub_date);

    // Google Translate helper link
    const googleTranslateUrl = `https://translate.google.com/translate?sl=auto&tl=vi&u=${encodeURIComponent(article.link)}`;

    const card = document.createElement("article");
    card.className = "bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/5 group";

    card.innerHTML = `
      <div class="space-y-3">
        <!-- Top meta: Category Badge, Source, Bookmark -->
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center space-x-2">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${catMeta.color}">
              <i data-lucide="${catMeta.icon}" class="w-3 h-3 mr-1"></i>
              ${catMeta.badge}
            </span>
            <span class="font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md truncate max-w-[130px]" title="${escapeHtml(article.source)}">
              ${escapeHtml(article.source || "Tin Toàn Cầu")}
            </span>
          </div>

          <button class="bookmark-btn p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition" data-link="${encodeURIComponent(article.link)}" title="Lưu bài viết">
            <i data-lucide="bookmark" class="w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}"></i>
          </button>
        </div>

        <!-- Article Title -->
        <h2 class="text-base sm:text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-3 leading-snug">
          <a href="${escapeHtml(article.link)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(article.title)}
          </a>
        </h2>

        <!-- Description snippet -->
        <p class="text-xs sm:text-sm text-slate-400 line-clamp-3 leading-relaxed">
          ${escapeHtml(article.description || "Nhấp vào liên kết để đọc toàn văn thông báo công nghệ và báo cáo chi tiết từ đơn vị xuất bản gốc.")}
        </p>
      </div>

      <!-- Bottom Card Action Footer -->
      <div class="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div class="flex items-center space-x-1.5" title="${escapeHtml(article.pub_date || '')}">
          <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-500"></i>
          <span>${timeAgo}</span>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Dịch sang Tiếng Việt -->
          <a href="${googleTranslateUrl}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1 text-xs" title="Đọc bản dịch tiếng Việt qua Google Dịch">
            <i data-lucide="languages" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span>Dịch</span>
          </a>

          <!-- Đọc bài gốc -->
          <a href="${escapeHtml(article.link)}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition flex items-center space-x-1 text-xs font-medium">
            <span>Đọc gốc</span>
            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
          </a>
        </div>
      </div>
    `;

    articlesGrid.appendChild(card);
  });

  // Re-attach bookmark click events
  document.querySelectorAll(".bookmark-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const rawLink = decodeURIComponent(btn.getAttribute("data-link"));
      toggleBookmark(rawLink);
    });
  });

  lucide.createIcons();
}

function escapeHtml(text) {
  if (!text) return "";
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Bookmark toggler
function toggleBookmark(link) {
  if (bookmarkedLinks.has(link)) {
    bookmarkedLinks.delete(link);
  } else {
    bookmarkedLinks.add(link);
  }
  localStorage.setItem("bus_bookmarks", JSON.stringify(Array.from(bookmarkedLinks)));
  bookmarkedCount.textContent = bookmarkedLinks.size;
  renderArticles();
}

// Category Tabs Handlers
document.querySelectorAll(".cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-btn").forEach(b => {
      b.classList.remove("active", "bg-emerald-500", "text-white");
      b.classList.add("bg-slate-800", "text-slate-300");
    });
    btn.classList.add("active", "bg-emerald-500", "text-white");
    btn.classList.remove("bg-slate-800", "text-slate-300");

    currentFilter = btn.getAttribute("data-cat");
    renderArticles();
  });
});

// Search input debounce
let searchDebounceTimeout;
function handleSearch(val) {
  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    searchQuery = val.trim();
    renderArticles();
  }, 200);
}

searchInput.addEventListener("input", (e) => handleSearch(e.target.value));
mobileSearchInput.addEventListener("input", (e) => handleSearch(e.target.value));

sortSelect.addEventListener("change", (e) => {
  currentSort = e.target.value;
  renderArticles();
});

// Toggle bookmarks view
toggleBookmarksBtn.addEventListener("click", () => {
  showBookmarksOnly = !showBookmarksOnly;
  if (showBookmarksOnly) {
    toggleBookmarksBtn.classList.add("bg-amber-500/20", "border-amber-500/50", "text-amber-300");
  } else {
    toggleBookmarksBtn.classList.remove("bg-amber-500/20", "border-amber-500/50", "text-amber-300");
  }
  renderArticles();
});

// Refresh button handler
btnRefresh.addEventListener("click", () => {
  const icon = document.getElementById("refreshIcon");
  icon.classList.add("animate-spin");
  loadNewsData().then(() => {
    setTimeout(() => icon.classList.remove("animate-spin"), 600);
  });
});

footerRefreshBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  btnRefresh.click();
});

// Modal Auto Info
btnAutoInfo.addEventListener("click", () => autoInfoModal.classList.remove("hidden"));
closeAutoInfoBtn.addEventListener("click", () => autoInfoModal.classList.add("hidden"));
gotItBtn.addEventListener("click", () => autoInfoModal.classList.add("hidden"));
autoInfoModal.addEventListener("click", (e) => {
  if (e.target === autoInfoModal) autoInfoModal.classList.add("hidden");
});

// Dark/Light Mode Switcher
let isDark = true;
themeToggle.addEventListener("click", () => {
  isDark = !isDark;
  if (isDark) {
    document.documentElement.classList.add("dark");
    themeIcon.setAttribute("data-lucide", "moon");
  } else {
    document.documentElement.classList.remove("dark");
    themeIcon.setAttribute("data-lucide", "sun");
  }
  lucide.createIcons();
});

// Fallback demo data if data/news.json is accessed via file:// without local server
function loadFallbackData() {
  allArticles = [
    {
      title: "Daimler Buses & Flix thử nghiệm xe bus điện đường dài cự ly 500+ km",
      link: "https://www.sustainable-bus.com",
      source: "Sustainable Bus",
      pub_date: new Date().toISOString(),
      pub_timestamp: Math.floor(Date.now() / 1000) - 3600,
      description: "Daimler Buses cùng đối tác nghiên cứu vừa hoàn thành thử nghiệm vận hành mẫu xe khách thuần điện ELCH tại Đức với mục tiêu cự ly hành trình vượt trên 500 km cho mỗi lần sạc đầy.",
      category: "Electric & E-Bus",
      category_id: "electric"
    },
    {
      title: "Triển lãm Euro Bus Expo 2026 giới thiệu hơn 80 mẫu xe buýt điện và tự hành",
      link: "https://www.sustainable-bus.com",
      source: "Sustainable Bus",
      pub_date: new Date().toISOString(),
      pub_timestamp: Math.floor(Date.now() / 1000) - 7200,
      description: "Hơn 80 dòng xe bus thế hệ mới của các tên tuổi hàng đầu như Zhongtong, Custom Denning, Irizar, VDL và Scania sẽ chính thức ra mắt tại triển lãm Birmingham.",
      category: "Market & Tenders",
      category_id: "market"
    },
    {
      title: "Ra mắt tuyến xe buýt tự hành thông minh cấp độ Level 4 kết nối ga tàu và sân bay",
      link: "https://news.google.com",
      source: "Google News",
      pub_date: new Date().toISOString(),
      pub_timestamp: Math.floor(Date.now() / 1000) - 10800,
      description: "Hệ thống shuttle tự hành ứng dụng cảm biến LiDAR và mạng điều hành V2X giúp tối ưu hóa luồng hành khách và loại bỏ hoàn toàn khí thải.",
      category: "Autonomous & AI",
      category_id: "autonomous"
    }
  ];
  updateStatsCounters();
  renderArticles();
}

// Initial Boot
document.addEventListener("DOMContentLoaded", () => {
  loadNewsData();
});
