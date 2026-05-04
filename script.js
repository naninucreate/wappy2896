/* ===================================================
   wappy2896 — Apple-Style Premium Interactions
   =================================================== */

(function () {
    'use strict';

    // Scroll restoration control
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    document.addEventListener('DOMContentLoaded', () => {
        // --- ドメインチェックの実行 ---
        checkDomain();

        const loadingScreen = document.getElementById('loading-screen');
        const loaderBar = document.getElementById('loader-bar');
        const mainContent = document.getElementById('main-content');
        const navbar = document.getElementById('navbar');
        const heroContent = document.getElementById('hero-content');
        const heroBg = document.getElementById('hero-bg');
        const subscriberCount = document.getElementById('subscriber-count');
        const scrollIndicator = document.getElementById('scroll-indicator');

        // ===================================================
        // 1. LOADING SCREEN (first visit only via sessionStorage)
        // ===================================================
        const LOADING_KEY = 'wappy_loaded';

        function cubicBezier(t) {
            return t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        function runLoadingAnimation() {
            const duration = 2000;
            let startTime = null;

            function animate(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const rawProgress = Math.min(elapsed / duration, 1);
                const easedProgress = cubicBezier(rawProgress);
                const percent = easedProgress * 100;

                loaderBar.style.width = percent + '%';

                if (rawProgress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    loaderBar.style.width = '100%';
                    setTimeout(() => {
                        loadingScreen.classList.add('fade-out');
                        setTimeout(() => {
                            loadingScreen.classList.add('hidden');
                            loadingScreen.style.display = 'none';
                            revealContent();
                        }, 800);
                    }, 300);
                }
            }

            requestAnimationFrame(animate);
        }

        function revealContent() {
            document.body.classList.add('loaded');
            document.body.style.overflow = '';
            document.body.style.overflowX = 'hidden';
            document.body.style.overflowY = 'auto';

            mainContent.style.opacity = '1';
            mainContent.style.transform = 'translateY(0)';
            mainContent.classList.add('visible');

            initObservers();
            fetchYouTubeStats();
        }

        runLoadingAnimation();

        // ===================================================
        // 2. HERO PARALLAX + SCALE on SCROLL (rAF-driven)
        // ===================================================
        let ticking = false;
        let lastScrollY = 0;

        function onScroll() {
            lastScrollY = window.scrollY;
            if (!ticking) {
                requestAnimationFrame(updateScrollEffects);
                ticking = true;
            }
        }

        function updateScrollEffects() {
            const scrollY = lastScrollY;
            const windowH = window.innerHeight;

            const heroProgress = Math.min(scrollY / windowH, 1);
            const heroScale = 1 - heroProgress * 0.25;
            const heroTranslateY = -heroProgress * 40;
            heroContent.style.transform =
                `translate3d(0, ${heroTranslateY}px, 0) scale(${heroScale})`;

            heroBg.style.transform = `translate3d(0, ${scrollY * 0.3}px, 0)`;

            if (scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            if (scrollIndicator) {
                const indicatorOpacity = Math.max(0, 1 - scrollY / 200);
                scrollIndicator.style.opacity = indicatorOpacity * 0.6;
            }

            ticking = false;
        }

        window.addEventListener('scroll', onScroll, { passive: true });

        if (scrollIndicator) {
            scrollIndicator.addEventListener('click', () => {
                const statsSection = document.getElementById('stats-section');
                if (statsSection) {
                    statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }

        // ===================================================
        // 4. INTERSECTION OBSERVER — Stagger Fade-In
        // ===================================================
        function initObservers() {
            const fadeElements = document.querySelectorAll('.fade-in-element');

            const fadeObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        const delay = index * 150;
                        setTimeout(() => {
                            entry.target.classList.add('visible');
                        }, delay);
                        fadeObserver.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -40px 0px'
            });

            fadeElements.forEach((el) => {
                fadeObserver.observe(el);
            });

            const statsSection = document.getElementById('stats-section');
            if (statsSection) {
                const statsObserver = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && !counterAnimated) {
                            if (window._subCount) {
                                animateCounter(window._subCount, 1800);
                            } else {
                                window._startCounterWhenReady = true;
                            }
                            statsObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.3 });

                statsObserver.observe(statsSection);
            }
        }

        // ===================================================
        // 5. SUBSCRIBER COUNT — Animated Counter (once)
        // ===================================================
        const API_KEY = 'AIzaSyARGzv0qvjqn2akf1Mo6_WzHohLaJYzFvo';
        const CHANNEL_ID = '@wappy2896';
        let counterAnimated = false;

        function animateCounter(target, duration) {
            if (counterAnimated) return;
            counterAnimated = true;

            const startTime = performance.now();

            function step(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = progress * (2 - progress);
                const current = Math.floor(eased * target);

                subscriberCount.textContent = current.toLocaleString();

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    subscriberCount.textContent = target.toLocaleString();
                }
            }

            requestAnimationFrame(step);
        }

        function fetchYouTubeStats() {
            const url = `https://youtube.googleapis.com/youtube/v3/channels?part=statistics&forHandle=${encodeURIComponent(CHANNEL_ID)}&key=${API_KEY}`;

            fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error('API error');
                    return res.json();
                })
                .then(data => {
                    if (data.items && data.items.length > 0) {
                        const subs = parseInt(data.items[0].statistics.subscriberCount, 10);
                        if (!isNaN(subs)) {
                            window._subCount = subs;
                            if (window._startCounterWhenReady) {
                                animateCounter(subs, 1800);
                            }
                        } else {
                            subscriberCount.textContent = '非公開';
                        }
                    } else {
                        subscriberCount.textContent = 'データなし';
                    }
                })
                .catch(err => {
                    console.error('YouTube API error:', err);
                    subscriberCount.textContent = 'エラー';
                });
        }

        // ===================================================
        // 6. FUN INTERACTIONS & EASTER EGGS
        // ===================================================
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });

        let secretSequence = [];
        const secretCode = ['w', 'a', 'p', 'p', 'y'];
        const bodyClass = document.body.classList;

        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            secretSequence.push(e.key.toLowerCase());
            if (secretSequence.length > secretCode.length) {
                secretSequence.shift();
            }
            if (secretSequence.join('') === secretCode.join('')) {
                bodyClass.add('easter-egg-party');
                for (let i = 0; i < 30; i++) {
                    const confetti = document.createElement('img');
                    confetti.src = '4117EF31-3841-4C94-B419-0E731D7C7061.png';
                    confetti.className = 'wappy-confetti';
                    const left = Math.random() * 100;
                    const size = 30 + Math.random() * 50;
                    const duration = 2 + Math.random() * 3;
                    const delay = Math.random() * 1.5;
                    confetti.style.left = `${left}vw`;
                    confetti.style.width = `${size}px`;
                    confetti.style.height = `${size}px`;
                    confetti.style.animationDuration = `${duration}s`;
                    confetti.style.animationDelay = `${delay}s`;
                    document.body.appendChild(confetti);
                    setTimeout(() => {
                        confetti.remove();
                    }, (duration + delay) * 1000);
                }
                setTimeout(() => {
                    bodyClass.remove('easter-egg-party');
                }, 5000);
                secretSequence = [];
            }
        });

        // ===================================================
        // 7. DOMAIN CHECKER (Popup)
        // ===================================================
        function checkDomain() {
            const canonicalDomain = 'wappy2896.pages.dev';
            const currentDomain = window.location.hostname;

            // nagyou.net などが含まれている場合に警告を出す
            if (currentDomain.includes('nagyou.net')) {
                const overlay = document.createElement('div');
                overlay.style = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.85); z-index: 10000;
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-family: sans-serif; padding: 20px;
                `;

                const modal = document.createElement('div');
                modal.style = `
                    background: #1a1a1a; padding: 30px; border-radius: 20px;
                    text-align: center; max-width: 450px; border: 2px solid #333;
                `;

                modal.innerHTML = `
                    <h2 style="margin-top:0; color: #ff4757;">ドメインが異なります</h2>
                    <p>正しいURLは <strong>${canonicalDomain}</strong> です。<br>
                    現在のドメインではYouTube APIなどが正常に動作しない可能性があります。</p>
                    <button id="moveBtn" style="background:#007bff; color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; width:100%; margin-bottom:10px;">正しいサイトへ移動</button>
                    <button id="stayBtn" style="background:transparent; color:#aaa; border:none; cursor:pointer; text-decoration:underline;">無視して閉じる</button>
                `;

                overlay.appendChild(modal);
                document.body.appendChild(overlay);

                document.getElementById('moveBtn').onclick = () => {
                    window.location.href = `https://${canonicalDomain}` + window.location.pathname;
                };

                document.getElementById('stayBtn').onclick = () => {
                    document.body.removeChild(overlay);
                };
            }
        }

    });
})();
