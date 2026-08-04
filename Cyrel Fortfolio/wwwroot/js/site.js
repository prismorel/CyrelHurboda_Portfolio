// ==========================================
// PART 1: GLOBAL VARIABLES
// ==========================================

// --- A. CORE WEBSITE VARIABLES ---
// (Walang global variables na kailangan ang core aside sa element selectors na nasa loob na ng functions)

// --- B. TETRIS VARIABLES ---
let tetrisActive = false;
let heldPiece = null;
let canHold = true;
let arena, player;
let dropCounter = 0, dropInterval = 1000, lastTime = 0, requestID;
const matrixColors = [null, '#facc15', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#f97316', '#06b6d4'];
let canvas, context;
let clickCount = 0, clickTimeout; // Para sa secret name trigger

// --- C. ROMANTIC EASTER EGG VARIABLES ---
let profileClickCount = 0, profileClickTimeout; // Para sa profile trigger
let heartInterval;


// ==========================================
// PART 2: DOCUMENT READY (EVENTS & TRIGGERS)
// ==========================================
$(document).ready(function () {
    
    // ==========================================
    // A. CORE WEBSITE EVENTS
    // ==========================================
    
    runLoadingScreen();
    initScrollReveal();

    // Smooth Scrolling para sa mga Anchor links
    $('a[href^="#"]').on('click', function (e) {
        e.preventDefault();
        const target = $($(this).attr('href'));
        if (target.length) {
            $('html, body').animate({ scrollTop: target.offset().top }, 600);
        }
    });
    // Click outside modal content
    $('#image-modal').on('click', function (e) {
        if (!$(e.target).closest('#image-modal-content').length) {
            closeImageModal();
        }
    });
    // Back to Top Button Visibility
    const $backToTop = $("#backToTop");
    $(window).on("scroll", function () {
        if ($(this).scrollTop() > 400) {
            if ($backToTop.hasClass('hidden')) {
                $backToTop.removeClass("hidden").animate({ opacity: 1 }, 300);
            }
        } else {
            if (!$backToTop.hasClass('hidden')) {
                $backToTop.animate({ opacity: 0 }, 300, function () {
                    $(this).addClass("hidden");
                });
            }
        }
    });

    // Back to Top Click
    $backToTop.on("click", function () {
        $('html, body').animate({ scrollTop: 0 }, 600);
    });

    // Global Keydown (Para isara ang mga Modals gamit ang ESC)
    $(document).on('keydown', function (event) {
        if (event.key === "Escape") {
            if (!$('#image-modal').hasClass('hidden')) closeImageModal();
            if (!$('#tetris-modal').hasClass('hidden')) closeTetris();
            if (!$('#auth-modal').hasClass('hidden')) closeAuthModal();
        }
    });


    // ==========================================
    // B. TETRIS EVENTS
    // ==========================================
    
    // Initialize Canvas Context
    canvas = document.getElementById('tetris');
    if (canvas) {
        context = canvas.getContext('2d');
        context.scale(30, 30);
    }

    // Trigger para mabuksan ang Tetris (Triple click sa name)
    $('#secret-name').on('click', function () {
        clickCount++;
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => { clickCount = 0; }, 600);

        if (clickCount >= 3) {
            clickCount = 0;
            startTetris();
        }
    });

    // Tetris Keyboard Controls
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

    // Tetris UI Buttons
    $('#tetris-reboot-btn').on('click', tetrisStartGame);
    $('#btn-left').on('click', () => { if (tetrisActive) playerMove(-1); });
    $('#btn-right').on('click', () => { if (tetrisActive) playerMove(1); });
    $('#btn-down').on('click', () => { if (tetrisActive) playerDrop(); });
    $('#btn-rotate').on('click', () => { if (tetrisActive) playerRotate(1); });
    $('#btn-harddrop').on('click', () => { if (tetrisActive) playerHardDrop(); });
    $('#btn-hold').on('click', () => { if (tetrisActive) holdPieceAction(); });

    // Open Site DLDash Website
    $('#button-DLDashAccessWebsite').on('click', function () {
        window.open('https://dldash.divinalaw.com/version-test/login', '_blank');
    });
    // ==========================================
    // C. ROMANTIC EASTER EGG EVENTS
    // ==========================================
    
    // Trigger para sa Romantic Mode (Triple click sa profile picture)
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

    // Auth Submit & Enter Key
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

// ==========================================
// A. CORE WEBSITE FUNCTIONS
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

function openImageModal(imgSrc) {
    $('#modal-image').attr('src', imgSrc);
    $('#image-modal').removeClass('hidden').css('display', 'flex').animate({ opacity: 1 }, 10);
    $('body').css('overflow', 'hidden');
}

function closeImageModal() {
    $('#image-modal').animate({ opacity: 0 }, 300, function () {
        $(this).addClass('hidden').css('display', 'none');
        $('body').css('overflow', 'auto');
    });
}


// ==========================================
// B. TETRIS FUNCTIONS
// ==========================================

function startTetris() {
    $('#tetris-modal').removeClass('hidden').css('display', 'flex').animate({ opacity: 1 }, 10);
    $('body').css('overflow', 'hidden');
    tetrisActive = true;
    
    arena = createMatrix(12, 20);
    player = { pos: { x: 0, y: 0 }, matrix: null, type: null, score: 0, combo: 0 };
    
    tetrisStartGame();
}

function closeTetris() {
    $('#tetris-modal').animate({ opacity: 0 }, 300, function () {
        $(this).addClass('hidden').css('display', 'none');
        $('body').css('overflow', 'auto');
        tetrisActive = false;
    });
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


// ==========================================
// C. ROMANTIC EASTER EGG FUNCTIONS
// ==========================================

function openAuthModal() {
    $('#auth-modal').removeClass('hidden').css('display', 'flex').animate({ opacity: 1 }, 10);
    $('#auth-input').val('').removeClass('border-red-500');
    $('#auth-error').addClass('hidden');
    setTimeout(() => { $('#auth-input').focus(); }, 350);
}

function closeAuthModal() {
    $('#auth-modal').animate({ opacity: 0 }, 300, function () {
        $(this).addClass('hidden').hide();
    });
}

function verifyAuth() {
    const answer = $('#auth-input').val().trim().toLowerCase();
    
    if (answer.includes('kristine') || answer.includes('sartorio')) {
        closeAuthModal();
        launchRomanticMode();
    } else {
        $('#auth-error').removeClass('hidden');
        $('#auth-input').addClass('border-red-500');
        
        // Shake Effect
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