// 轮播图功能
function initCarousel() {
    const carousel = document.querySelector('.carousel-slide');
    const slides = carousel.querySelectorAll('.slide');
    const pagination = document.querySelector('.carousel-controls .pagination');
    const prevBtn = document.querySelector('.carousel-controls .prev');
    const nextBtn = document.querySelector('.carousel-controls .next');
    let currentSlide = 0;
    let slideInterval;

    // 创建分页指示器
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        pagination.appendChild(dot);
    });

    // 更新分页指示器
    function updatePagination() {
        const dots = pagination.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    // 切换到指定幻灯片
    function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        updatePagination();
    }

    // 下一张幻灯片
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    // 上一张幻灯片
    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    // 自动播放
    function startSlideshow() {
        stopSlideshow();
        slideInterval = setInterval(nextSlide, 5000);
    }

    // 停止自动播放
    function stopSlideshow() {
        if (slideInterval) {
            clearInterval(slideInterval);
        }
    }

    // 事件监听
    prevBtn.addEventListener('click', () => {
        prevSlide();
        startSlideshow();
    });

    nextBtn.addEventListener('click', () => {
        nextSlide();
        startSlideshow();
    });

    carousel.addEventListener('mouseenter', stopSlideshow);
    carousel.addEventListener('mouseleave', startSlideshow);

    // 开始自动播放
    startSlideshow();
}

// 数字增长动画
function initCountAnimation() {
    const stats = document.querySelectorAll('.stat-number');
    let animated = false;

    function animateNumber(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000; // 动画持续时间（毫秒）
        const start = 0;
        const increment = target / (duration / 16); // 每帧增加的数值
        let current = start;
        
        function updateNumber() {
            current += increment;
            if (current < target) {
                element.textContent = Math.floor(current);
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = target;
            }
        }
        
        updateNumber();
    }

    function checkScroll() {
        if (animated) return;
        
        const trigger = window.innerHeight * 0.8;
        
        stats.forEach(stat => {
            const statTop = stat.getBoundingClientRect().top;
            
            if (statTop < trigger) {
                animateNumber(stat);
                animated = true;
            }
        });
    }

    window.addEventListener('scroll', checkScroll);
    checkScroll(); // 初始检查
}

// 渐入动画
function initFadeInAnimation() {
    const fadeElements = document.querySelectorAll('.fade-in-section');
    
    function checkFade() {
        const triggerBottom = window.innerHeight * 0.8;
        
        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < triggerBottom) {
                element.classList.add('is-visible');
            }
        });
    }
    
    window.addEventListener('scroll', checkFade);
    checkFade(); // 初始检查
}

// 加载新闻
let currentNewsPage = 1;
const newsPerPage = 4;
let hasLoadedMore = false;
let allNews = [];

async function fetchAllNews() {
    try {
        // 一次性取8条，前4条初始显示，后4条"加载更多"
        const response = await fetch(`/api/news?page=1&limit=8`);
        if (response.ok) {
            const data = await response.json();
            allNews = data.news || [];
            return allNews;
        } else {
            return [];
        }
    } catch (error) {
        return [];
    }
}

