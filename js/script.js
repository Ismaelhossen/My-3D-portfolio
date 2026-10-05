// ===== THREE.JS BACKGROUND =====
(function() {
    const container = document.getElementById('three-canvas');
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 16);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    let particlesCount = 800;
    let posArray = new Float32Array(particlesCount * 3);
    let colorsArray = new Float32Array(particlesCount * 3);
    let originalPositions = new Float32Array(particlesCount * 3);

    function createParticles() {
        for (let i = 0; i < particlesCount * 3; i += 3) {
            posArray[i] = (Math.random() - 0.5) * 50;
            posArray[i + 1] = (Math.random() - 0.5) * 35;
            posArray[i + 2] = (Math.random() - 0.5) * 20 - 5;
            originalPositions[i] = posArray[i];
            originalPositions[i + 1] = posArray[i + 1];
            originalPositions[i + 2] = posArray[i + 2];
            const hue = 0.55 + Math.random() * 0.25;
            const color = new THREE.Color().setHSL(hue, 0.8, 0.5 + Math.random() * 0.3);
            colorsArray[i] = color.r;
            colorsArray[i + 1] = color.g;
            colorsArray[i + 2] = color.b;
        }
    }
    createParticles();

    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.25,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.12,
    });
    let lineMesh = new THREE.LineSegments(new THREE.BufferGeometry(), lineMaterial);
    scene.add(lineMesh);

    let mouseX = 0,
        mouseY = 0;
    let time = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouseX = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouseY = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }, { passive: true });

    window.addEventListener('resize', () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    const target = new THREE.Vector2();

    let effects = {
        particles: true,
        lines: true,
        parallax: true,
        float: true,
        glow: true,
        rainbow: true,
        pulse: true,
        spiral: true
    };

    document.addEventListener('effectToggle', function(e) {
        const { effect, enabled } = e.detail;
        if (effect in effects) {
            effects[effect] = enabled;
            if (effect === 'particles') particlesMesh.visible = enabled;
            if (effect === 'lines') lineMesh.visible = enabled;
        }
    });

    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        target.x += (mouseX * 2.5 - target.x) * 0.02;
        target.y += (mouseY * 1.5 - target.y) * 0.02;

        const positions = particlesMesh.geometry.attributes.position.array;

        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;
            let x = originalPositions[i3];
            let y = originalPositions[i3 + 1];
            let z = originalPositions[i3 + 2];

            if (effects.float) {
                y += Math.sin(time * 0.5 + i * 0.02) * 0.8;
                x += Math.cos(time * 0.3 + i * 0.015) * 0.3;
            }

            if (effects.rainbow) {
                const hue = (time * 0.02 + i * 0.001) % 1;
                const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
                const colors = particlesMesh.geometry.attributes.color.array;
                colors[i3] = color.r;
                colors[i3 + 1] = color.g;
                colors[i3 + 2] = color.b;
            }

            if (effects.pulse) {
                const pulse = 1 + Math.sin(time * 0.6 + i * 0.01) * 0.15;
                x *= pulse;
                y *= pulse;
                z *= pulse;
            }

            if (effects.spiral) {
                const angle = time * 0.2 + i * 0.005;
                const radius = Math.sqrt(x * x + z * z);
                const currentAngle = Math.atan2(z, x) + angle * 0.05;
                x = Math.cos(currentAngle) * radius;
                z = Math.sin(currentAngle) * radius;
            }

            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;
        }

        if (effects.rainbow) particlesMesh.geometry.attributes.color.needsUpdate = true;
        particlesMesh.geometry.attributes.position.needsUpdate = true;

        if (effects.particles) {
            particlesMesh.rotation.y += 0.0002;
            particlesMesh.rotation.x += 0.0001;
        }

        if (effects.lines && effects.particles) {
            const linePositions = [];
            const threshold = 2.2;
            for (let i = 0; i < particlesCount; i++) {
                for (let j = i + 1; j < particlesCount; j++) {
                    const i3 = i * 3,
                        j3 = j * 3;
                    const dx = positions[i3] - positions[j3];
                    const dy = positions[i3 + 1] - positions[j3 + 1];
                    const dz = positions[i3 + 2] - positions[j3 + 2];
                    if (Math.sqrt(dx * dx + dy * dy + dz * dz) < threshold) {
                        linePositions.push(positions[i3], positions[i3 + 1], positions[i3 + 2]);
                        linePositions.push(positions[j3], positions[j3 + 1], positions[j3 + 2]);
                    }
                }
            }
            if (linePositions.length > 0) {
                lineMesh.geometry.dispose();
                lineMesh.geometry = new THREE.BufferGeometry();
                lineMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
            }
        }

        if (effects.parallax) {
            camera.position.x += (target.x * 1.2 - camera.position.x) * 0.04;
            camera.position.y += (target.y * 0.8 - camera.position.y) * 0.04;
        }
        camera.lookAt(0, 0, 0);

        if (effects.glow) {
            particlesMaterial.size = 0.25 + Math.sin(time * 0.8) * 0.08;
        } else {
            particlesMaterial.size = 0.25;
        }

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('beforeunload', () => {
        renderer.dispose();
    });
})();

