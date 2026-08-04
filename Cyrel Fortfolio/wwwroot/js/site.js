        // ==========================================
        // PART 1: GLOBAL VARIABLES
        // ==========================================
        let tetrisActive = false;
        let heldPiece = null;
        let canHold = true;
        let arena, player;
        let dropCounter = 0, dropInterval = 1000, lastTime = 0, requestID;
        const matrixColors = [null, '#facc15', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#f97316', '#06b6d4'];
        let canvas, context;
        let clickCount = 0, clickTimeout;

        let profileClickCount = 0, profileClickTimeout;
        let heartInterval;

        // ==========================================
        // PART 2: DOCUMENT READY (EVENTS & TRIGGERS)
        // ==========================================
        $(document).ready(function () {
            
            runLoadingScreen();
            initScrollReveal();

            $('a[href^="#"]').on('click', function (e) {
                e.preventDefault();
                const target = $($(this).attr('href'));
                if (target.length) {
                    $('html, body').animate({ scrollTop: target.offset().top }, 600);
                }
            });

            $('#image-modal').on('click', function (e) {
                if (!$(e.target).closest('#image-modal-content').length) {
                    closeImageModal();
                }
            });

            const $backToTop = $("#backToTop");
            $(window).on("scroll", function () {
                if ($(this).scrollTop() > 400) {
                    if ($backToTop.hasClass('hidden')) {
                        $backToTop.removeClass("hidden pointer-events-none translate-y-10").animate({ opacity: 1 }, 300);
                    }
                } else {
                    if (!$backToTop.hasClass('hidden')) {
                        $backToTop.animate({ opacity: 0 }, 300, function () {
                            $(this).addClass("hidden pointer-events-none translate-y-10");
                        });
                    }
                }
            });

            $backToTop.on("click", function () {
                $('html, body').animate({ scrollTop: 0 }, 600);
            });

            $(document).on('keydown', function (event) {
                if (event.key === "Escape") {
                    if (!$('#image-modal').hasClass('hidden')) closeImageModal();
                    if (!$('#tetris-modal').hasClass('hidden')) closeTetris();
                    if (!$('#auth-modal').hasClass('hidden')) closeAuthModal();
                    if (!$('#hack-modal').hasClass('hidden')) closeHackSequence();
                }
            });

            // Tetris Init
            canvas = document.getElementById('tetris');
            if (canvas) {
                context = canvas.getContext('2d');
                context.scale(30, 30);
            }

            $('#secret-name').on('click', function () {
                clickCount++;
                clearTimeout(clickTimeout);
                clickTimeout = setTimeout(() => { clickCount = 0; }, 600);

                if (clickCount >= 3) {
                    clickCount = 0;
                    startTetris();
                }
            });

            $(document).on('keydown', function (event) {
                if (tetrisActive) {
                    switch (event.key) {
                        case "ArrowLeft": playerMove(-1); break;
                        case "ArrowRight": playerMove(1); break;
                        case "ArrowDown": playerDrop(); break;
                        case "ArrowUp": playerRotate(1); break;
                        case " ": case "Space": event.preventDefault(); playerHardDrop(); break;
                        case "c": case "C": holdPieceAction(); break;
                    }
                }
            });

            $('#tetris-reboot-btn').on('click', tetrisStartGame);
            $('#btn-left').on('click', () => { if (tetrisActive) playerMove(-1); });
            $('#btn-right').on('click', () => { if (tetrisActive) playerMove(1); });
            $('#btn-down').on('click', () => { if (tetrisActive) playerDrop(); });
            $('#btn-rotate').on('click', () => { if (tetrisActive) playerRotate(1); });
            $('#btn-harddrop').on('click', () => { if (tetrisActive) playerHardDrop(); });
            $('#btn-hold').on('click', () => { if (tetrisActive) holdPieceAction(); });

            $('#button-DLDashAccessWebsite').on('click', function () {
                window.open('https://dldash.divinalaw.com/version-test/login', '_blank');
            });

            $('#profile-img-container').on('click', function () {
                profileClickCount++;
                clearTimeout(profileClickTimeout);

                if (profileClickCount >= 3) {
                    profileClickCount = 0;
                    openAuthModal();
                } else {
                    profileClickTimeout = setTimeout(() => {
                        if (profileClickCount > 0) {
                            openImageModal($(this).find('img').attr('src'));
                        }
                        profileClickCount = 0;
                    }, 300);
                }
            });

            $('#auth-submit').on('click', verifyAuth);
            $('#auth-input').on('keypress', function (e) {
                if (e.key === 'Enter') verifyAuth();
            });
            $('#closeRomanticMode').on('click', function (){
                closeRomanticMode();
            });
        });

        // ==========================================
        // PART 3: FUNCTIONS
        // ==========================================
        function runLoadingScreen() {
            const techTexts = ["ESTABLISHING_CONNECTION...", "DECRYPTING_USER_DATA...", "LOADING_UI_MODULES...", "CALIBRATING_GRID...", "ACCESS_GRANTED."];
            let progress = 0, textIndex = 0;

            const loadInterval = setInterval(() => {
                progress += Math.random() * 25;
                if (progress > 100) progress = 100;

                $('#loader-bar').css('height', `${progress}%`);
                $('#loading-percentage').text(`${Math.floor(progress)}%`);

                if (progress > 20 && textIndex === 0) { textIndex++; $('#loading-text').text(techTexts[textIndex]); }
                if (progress > 50 && textIndex === 1) { textIndex++; $('#loading-text').text(techTexts[textIndex]); }
                if (progress > 80 && textIndex === 2) { textIndex++; $('#loading-text').text(techTexts[textIndex]); }

                if (progress === 100) {
                    clearInterval(loadInterval);
                    $('#loading-text').text(techTexts[4]).addClass('text-yellow-400');

                    setTimeout(() => {
                        $('#loading-screen').animate({ opacity: 0 }, 300, function () {
                            $(this).hide();
                            $('#main-content').removeClass('hidden').animate({ opacity: 1 }, 300);
                        });
                    }, 400);
                }
            }, 80);
        }

        function initScrollReveal() {
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    $(entry.target).toggleClass('is-visible', entry.isIntersecting);
                });
            }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

            $('.reveal-element').each(function () {
                revealObserver.observe(this);
            });
        }

        window.openImageModal = function(imgSrc) {
            $('#modal-image').attr('src', imgSrc);
            $('#image-modal').removeClass('hidden').css('display', 'flex').animate({ opacity: 1 }, 10);
            $('body').css('overflow', 'hidden');
        }

        window.closeImageModal = function() {
            $('#image-modal').animate({ opacity: 0 }, 300, function () {
                $(this).addClass('hidden').css('display', 'none');
                $('body').css('overflow', 'auto');
            });
        }

        window.closeAuthModal = function() {
            $('#auth-modal').animate({ opacity: 0 }, 300, function () {
                $(this).addClass('hidden').hide();
            });
        }
        
        window.closeTetris = function() {
            $('#tetris-modal').animate({ opacity: 0 }, 300, function () {
                $(this).addClass('hidden').css('display', 'none');
                $('body').css('overflow', 'auto');
                tetrisActive = false;
            });
        }

        function startTetris() {
            $('#tetris-modal').removeClass('hidden').css('display', 'flex').animate({ opacity: 1 }, 10);
            $('body').css('overflow', 'hidden');
            tetrisActive = true;
            
            arena = createMatrix(12, 20);
            player = { pos: { x: 0, y: 0 }, matrix: null, type: null, score: 0, combo: 0 };
            
            tetrisStartGame();
        }

        function tetrisStartGame() {
            arena.forEach(row => row.fill(0));
            player.score = 0;
            player.combo = 0;
            heldPiece = null;
            canHold = true;
            dropInterval = 1000;
            
            $('#tetris-gameover').addClass('hidden');
            updateScore();
            updateHoldDisplay();
            playerReset();
            
            if (requestID) cancelAnimationFrame(requestID);
            updateTetris();
        }

        function createMatrix(w, h) {
            const matrix = [];
            while (h--) matrix.push(new Array(w).fill(0));
            return matrix;
        }

        function createPiece(type) {
            if (type === 'T') return [[0, 0, 0], [1, 1, 1], [0, 1, 0]];
            if (type === 'O') return [[2, 2], [2, 2]];
            if (type === 'L') return [[0, 3, 0], [0, 3, 0], [0, 3, 3]];
            if (type === 'J') return [[0, 4, 0], [0, 4, 0], [4, 4, 0]];
            if (type === 'I') return [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]];
            if (type === 'S') return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
            if (type === 'Z') return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
        }

        function drawMatrix(matrix, offset) {
            matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        context.fillStyle = matrixColors[value];
                        context.fillRect(x + offset.x, y + offset.y, 1, 1);
                        context.strokeStyle = '#0f1115';
                        context.lineWidth = 0.05;
                        context.strokeRect(x + offset.x, y + offset.y, 1, 1);
                    }
                });
            });
        }

        function drawGhost() {
            if (!player.matrix) return;
            const ghost = { matrix: player.matrix, pos: { x: player.pos.x, y: player.pos.y } };
            while (!collide(arena, ghost)) { ghost.pos.y++; }
            ghost.pos.y--; 

            context.globalAlpha = 0.25;
            drawMatrix(ghost.matrix, ghost.pos);
            context.globalAlpha = 1.0; 
        }

        function draw() {
            context.fillStyle = '#0a0a0a';
            context.fillRect(0, 0, canvas.width, canvas.height);
            drawMatrix(arena, { x: 0, y: 0 });
            drawGhost(); 
            drawMatrix(player.matrix, player.pos);
        }

        function merge(arena, player) {
            player.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) arena[y + player.pos.y][x + player.pos.x] = value;
                });
            });
        }

        function collide(arena, player) {
            const m = player.matrix; const o = player.pos;
            for (let y = 0; y < m.length; ++y) {
                for (let x = 0; x < m[y].length; ++x) {
                    if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                        return true;
                    }
                }
            }
            return false;
        }

        function playerDrop() {
            player.pos.y++;
            if (collide(arena, player)) {
                player.pos.y--;
                merge(arena, player);
                playerReset();
                arenaSweep();
                updateScore();
            }
            dropCounter = 0;
        }

        function playerHardDrop() {
            while (!collide(arena, player)) player.pos.y++;
            player.pos.y--; 
            merge(arena, player);
            playerReset();
            arenaSweep();
            updateScore();
            dropCounter = 0;
        }

        function playerMove(dir) {
            player.pos.x += dir;
            if (collide(arena, player)) player.pos.x -= dir;
        }

        function playerRotate(dir) {
            const pos = player.pos.x;
            let offset = 1;
            rotate(player.matrix, dir);
            while (collide(arena, player)) {
                player.pos.x += offset;
                offset = -(offset + (offset > 0 ? 1 : -1));
                if (offset > player.matrix[0].length) {
                    rotate(player.matrix, -dir);
                    player.pos.x = pos;
                    return;
                }
            }
        }

        function rotate(matrix, dir) {
            for (let y = 0; y < matrix.length; ++y) {
                for (let x = 0; x < y; ++x) {
                    [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
                }
            }
            if (dir > 0) matrix.forEach(row => row.reverse());
            else matrix.reverse();
        }

        function holdPieceAction() {
            if (!canHold) return; 

            if (heldPiece === null) {
                heldPiece = player.type;
                playerReset(); 
            } else {
                const tempType = player.type;
                player.type = heldPiece;
                player.matrix = createPiece(heldPiece);
                heldPiece = tempType;
                
                player.pos.y = 0;
                player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
            }
            canHold = false; 
            dropCounter = 0;
            updateHoldDisplay();
        }

        function updateHoldDisplay() {
            $('#tetris-hold-piece-display').text(heldPiece ? heldPiece : 'None');
        }

        function playerReset() {
            const pieces = 'ILJOTSZ';
            player.type = pieces[pieces.length * Math.random() | 0];
            player.matrix = createPiece(player.type);
            player.pos.y = 0;
            player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
            canHold = true; 

            if (collide(arena, player)) {
                cancelAnimationFrame(requestID);
                $('#tetris-gameover').removeClass('hidden');
            }
        }

        function arenaSweep() {
            let linesCleared = 0;
            outer: for (let y = arena.length - 1; y >= 0; --y) {
                for (let x = 0; x < arena[y].length; ++x) {
                    if (arena[y][x] === 0) continue outer;
                }
                const row = arena.splice(y, 1)[0].fill(0);
                arena.unshift(row);
                ++y; linesCleared++;
            }

            if (linesCleared > 0) {
                player.combo++;
                let baseScore = linesCleared === 1 ? 100 : linesCleared === 2 ? 300 : linesCleared === 3 ? 500 : 800;
                player.score += (baseScore + ((player.combo - 1) * 50));
                dropInterval = Math.max(150, dropInterval - (linesCleared * 25)); 
            } else {
                player.combo = 0; 
            }
        }

        function updateScore() {
            $('#tetris-score').text(player.score);
            $('#tetris-combo').text(player.combo);
        }

        function updateTetris(time = 0) {
            if (!tetrisActive) return;
            const deltaTime = time - lastTime;
            lastTime = time;
            dropCounter += deltaTime;
            if (dropCounter > dropInterval) playerDrop();
            draw();
            requestID = requestAnimationFrame(updateTetris);
        }

        function openAuthModal() {
            $('#auth-modal').removeClass('hidden').css('display', 'flex').animate({ opacity: 1 }, 10);
            $('#auth-input').val('').removeClass('border-red-500');
            $('#auth-error').addClass('hidden');
            setTimeout(() => { $('#auth-input').focus(); }, 350);
        }

        function verifyAuth() {
            const answer = $('#auth-input').val().trim().toLowerCase();
            
            if (answer.includes('kristine') || answer.includes('sartorio')) {
                closeAuthModal();
                launchRomanticMode();
            } else {
                $('#auth-error').removeClass('hidden');
                $('#auth-input').addClass('border-red-500');
                
                const $modalBox = $('#auth-modal').find('.max-w-md');
                $modalBox.css({ position: 'relative' });
                for (let i = 0; i < 3; i++) {
                    $modalBox.animate({ left: -10 }, 50).animate({ left: 10 }, 50);
                }
                $modalBox.animate({ left: 0 }, 50);
            }
        }

        function launchRomanticMode() {
            $('#romantic-screen').removeClass('hidden').css('display', 'flex').animate({ opacity: 1 }, 50);

            $(document).on('mousemove', spawnHeartOnMove);
            $(document).on('touchmove', spawnHeartOnTouch);

            heartInterval = setInterval(() => {
                spawnHeart(Math.random() * window.innerWidth, window.innerHeight + 20);
            }, 400);

            $('#music-player').attr("src", "https://open.spotify.com/embed/track/6wcjLOGIdmw8BUaRho4c9L?utm_source=generator&autoplay=1");
        }

        function closeRomanticMode() {
            $('#romantic-screen').animate({ opacity: 0 }, 1000, function () {
                $(this).addClass('hidden').hide();
            });

            $(document).off('mousemove', spawnHeartOnMove);
            $(document).off('touchmove', spawnHeartOnTouch);
            clearInterval(heartInterval);
            
            setTimeout(() => { $('#heart-container').empty(); }, 1000);
            setTimeout(() => { $('#music-player').attr("src", ""); }, 1000);
        }

        function spawnHeartOnMove(e) {
            if (Math.random() > 0.85) spawnHeart(e.clientX, e.clientY);
        }

        function spawnHeartOnTouch(e) {
            if (Math.random() > 0.85 && e.touches.length > 0) {
                spawnHeart(e.touches[0].clientX, e.touches[0].clientY);
            }
        }

        function spawnHeart(x, y) {
            const $heart = $('<div>❤️</div>').css({
                position: 'absolute', left: `${x}px`, top: `${y}px`, fontSize: `${Math.random() * 20 + 15}px`,
                pointerEvents: 'none', opacity: 1, transform: 'translate(-50%, -50%) scale(0.5)',
                transition: 'all 2.5s ease-out', zIndex: 0
            });

            $('#heart-container').append($heart);

            setTimeout(() => {
                $heart.css({
                    transform: `translate(-50%, ${-150 - Math.random() * 150}px) scale(${Math.random() * 1.5 + 0.8})`,
                    opacity: 0
                });
            }, 50);

            setTimeout(() => { $heart.remove(); }, 2550);
        }

        $(function () {
            const foundEggs = new Set();
            let hackClock;

            function discoverEgg(eggNumber) {
                if (foundEggs.has(eggNumber)) return;

                foundEggs.add(eggNumber);
                $('#egg-toast-text').text(`[ ${foundEggs.size} / 3 ] SECRETS UNLOCKED`);
                $('#egg-toast').removeClass('-translate-y-32').addClass('translate-y-0');

                setTimeout(() => {
                    $('#egg-toast').removeClass('translate-y-0').addClass('-translate-y-32');
                }, 4000);
            }

            window.closeHackSequence = function() {
                $('#hack-modal').animate({ opacity: 0 }, 300, function () {
                    $(this).addClass('hidden').css('display', 'none');
                    $('#hack-console').empty();
                });
                clearInterval(hackClock);
                hackClock = null;
            }

            function initiateHackSequence() {
                const phrases = [
                    '> INITIATING OVERRIDE PROTOCOL...',
                    '> BYPASSING MAINFRAME FIREWALL...',
                    '> DECRYPTING OPERATIVE DEPLOYMENT HISTORY...',
                    '',
                    'WARNING: UNAUTHORIZED ACCESS DETECTED.',
                    'COUNTERMEASURES BYPASSED.',
                    '',
                    '==================================================',
                    '>>> EASTER EGG FOUND: [ 1 OF 3 ] <<<',
                    'SYSTEM NOTE: Excellent work, Operative.',
                    'Search the portfolio carefully to find the rest.',
                    '==================================================',
                    '',
                    '> CONNECTION STABLE. AWAITING USER INPUT...'
                ];

                discoverEgg(1);
                $('#hack-modal').removeClass('hidden').css('display', 'flex').animate({ opacity: 1 }, 80);
                $('#hack-console').empty();
                $('#close-hack-btn').addClass('hidden');

                let line = 0;
                let character = 0;

                function writeTerminal() {
                    if (line >= phrases.length) {
                        $('#close-hack-btn').removeClass('hidden').addClass('animate-pulse');
                        return;
                    }

                    if (character === 0) {
                        const $line = $('<div>');
                        if (phrases[line].includes('WARNING')) $line.addClass('font-bold text-red-500 animate-pulse');
                        if (phrases[line].includes('EASTER EGG')) $line.addClass('py-2 text-lg font-bold text-cyan-400');
                        if (phrases[line].includes('====')) $line.addClass('text-yellow-400');
                        $('#hack-console').append($line);
                    }

                    const $currentLine = $('#hack-console').children().last();
                    $currentLine.text($currentLine.text() + phrases[line].charAt(character));
                    character += 1;

                    if (character >= phrases[line].length) {
                        character = 0;
                        line += 1;
                        setTimeout(writeTerminal, 120);
                    } else {
                        setTimeout(writeTerminal, 15);
                    }
                }

                setTimeout(writeTerminal, 300);
                clearInterval(hackClock);
                hackClock = setInterval(() => {
                    $('#hack-timer').text(`SYS.TIME: ${new Date().toLocaleTimeString('en-US', { hour12: false })}`);
                }, 1000);
            }

            function initTypingRole() {
                const roles = ['☕ Coffee Lover', '🎮 Gamer', '🎹 Pianist / Oidoist', '🚀 Learning new technologies', '🛠️ Problem Solver', '🔥 Persistent','💡 Practical'];
                const $target = $('#typing-role');
                if (!$target.length) return;

                let role = 0;
                let position = 0;
                let deleting = false;

                function type() {
                    const value = roles[role];
                    position += deleting ? -1 : 1;
                    $target.text(value.slice(0, position));

                    let delay = deleting ? 45 : 85;
                    if (!deleting && position === value.length) {
                        deleting = true;
                        delay = 1800;
                    } else if (deleting && position === 0) {
                        deleting = false;
                        role = (role + 1) % roles.length;
                        delay = 350;
                    }
                    setTimeout(type, delay);
                }

                $target.text('');
                setTimeout(type, 450);
            }

            function initTechCanvas() {
                const canvasElement = document.getElementById('bg-canvas');
                if (!canvasElement || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

                const drawingContext = canvasElement.getContext('2d');
                const dots = [];

                function resize() {
                    canvasElement.width = window.innerWidth;
                    canvasElement.height = window.innerHeight;
                    const count = Math.min(80, Math.max(20, Math.floor((canvasElement.width * canvasElement.height) / 18000)));
                    dots.length = 0;
                    for (let index = 0; index < count; index += 1) {
                        dots.push({ x: Math.random() * canvasElement.width, y: Math.random() * canvasElement.height, xSpeed: (Math.random() - .5) * .2, ySpeed: (Math.random() - .5) * .2, size: Math.random() * 1.5 + .5 });
                    }
                }

                function draw() {
                    drawingContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    drawingContext.fillStyle = 'rgba(250, 204, 21, .2)';
                    drawingContext.strokeStyle = 'rgba(250, 204, 21, .05)';

                    dots.forEach((dot, index) => {
                        dot.x = (dot.x + dot.xSpeed + canvasElement.width) % canvasElement.width;
                        dot.y = (dot.y + dot.ySpeed + canvasElement.height) % canvasElement.height;
                        drawingContext.beginPath();
                        drawingContext.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
                        drawingContext.fill();

                        dots.slice(index + 1).forEach((otherDot) => {
                            const distance = Math.hypot(dot.x - otherDot.x, dot.y - otherDot.y);
                            if (distance < 95) {
                                drawingContext.beginPath();
                                drawingContext.moveTo(dot.x, dot.y);
                                drawingContext.lineTo(otherDot.x, otherDot.y);
                                drawingContext.stroke();
                            }
                        });
                    });
                    requestAnimationFrame(draw);
                }

                resize();
                window.addEventListener('resize', resize);
                draw();
            }

            $('#version-trigger').on('click', () => discoverEgg(2));
            $('#profile-id-tag').on('click', (event) => {
                event.stopPropagation();
                discoverEgg(3);
            });
            $('#classified-trigger').on('click', initiateHackSequence);
            $('#close-hack-btn').on('click', closeHackSequence);
            
            initTypingRole();
            initTechCanvas();
        });