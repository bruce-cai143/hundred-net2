// 图片懒加载工具函数
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// 平滑滚动工具函数
function smoothScroll(target, duration = 500) {
    const targetPosition = target.getBoundingClientRect().top;
    const startPosition = window.pageYOffset;
    const startTime = performance.now();
    
    function animation(currentTime) {
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = t => t * (2 - t); // 缓动函数
        
        window.scrollTo(0, startPosition + targetPosition * ease(progress));
        
        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        }
    }
    
    requestAnimationFrame(animation);
}

// 导航栏滚动效果
function initNavbarScroll() {
    const navbar = document.querySelector('.nav-container');
    let lastScroll = window.pageYOffset;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > lastScroll && currentScroll > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
            if (currentScroll > 50) {
                navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.82)';
                navbar.style.boxShadow = 'none';
            }
        }
        
        lastScroll = currentScroll;
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // 初始化导航栏滚动效果
    initNavbarScroll();
    
    // 初始化图片懒加载
    lazyLoadImages();
    
    // 初始化轮播图 - 只在有轮播图容器时执行
    if (document.querySelector('.carousel-container')) {
        try {
            initCarousel();
        } catch (error) {
            console.error('初始化轮播图失败:', error);
        }
    }
    
    // 初始化统计数字动画 - 只在有统计数字元素时执行
    if (document.querySelector('.stat-number')) {
        try {
            initStatsCounter();
        } catch (error) {
            console.error('初始化统计数字动画失败:', error);
        }
    }
    
    // 初始化课程详情切换 - 只在有课程详情按钮时执行
    if (document.querySelector('.course-detail-btn')) {
        try {
            initCourseDetails();
        } catch (error) {
            console.error('初始化课程详情切换失败:', error);
        }
    }
    
    // 初始化视频播放 - 只在有视频元素时执行
    if (document.querySelector('.campus-video')) {
        try {
            initVideoPlayer();
        } catch (error) {
            console.error('初始化视频播放失败:', error);
        }
    }
    
    // 加载新闻 - 只在有新闻网格时执行
    if (document.querySelector('.news-grid')) {
        try {
            loadNews();
        } catch (error) {
            console.error('加载新闻失败:', error);
        }
    }
    
    // 移动端菜单
    if (document.querySelector('.mobile-menu-btn')) {
        try {
            initMobileMenu();
        } catch (error) {
            console.error('初始化移动端菜单失败:', error);
        }
    }
    
    // 添加平滑滚动效果
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                smoothScroll(target);
            }
        });
    });
    
    // 添加页面载入动画
    document.body.classList.add('loaded');
    
    console.log('页面初始化完成');
});

// 初始化轮播图
function initCarousel() {
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    const pagination = document.querySelector('.pagination');
    let currentSlide = 0;
    
    // 创建分页指示器
    slides.forEach((_, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
        pagination.appendChild(dot);
    });
    
    // 前一张
    prevBtn.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        goToSlide(currentSlide);
    });
    
    // 后一张
    nextBtn.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % slides.length;
        goToSlide(currentSlide);
    });
    
    // 自动轮播
    let interval = setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        goToSlide(currentSlide);
    }, 5000);
    
    // 鼠标悬停时暂停轮播
    const carouselContainer = document.querySelector('.carousel-container');
    carouselContainer.addEventListener('mouseenter', () => {
        clearInterval(interval);
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
        interval = setInterval(() => {
            currentSlide = (currentSlide + 1) % slides.length;
            goToSlide(currentSlide);
        }, 5000);
    });
    
    // 切换到指定幻灯片
    function goToSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        slides[index].classList.add('active');
        
        const dots = document.querySelectorAll('.dot');
        dots.forEach(dot => dot.classList.remove('active'));
        dots[index].classList.add('active');

        // 移除所有轮播图项的 active 类
        // slides.forEach((slide, i) => {
        //     slide.classList.remove('active');
        //     controls[i].classList.remove('active');
        //     if (i === index) {
        //         slide.classList.add('active');
        //         controls[i].classList.add('active');
        //     }
        // });
        // currentIndex = index;
    }
    
    // 从数据库加载轮播图
    loadSlides();
}