// ===== MAIN SCRIPTS =====
document.addEventListener('DOMContentLoaded', function() {
    // ===== PARTICLE BURST CURSOR EFFECT =====
    const cursorParticle = document.getElementById('cursorParticle');

    document.addEventListener('mousemove', (e) => {
        cursorParticle.style.left = e.clientX + 'px';
        cursorParticle.style.top = e.clientY + 'px';
    });

    document.addEventListener('click', (e) => {
        const colors = [
            '#22d3ee', '#8b5cf6', '#f472b6', '#34d399', 
            '#fbbf24', '#fb923c', '#f87171', '#60a5fa',
            '#a78bfa', '#2dd4bf', '#fcd34d', '#fca5a5'
        ];
        
        for (let i = 0; i < 16; i++) {
            const burst = document.createElement('div');
            burst.className = 'particle-burst';
            
            const size = 4 + Math.random() * 14;
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 80;
            
            burst.style.width = size + 'px';
            burst.style.height = size + 'px';
            burst.style.left = e.clientX + 'px';
            burst.style.top = e.clientY + 'px';
            burst.style.background = colors[Math.floor(Math.random() * colors.length)];
            burst.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            burst.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
            burst.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
            burst.style.animationDuration = (0.4 + Math.random() * 0.6) + 's';
            burst.style.boxShadow = `0 0 20px ${colors[Math.floor(Math.random() * colors.length)]}44`;
            
            document.body.appendChild(burst);
            
            setTimeout(() => burst.remove(), 1200);
        }
    });

    document.querySelectorAll('a, button, .project-card, .home-img, .skill-card, .exp-card, .achievement-card, .info-card, .form-card, .testimonial-card')
        .forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorParticle.classList.add('active');
            });
            el.addEventListener('mouseleave', () => {
                cursorParticle.classList.remove('active');
            });
        });

    // ===== SPEED INDICATOR =====
    const startTime = performance.now();
    window.addEventListener('load', function() {
        const loadTime = (performance.now() - startTime) / 1000;
        const speedText = document.getElementById('speedText');
        const dot = document.querySelector('.speed-indicator .dot');
        if (loadTime < 2) {
            speedText.textContent = `${loadTime.toFixed(2)}s · Fast`;
            dot.className = 'dot good';
        } else if (loadTime < 4) {
            speedText.textContent = `${loadTime.toFixed(2)}s · Medium`;
            dot.className = 'dot medium';
        } else {
            speedText.textContent = `${loadTime.toFixed(2)}s · Slow`;
            dot.className = 'dot slow';
        }
    });

    // ===== POPUP TOGGLES =====
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const effectToggleBtn = document.getElementById('effectToggleBtn');
    const themePopup = document.getElementById('themePopup');
    const effectPopup = document.getElementById('effectPopup');

    themeToggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        themePopup.classList.toggle('open');
        effectPopup.classList.remove('open');
    });

    effectToggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        effectPopup.classList.toggle('open');
        themePopup.classList.remove('open');
    });

    document.addEventListener('click', function(e) {
        if (!themePopup.contains(e.target) && e.target !== themeToggleBtn) {
            themePopup.classList.remove('open');
        }
        if (!effectPopup.contains(e.target) && e.target !== effectToggleBtn) {
            effectPopup.classList.remove('open');
        }
    });

    // ===== COLOR THEME =====
    const themeBtns = document.querySelectorAll('[data-theme]');
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    themeBtns.forEach(btn => {
        if (btn.dataset.theme === savedTheme) btn.classList.add('active');
        btn.addEventListener('click', function() {
            const theme = this.dataset.theme;
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('selectedTheme', theme);
            themeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            document.documentElement.removeAttribute('data-bg');
            document.querySelectorAll('[data-bg]').forEach(b => b.classList.remove('active'));
            setTimeout(() => themePopup.classList.remove('open'), 400);
        });
    });

    // ===== BACKGROUND =====
    const bgBtns = document.querySelectorAll('[data-bg]');
    const savedBg = localStorage.getItem('selectedBg') || 'dark';
    bgBtns.forEach(btn => {
        if (btn.dataset.bg === savedBg) btn.classList.add('active');
        btn.addEventListener('click', function() {
            const bg = this.dataset.bg;
            document.documentElement.setAttribute('data-bg', bg);
            localStorage.setItem('selectedBg', bg);
            document.documentElement.removeAttribute('data-theme');
            document.querySelectorAll('[data-theme]').forEach(b => b.classList.remove('active'));
            bgBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            setTimeout(() => themePopup.classList.remove('open'), 400);
        });
    });

    // ===== 3D EFFECTS =====
    const effectBtns = document.querySelectorAll('[data-effect]');
    const savedEffects = JSON.parse(localStorage.getItem('enabledEffects') ||
        '{"particles":true,"lines":true,"parallax":true,"float":true,"glow":true,"rainbow":true,"pulse":true,"spiral":true}');

    effectBtns.forEach(btn => {
        const effect = btn.dataset.effect;
        if (savedEffects[effect] === false) {
            btn.classList.remove('active');
        } else {
            btn.classList.add('active');
        }
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            const enabled = this.classList.contains('active');
            const effectName = this.dataset.effect;
            const event = new CustomEvent('effectToggle', {
                detail: { effect: effectName, enabled }
            });
            document.dispatchEvent(event);
            const effects = JSON.parse(localStorage.getItem('enabledEffects') ||
                '{"particles":true,"lines":true,"parallax":true,"float":true,"glow":true,"rainbow":true,"pulse":true,"spiral":true}');
            effects[effectName] = enabled;
            localStorage.setItem('enabledEffects', JSON.stringify(effects));
        });
    });

    // ===== LOADING =====
    setTimeout(() => {
        document.getElementById('loader-wrapper').classList.add('hidden');
    }, 800);

    // ===== SCROLL PROGRESS =====
    window.addEventListener('scroll', function() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        document.getElementById('scroll-progress').style.width = (scrollTop / docHeight * 100) + '%';
    });

    // ===== BACK TO TOP =====
    const backToTop = document.getElementById('back-to-top');
    window.addEventListener('scroll', function() {
        backToTop.classList.toggle('visible', window.scrollY > 300);
    });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // ===== COUNTER =====
    document.querySelectorAll('.counter-num').forEach(counter => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.dataset.target);
                    let current = 0;
                    const increment = target / 60;
                    const update = () => {
                        current += increment;
                        if (current < target) {
                            entry.target.textContent = Math.floor(current);
                            requestAnimationFrame(update);
                        } else {
                            entry.target.textContent = target;
                        }
                    };
                    update();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        observer.observe(counter);
    });

    // ===== SKILL FILTER =====
    const filterBtns = document.querySelectorAll('.skill-filter button');
    const skillCards = document.querySelectorAll('.skill-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;

            skillCards.forEach((card, index) => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'flex';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(30px)';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                        card.style.transition = 'all 0.5s ease';
                    }, index * 50);
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    skillCards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
            card.style.transition = 'all 0.5s ease';
        }, i * 50);
    });

    // ===== TESTIMONIAL SLIDER =====
    const track = document.getElementById('testimonialTrack');
    const dots = document.querySelectorAll('#testimonialDots button');
    let currentSlide = 0;
    const totalSlides = dots.length;

    function goToSlide(index) {
        currentSlide = index;
        track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToSlide(index));
    });

    let slideInterval = setInterval(() => {
        goToSlide((currentSlide + 1) % totalSlides);
    }, 5000);

    const slider = document.querySelector('.testimonial-slider');
    slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
    slider.addEventListener('mouseleave', () => {
        slideInterval = setInterval(() => {
            goToSlide((currentSlide + 1) % totalSlides);
        }, 5000);
    });

    // ===== NEWSLETTER =====
    document.getElementById('newsletterForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('newsletterEmail').value;
        const msg = document.getElementById('newsletterMsg');

        if (email) {
            msg.textContent = '✅ Thanks for subscribing! 🎉';
            msg.className = 'newsletter-msg success';
            this.reset();
            setTimeout(() => {
                msg.textContent = '';
                msg.className = 'newsletter-msg';
            }, 5000);
        }
    });

    // ===== HERO PARALLAX =====
    if (window.innerWidth > 768) {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 2;
            const y = (e.clientY / window.innerHeight - 0.5) * 2;
            const hero = document.getElementById('heroParallax');
            const img = document.getElementById('heroImage');
            const aboutImg = document.querySelector('.about-img');
            if (hero) hero.style.transform = `rotateY(${x*2}deg) rotateX(${-y*2}deg)`;
            if (img) img.style.transform =
            `translateX(${x*25}px) translateY(${y*25}px) scale(1.02)`;
            if (aboutImg) aboutImg.style.transform =
                `translateX(${-x*15}px) translateY(${y*15}px) scale(1.01)`;
        });
    }

    // ===== NAVBAR =====
    const nav = document.getElementById('mainNav');
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50));

    // ===== MOBILE TOGGLER =====
    const toggler = document.getElementById('navToggler');
    const mobileMenu = document.getElementById('mobileMenu');
    toggler.addEventListener('click', function() {
        this.classList.toggle('active');
        mobileMenu.classList.toggle('open');
    });
    document.querySelectorAll('.mobile-menu a').forEach(link => {
        link.addEventListener('click', () => {
            toggler.classList.remove('active');
            mobileMenu.classList.remove('open');
        });
    });

    // ===== ACTIVE LINK =====
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a:not(.nav-btn)');
    const mobileLinks = document.querySelectorAll('.mobile-menu a:not(.nav-btn)');

    function updateActiveLink() {
        let current = '';
        const pos = window.scrollY + 150;
        sections.forEach(section => {
            if (pos >= section.offsetTop && pos < section.offsetTop + section.offsetHeight) {
                current = section.id;
            }
        });
        if (!current && sections.length) current = sections[0].id;
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
        mobileLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
    }
    window.addEventListener('scroll', updateActiveLink);
    window.addEventListener('load', updateActiveLink);

    // ===== TYPING =====
    const nameEl = document.getElementById('typed-name');
    const descEl = document.getElementById('typed-desc');
    if (nameEl && descEl) {
        const nameText = "IsMaIL Hossen";
        const descText =
            "A passionate Web Developer and MERN Stack learner focused on building modern, responsive, and user-friendly web applications.";
        let ni = 0,
            di = 0;

        function typeName() {
            if (ni < nameText.length) {
                nameEl.textContent = nameText.substring(0, ni + 1);
                ni++;
                setTimeout(typeName, 80);
            } else {
                setTimeout(typeDesc, 500);
            }
        }

        function typeDesc() {
            if (di < descText.length) {
                descEl.textContent = descText.substring(0, di + 1);
                di++;
                setTimeout(typeDesc, 50);
            }
        }
        setTimeout(typeName, 500);
    }

    // ===== SCROLL ANIMATIONS =====
    document.querySelectorAll('.fade-up, .fade-up-left, .fade-up-right').forEach(el => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });
        observer.observe(el);
    });

    document.querySelectorAll('.progress-fill').forEach(bar => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const w = entry.target.dataset.width || '0';
                    entry.target.style.setProperty('--target-width', w + '%');
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2, rootMargin: '0px 0px -30px 0px' });
        observer.observe(bar);
    });

    document.querySelectorAll('.contact-cards-row .info-card, .contact-cards-row .form-card').forEach(el => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
        observer.observe(el);
    });

    // ===== CONTACT FORM =====
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const form = this;
        const formData = new FormData(form);
        const msg = document.getElementById('formMessage');
        const btn = form.querySelector('.send-btn');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;
        fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                msg.className = 'form-message';
                if (data.success) {
                    msg.classList.add('success');
                    msg.textContent = '✅ Your message has been sent successfully!';
                    form.reset();
                } else {
                    msg.classList.add('error');
                    msg.textContent = '❌ ' + (data.message || 'Something went wrong.');
                }
                btn.innerHTML = original;
                btn.disabled = false;
            })
            .catch(() => {
                msg.className = 'form-message error';
                msg.textContent = '❌ Network error. Please try again.';
                btn.innerHTML = original;
                btn.disabled = false;
            });
    });

    // ===== CV DOWNLOAD AS PDF =====
    function generatePDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = 210;
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        let y = 20;
        
        // ===== HEADER =====
        doc.setFontSize(22);
        doc.setTextColor('#0a0e1a');
        doc.setFont('helvetica', 'bold');
        doc.text('MD ISMAEL HOSSEN', pageWidth / 2, y, { align: 'center' });
        y += 10;
        
        doc.setFontSize(12);
        doc.setTextColor('#666666');
        doc.setFont('helvetica', 'normal');
        doc.text('Computer Science Student · Aspiring MERN Stack Developer', pageWidth / 2, y, { align: 'center' });
        y += 8;
        
        doc.setFontSize(10);
        doc.setTextColor('#22d3ee');
        doc.text('01799121833 | mdismaelhossen596@gmail.com | Porsha, Noagaon, Rajshahi', pageWidth / 2, y, { align: 'center' });
        y += 6;
        
        doc.setTextColor('#666666');
        doc.text('GitHub: github.com/Ismaelhossen | Portfolio: ismaelhossen.github.io', pageWidth / 2, y, { align: 'center' });
        y += 12;
        
        doc.setDrawColor('#22d3ee');
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
        
        // ===== EDUCATION =====
        doc.setFontSize(14);
        doc.setTextColor('#0a0e1a');
        doc.setFont('helvetica', 'bold');
        doc.text('EDUCATION', margin, y);
        y += 8;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0a0e1a');
        doc.text('Diploma in Computer Science', margin, y);
        y += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#666666');
        doc.text('TMSS Institute of Science and ICT, Bogura (Present)', margin, y);
        y += 6;
        doc.text('Secondary School Certificate - 2023', margin, y);
        y += 6;
        doc.text('Niskinpur High School, Porsha, Noagaon, Rajshahi', margin, y);
        y += 12;
        
        // ===== TECHNICAL SKILLS =====
        doc.setFontSize(14);
        doc.setTextColor('#0a0e1a');
        doc.setFont('helvetica', 'bold');
        doc.text('TECHNICAL SKILLS', margin, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#333333');
        const skills = [
            'HTML, CSS, JavaScript, React, Bootstrap',
            'Node.js, Express.js, MongoDB, PHP',
            'Java, Python, C, C++',
            'Git & GitHub, Responsive Design'
        ];
        skills.forEach(skill => {
            doc.text('• ' + skill, margin + 3, y);
            y += 6;
        });
        y += 6;
        
        // ===== PROFESSIONAL SUMMARY =====
        doc.setFontSize(14);
        doc.setTextColor('#0a0e1a');
        doc.setFont('helvetica', 'bold');
        doc.text('PROFESSIONAL SUMMARY', margin, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#333333');
        const summary = 'Motivated Computer Science student with a strong foundation in web development and growing expertise in the MERN stack (MongoDB, Express.js, React, Node.js). Passionate about building modern, responsive, and high-performance web applications. Eager to secure an internship where I can apply my front-end development skills, contribute to real-world projects, and continuously learn from industry professionals.';
        const summaryLines = doc.splitTextToSize(summary, maxWidth);
        doc.text(summaryLines, margin, y);
        y += (summaryLines.length * 5) + 8;
        
        // ===== PROJECTS =====
        doc.setFontSize(14);
        doc.setTextColor('#0a0e1a');
        doc.setFont('helvetica', 'bold');
        doc.text('PROJECTS', margin, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#0a0e1a');
        
        const projects = [
            { title: 'Portfolio Website · React, CSS', desc: 'Designed and developed a personal portfolio website to showcase skills and projects, focused on modern UI/UX and responsive design.' },
            { title: 'E-Commerce Platform · HTML, CSS, JavaScript', desc: 'Built a front-end e-commerce interface with a focus on clean layout and user experience.' },
            { title: '3D Premium Gallery · CSS', desc: 'Created an interactive 3D image gallery to demonstrate advanced CSS styling and animations.' },
            { title: 'Calculator App · HTML, CSS, JavaScript', desc: 'Developed a fully functional calculator application with a user-friendly interface.' },
            { title: 'Digital Clock · JavaScript', desc: 'Built a real-time digital clock application using JavaScript.' }
        ];
        
        projects.forEach(proj => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#0a0e1a');
            doc.text('• ' + proj.title, margin, y);
            y += 5;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor('#555555');
            const descLines = doc.splitTextToSize(proj.desc, maxWidth - 5);
            doc.text(descLines, margin + 4, y);
            y += (descLines.length * 5) + 4;
        });
        
        doc.setTextColor('#666666');
        doc.setFont('helvetica', 'italic');
        doc.text('All projects are available on GitHub: github.com/Ismaelhossen', margin, y);
        y += 10;
        
        // ===== LANGUAGES =====
        doc.setFontSize(14);
        doc.setTextColor('#0a0e1a');
        doc.setFont('helvetica', 'bold');
        doc.text('LANGUAGES', margin, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#333333');
        doc.text('Python · Java · C · C++', margin, y);
        y += 10;
        
        // ===== REFERENCES =====
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor('#666666');
        doc.text('References and further details available on request.', margin, y);
        y += 8;
        
        doc.setDrawColor('#22d3ee');
        doc.setLineWidth(0.3);
        doc.line(margin, y + 5, pageWidth - margin, y + 5);
        y += 10;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#999999');
        doc.text('Thank you for reviewing my profile!', pageWidth / 2, y, { align: 'center' });
        
        return doc;
    }

    function downloadCV() {
        const doc = generatePDF();
        doc.save('Md_Ismael_Hossen_CV.pdf');
    }

    document.getElementById('downloadCV').addEventListener('click', function(e) {
        e.preventDefault();
        downloadCV();
    });
    document.getElementById('navDownloadCV').addEventListener('click', function(e) {
        e.preventDefault();
        downloadCV();
    });
    document.getElementById('mobileDownloadCV').addEventListener('click', function(e) {
        e.preventDefault();
        downloadCV();
    });
});