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
const newsPerPage = 2;

// 模拟新闻数据（当API不可用时）
const mockNews = [
    {
        id: 1,
        title: "百人计划2024春季学期开学典礼",
        content: "3月1日，实外西区百人计划2024春季学期开学典礼隆重举行。校长肖明华为全体师生做了精彩的开学演讲，鼓励同学们在新学期里继续保持学习热情，勇攀高峰。",
        summary: "实外西区百人计划2024春季学期开学典礼隆重举行，校长肖明华做精彩演讲。",
        cover_image: "assets/images/gallery1.jpg",
        created_at: "2024-03-01",
        category: "校园活动"
    },
    {
        id: 2,
        title: "百人计划学生在全国数学竞赛中获佳绩",
        content: "在近日举行的全国中学生数学竞赛中，我校百人计划的学生表现出色，共有15名学生获得省级以上奖项，其中包括3名全国一等奖，5名全国二等奖。",
        summary: "我校百人计划学生在全国数学竞赛中表现出色，共有15名学生获得省级以上奖项。",
        cover_image: "assets/images/gallery2",
        created_at: "2024-02-20",
        category: "学生成就"
    },
    {
        id: 3,
        title: "百人计划教师团队赴北京参加教育研讨会",
        content: "2月15日至18日，百人计划教师团队赴北京参加了为期四天的全国中学教育创新研讨会。我校教师在会上分享了百人计划的教育理念和实践经验，获得了与会专家的高度评价。",
        summary: "百人计划教师团队赴北京参加全国中学教育创新研讨会，分享教育理念和实践经验。",
        cover_image: "assets/images/ioim2.png",
        created_at: "2024-02-18",
        category: "教师发展"
    },
    {
        id: 4,
        title: "百人计划举办科技创新展",
        content: "百人计划科技创新展在学校展览厅举行，展出了学生们在人工智能、机器人、可再生能源等领域的创新项目。此次展览吸引了众多家长和教育界人士参观。",
        summary: "百人计划科技创新展展出学生们在人工智能、机器人等领域的创新项目。",
        cover_image: "assets/images/bt.png",
        created_at: "2024-01-25",
        category: "科技创新"
    }
];

async function loadNews(page = 1) {
    try {
        // 尝试从API获取数据
        const response = await fetch(`/api/news/list?page=${page}&limit=${newsPerPage}`);
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            // API不可用时使用模拟数据
            console.log('API不可用，使用模拟数据');
            
            // 计算分页
            const start = (page - 1) * newsPerPage;
            const end = start + newsPerPage;
            const paginatedNews = mockNews.slice(start, end);
            
            return {
                news: paginatedNews,
                pagination: {
                    current_page: page,
                    total: mockNews.length,
                    per_page: newsPerPage
                }
            };
        }
    } catch (error) {
        console.error('加载新闻错误:', error);
        
        // 出错时也使用模拟数据
        const start = (page - 1) * newsPerPage;
        const end = start + newsPerPage;
        const paginatedNews = mockNews.slice(start, end);
        
        return {
            news: paginatedNews,
            pagination: {
                current_page: page,
                total: mockNews.length,
                per_page: newsPerPage
            }
        };
    }
}

function displayNews(news) {
    const newsGrid = document.getElementById('newsGrid');
    
    if (!news || news.length === 0) {
        newsGrid.innerHTML = '<p class="no-news">暂无新闻</p>';
        return;
    }
    
    const newsHTML = news.map(item => {
        // 获取第一张图片作为封面
        let imageUrl = item.cover_image || 'assets/images/br1.png';
        if (item.images && item.images.length > 0) {
            imageUrl = item.images[0].image_path;
        }
        
        // 修正图片路径，不再自动添加前导斜杠
        if (imageUrl.startsWith('/')) {
            imageUrl = imageUrl.substring(1);
        }
        
        // 提取摘要（取内容前100个字符）
        const excerpt = item.summary || item.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...';
        
        // 格式化日期
        const date = new Date(item.created_at).toLocaleDateString('zh-CN');
        
        return `
            <div class="news-card card hover-lift">
                <div class="news-image">
                    <img src="${imageUrl}" alt="${item.title}" onerror="this.src='assets/images/gallery2.jpg'">
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
    
    if (currentNewsPage === 1) {
        newsGrid.innerHTML = newsHTML;
    } else {
        newsGrid.insertAdjacentHTML('beforeend', newsHTML);
    }
}

function initNewsLoading() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;
    
    loadMoreBtn.addEventListener('click', async () => {
        currentNewsPage++;
        const data = await loadNews(currentNewsPage);
        
        if (data && data.news) {
            displayNews(data.news);
            
            // 如果没有更多新闻，隐藏加载更多按钮
            if (currentNewsPage * newsPerPage >= data.pagination.total) {
                loadMoreBtn.style.display = 'none';
            }
        }
    });
    
    // 初始加载
    loadNews(1).then(data => {
        if (data && data.news) {
            displayNews(data.news);
            
            // 如果没有更多新闻，隐藏加载更多按钮
            if (newsPerPage >= data.pagination.total) {
                loadMoreBtn.style.display = 'none';
            }
        }
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