// 从数据库加载轮播图
async function loadSlides() {
    try {
        // 检查轮播图容器是否存在
        const slideContainer = document.querySelector('.carousel-slide');
        if (!slideContainer) {
            console.log('轮播图容器不存在，跳过加载轮播图');
            return;
        }
        
        const response = await fetch('/api/slides');
        if (!response.ok) {
            console.log('获取轮播图数据失败，状态码:', response.status);
            return;
        }
        
        const data = await response.json();
        const slides = data.slides || []; // 确保slides是一个数组
        
        if (!Array.isArray(slides)) {
            console.error('轮播图数据格式错误:', slides);
            return;
        }
        
        if (slides.length === 0) {
            console.log('轮播图数据为空');
            return;
        }
        
        slideContainer.innerHTML = '';
        
        slides.forEach((slide, index) => {
            const slideElement = document.createElement('div');
            slideElement.className = 'slide' + (index === 0 ? ' active' : '');
            slideElement.style.backgroundImage = `url('${slide.image}')`;
            
            slideElement.innerHTML = `
                <div class="slide-content">
                    <h2>${slide.title}</h2>
                    <p>${slide.description}</p>
                    <a href="about.html" class="button">了解更多</a>
                </div>
            `;
            
            slideContainer.appendChild(slideElement);
        });
        
        // 重新初始化分页指示器
        const pagination = document.querySelector('.pagination');
        if (!pagination) {
            console.log('分页指示器不存在');
            return;
        }
        
        pagination.innerHTML = '';
        
        slides.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                const allSlides = document.querySelectorAll('.slide');
                allSlides.forEach(s => s.classList.remove('active'));
                allSlides[index].classList.add('active');
                
                const dots = document.querySelectorAll('.dot');
                dots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
            });
            pagination.appendChild(dot);
        });
        
        console.log('轮播图加载完成');
    } catch (error) {
        console.error('加载轮播图失败:', error);
    }
}

// 初始化统计数字动画
function initStatsCounter() {
    const stats = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                const duration = 2000; // 动画持续时间（毫秒）
                const frameDuration = 1000 / 60; // 每帧持续时间（60fps）
                const totalFrames = Math.round(duration / frameDuration);
                let frame = 0;
                let currentNumber = 0;
                
                const counter = setInterval(() => {
                    frame++;
                    const progress = frame / totalFrames;
                    currentNumber = Math.round(progress * target);
                    
                    if (frame === totalFrames) {
                        clearInterval(counter);
                        currentNumber = target;
                    }
                    
                    entry.target.textContent = currentNumber;
                }, frameDuration);
                
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    stats.forEach(stat => {
        observer.observe(stat);
    });
}

// 初始化课程详情切换
function initCourseDetails() {
    const detailButtons = document.querySelectorAll('.course-detail-btn');
    
    detailButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.course-card');
            const detail = card.querySelector('.course-detail');
            
            if (detail.style.maxHeight) {
                detail.style.maxHeight = null;
                this.textContent = '查看详情 →';
            } else {
                detail.style.maxHeight = detail.scrollHeight + 'px';
                this.textContent = '收起详情 ↑';
            }
        });
    });
}

// 初始化视频播放
function initVideoPlayer() {
    const video = document.querySelector('.campus-video');
    const playBtn = document.querySelector('.play-btn');
    
    if (!video || !playBtn) return;
    
    playBtn.addEventListener('click', function() {
        if (video.paused) {
            video.play();
            this.textContent = '❚❚';
        } else {
            video.pause();
            this.textContent = '▶';
        }
    });
    
    video.addEventListener('ended', function() {
        playBtn.textContent = '▶';
    });
}