function renderNewsSlice(start, end) {
    const newsGrid = document.getElementById('newsGrid');
    const news = allNews.slice(start, end);
    if (!news || news.length === 0) {
        if (start === 0) {
            newsGrid.innerHTML = '<div class="no-news"><h3>暂无新闻</h3><p>请稍后再来查看</p></div>';
        }
        return;
    }
    const newsHTML = news.map(item => {
        let imageUrl = item.cover;
        if (!imageUrl || !/^((assets\/)|(uploads\/)|https?:\/\/)/.test(imageUrl)) {
            imageUrl = 'assets/images/news-default.jpg';
        }
        if (imageUrl.startsWith('/')) imageUrl = imageUrl.substring(1);
        if (!/\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl)) imageUrl += '.jpg';
        const excerpt = (item.summary || item.content.replace(/<[^>]*>/g, '').substring(0, 100)) + '...';
        const date = new Date(item.created_at).toLocaleDateString('zh-CN');
        return `
            <div class="news-card card hover-lift">
                <div class="news-image">
                    <img src="${imageUrl}" alt="${item.title}" onerror="this.src='assets/images/news-default.jpg'">
                </div>
                <div class="news-content">
                    <div class="news-meta">
                        <span class="news-category">${item.category || '校园动态'}</span>
                        <span class="news-date">${date}</span>
                    </div>
                    <h3 class="news-title">${item.title}</h3>
                    <p class="news-excerpt">${excerpt}</p>
                    <a href="/news.html?id=${item.id}" class="news-link button ghost">阅读全文 →</a>
                </div>
            </div>
        `;
    }).join('');
    if (start === 0) {
        newsGrid.innerHTML = newsHTML;
    } else {
        newsGrid.insertAdjacentHTML('beforeend', newsHTML);
    }
}

function initNewsLoading() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const viewAllBtn = document.getElementById('viewAllBtn');
    if (!loadMoreBtn || !viewAllBtn) return;
    loadMoreBtn.disabled = false;
    hasLoadedMore = false;
    fetchAllNews().then(() => {
        renderNewsSlice(0, newsPerPage);
        // 如果新闻不足5条，直接隐藏加载更多按钮
        if (allNews.length <= newsPerPage) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = '';
        }
    });
    loadMoreBtn.addEventListener('click', () => {
        if (hasLoadedMore) return;
        renderNewsSlice(newsPerPage, newsPerPage * 2);
        hasLoadedMore = true;
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = '加载更多';
    });
    viewAllBtn.addEventListener('click', () => {
        window.location.href = 'news-list.html';
    });
}

// 移动端菜单
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}

// 课程详情切换
function initCourseDetails() {
    const detailBtns = document.querySelectorAll('.course-detail-btn');
    
    detailBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.course-card');
            const detail = card.querySelector('.course-detail');
            
            // 使用 classList.toggle 来切换显示状态
            detail.classList.toggle('active');
            if (detail.classList.contains('active')) {
                btn.textContent = '收起详情 ↑';
                detail.style.display = 'block';
            } else {
                btn.textContent = '查看详情 →';
                setTimeout(() => {
                    detail.style.display = 'none';
                }, 300); // 等待过渡动画完成
            }
        });
    });
}

// 视频播放控制
function initVideoControl() {
    const video = document.querySelector('.campus-video');
    const playBtn = document.querySelector('.play-btn');
    const videoContainer = document.querySelector('.video-container');
    
    if (!video || !playBtn) return;
    
    // 检查视频是否可以播放
    video.addEventListener('loadeddata', () => {
        console.log('视频已加载，可以播放');
        playBtn.style.display = 'flex'; // 显示播放按钮
    });
    
    video.addEventListener('error', (e) => {
        console.error('视频加载错误:', e);
        if (videoContainer) {
            videoContainer.innerHTML = `
                <div style="padding: 2rem; text-align: center;">
                    <h3>视频加载失败</h3>
                    <p>请检查视频文件是否存在或格式是否支持</p>
                </div>
            `;
        }
    });

    // 点击播放按钮时播放视频
    playBtn.addEventListener('click', () => {
        if (video.paused) {
            video.play();
            playBtn.style.display = 'none';
        }
    });

    // 视频暂停时显示播放按钮
    video.addEventListener('pause', () => {
        playBtn.style.display = 'flex';
    });

    // 视频播放时隐藏播放按钮
    video.addEventListener('play', () => {
        playBtn.style.display = 'none';
    });
}

// 页面加载完成后初始化所有功能
document.addEventListener('DOMContentLoaded', () => {
    initCarousel();
    initCountAnimation();
    initFadeInAnimation();
    initNewsLoading();
    initMobileMenu();
    initCourseDetails();
    initVideoControl();
});