// 加载新闻
async function loadNews() {
    try {
        const newsGrid = document.querySelector('.news-grid');
        if (!newsGrid) {
            console.log('新闻网格不存在，跳过加载新闻');
            return;
        }
        
        console.log('开始获取新闻数据');
        const response = await fetch('/api/news?limit=4');
        
        if (!response.ok) {
            console.error('获取新闻列表失败，状态码:', response.status);
            newsGrid.innerHTML = '<p class="text-center">加载新闻失败，请稍后重试</p>';
            return;
        }
        
        const data = await response.json();
        console.log('获取到的新闻数据:', data);
        
        if (data.news && data.news.length > 0) {
            newsGrid.innerHTML = data.news.map(news => `
                <div class="news-card card">
                    <div class="news-image">
                        <img src="${news.image_url || 'assets/images/gallery2.jpg'}" alt="${news.title}">
                    </div>
                    <div class="news-content">
                        <div class="news-meta">
                            <span class="news-category">${news.category || '校园新闻'}</span>
                            <span class="news-date">${new Date(news.created_at).toLocaleDateString()}</span>
                        </div>
                        <h3 class="news-title">${news.title}</h3>
                        <p class="news-excerpt">${news.content ? news.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : '暂无内容'}</p>
                        <a href="news.html?id=${news.id}" class="news-link button ghost">阅读全文 →</a>
                    </div>
                </div>
            `).join('');
        } else {
            newsGrid.innerHTML = '<p class="text-center">暂无新闻</p>';
        }
        
        // 绑定加载更多按钮事件
        const loadMoreBtn = document.querySelector('.news-section .button-group .button');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', async () => {
                const currentCount = document.querySelectorAll('.news-card').length;
                console.log('加载更多新闻，跳过前', currentCount, '条');
                const moreNews = await loadMoreNews(currentCount);
                
                if (moreNews.length > 0) {
                    const fragment = document.createDocumentFragment();
                    moreNews.forEach(news => {
                        const newsCard = document.createElement('div');
                        newsCard.className = 'news-card card';
                        newsCard.innerHTML = `
                            <div class="news-image">
                                <img src="${news.image_url || 'assets/images/gallery2.jpg'}" alt="${news.title}">
                            </div>
                            <div class="news-content">
                                <div class="news-meta">
                                    <span class="news-category">${news.category || '校园新闻'}</span>
                                    <span class="news-date">${new Date(news.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 class="news-title">${news.title}</h3>
                                <p class="news-excerpt">${news.content ? news.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : '暂无内容'}</p>
                                <a href="news.html?id=${news.id}" class="news-link button ghost">阅读全文 →</a>
                            </div>
                        `;
                        fragment.appendChild(newsCard);
                    });
                    newsGrid.appendChild(fragment);
                } else {
                    loadMoreBtn.textContent = '没有更多新闻';
                    loadMoreBtn.disabled = true;
                }
            });
        }
        
        // 绑定查看全部按钮事件
        const viewAllBtn = document.querySelector('.news-section .button-group .button.outline');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', () => {
                window.location.href = 'news-list.html';
            });
        }
        
        console.log('新闻加载完成');
    } catch (error) {
        console.error('加载新闻失败:', error);
        const newsGrid = document.querySelector('.news-grid');
        if (newsGrid) {
            newsGrid.innerHTML = '<p class="text-center">加载新闻失败，请检查网络连接</p>';
        }
    }
}

// 加载更多新闻
async function loadMoreNews(skip = 0) {
    try {
        const response = await fetch(`/api/news?limit=4&skip=${skip}`);
        if (!response.ok) throw new Error('获取更多新闻失败');
        
        const data = await response.json();
        return data.news || [];
    } catch (error) {
        console.error('加载更多新闻失败:', error);
        return [];
    }
}

// 初始化移动端菜单
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    menuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        this.classList.toggle('active');
    });
}