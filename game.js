// ============================================================
// VIXER - Planet Defense Game (JavaScript Version)
// Converted from C++ Raylib code
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ============================================================
// Constants
// ============================================================
const SCREEN_WIDTH = 1200;
const SCREEN_HEIGHT = 700;
const MAX_ENERGY = 1000;
const ASTEROID_ENERGY = 0.5;
const SPECIAL_ASTEROID_ENERGY = 5;
const ASTEROID_SPAWN_TIME = 12;
const BLACK_HOLE_TIME = 120; // 120 sec testing (720 = 12 min)
const BLACK_HOLE_WARNING_TIME = 30;
const MIN_ZOOM = 1.0;
const GALAXY_ZOOM = 5.0;
const ZOOM_SPEED = 2.0;
const BLACK_HOLE_GALAXY_SIZE = 150;
const BLACK_HOLE_DISTANCE = 3000;
const MAX_UPGRADE_LEVEL = 5;

// ============================================================
// Game State Variables
// ============================================================
let state = 'PLAYING'; // PLAYING, BLACK_HOLE_ATTACK, BLACK_HOLE_BATTLE, GAME_OVER, SURVIVED
let gameTime = 0;
let asteroidTimer = 0;
let blackHoleTimer = 0;
let messageTimer = 0;
let message = '';
let messageColor = '#FFFFFF';
let screenShake = 0;
let shakeIntensity = 0;
let shakeOffsetX = 0;
let shakeOffsetY = 0;
let combo = 0;
let comboTimer = 0;
let shieldVisual = 0;

// Zoom
let zoomLevel = MIN_ZOOM;
let targetZoom = MIN_ZOOM;
let isZoomedOut = false;
let zoomTransition = 0;

// Vixer
let vixer = {
    orbitRadius: 250,
    orbitSpeed: 0.015,
    angle: 0,
    size: 25,
    color: '#0088FF',
    name: 'Vixer',
    isVixer: true,
    level: 1,
    x: 0,
    y: 0
};

// Upgrades
let upgrades = {
    gravity: 0,
    magneticField: 0,
    resistance: 0
};

// Sun
const sunX = SCREEN_WIDTH / 2;
const sunY = SCREEN_HEIGHT / 2;
let sunSize = 60;
let sunPulse = 0;

// Planets
let planets = [];

// Black Hole
let blackHole = {
    active: false,
    attacking: false,
    size: 40,
    power: 5,
    attackTimer: 0,
    pulseTimer: 0,
    galaxySize: BLACK_HOLE_GALAXY_SIZE,
    galaxyX: SCREEN_WIDTH * 0.75,
    galaxyY: SCREEN_HEIGHT * 0.2,
    distanceFromVixer: BLACK_HOLE_DISTANCE,
    x: SCREEN_WIDTH / 2,
    y: -100
};

// Arrays
let asteroids = [];
let particles = [];
let floatingTexts = [];

// Stats
let blackHolesSurvived = 0;
let totalAsteroidsCollected = 0;
let specialAsteroidsCollected = 0;
let totalEnergyCollected = 0;

// Background image
let galaxyBackground = null;
let bgImageLoaded = false;

// ============================================================
// Assets Loading
// ============================================================
function loadAssets() {
    // Try to load background image
    let img = new Image();
    img.onload = function() {
        galaxyBackground = img;
        bgImageLoaded = true;
        console.log('galaxy_bg.png loaded');
    };
    img.onerror = function() {
        console.log('galaxy_bg.png not found - using procedural background');
    };
    img.src = 'galaxy_bg.png';
}

// ============================================================
// Initialize
// ============================================================
function initialize() {
    state = 'PLAYING';
    gameTime = 0;
    asteroidTimer = 0;
    blackHoleTimer = 0;
    messageTimer = 0;
    energy = 0;
    screenShake = 0;
    shakeIntensity = 0;
    shakeOffsetX = 0;
    shakeOffsetY = 0;
    combo = 0;
    comboTimer = 0;
    shieldVisual = 0;
    
    zoomLevel = MIN_ZOOM;
    targetZoom = MIN_ZOOM;
    isZoomedOut = false;
    zoomTransition = 0;
    
    vixer.angle = 0;
    vixer.level = 1;
    vixer.size = 25;
    
    upgrades.gravity = 0;
    upgrades.magneticField = 0;
    upgrades.resistance = 0;
    
    sunPulse = 0;
    
    // Create planets
    planets = [
        { orbitRadius: 120, orbitSpeed: 0.03, angle: 45, size: 15, color: '#FF4444', name: 'Pyro', x: 0, y: 0 },
        { orbitRadius: 380, orbitSpeed: 0.01, angle: 180, size: 20, color: '#FF8844', name: 'Terra', x: 0, y: 0 },
        { orbitRadius: 500, orbitSpeed: 0.007, angle: 270, size: 18, color: '#AA44FF', name: 'Nova', x: 0, y: 0 }
    ];
    
    blackHole.active = false;
    blackHole.attacking = false;
    blackHole.size = 40;
    blackHole.power = 5;
    blackHole.attackTimer = 0;
    blackHole.pulseTimer = 0;
    blackHole.x = SCREEN_WIDTH / 2;
    blackHole.y = -100;
    
    blackHolesSurvived = 0;
    totalAsteroidsCollected = 0;
    specialAsteroidsCollected = 0;
    totalEnergyCollected = 0;
    
    asteroids = [];
    particles = [];
    floatingTexts = [];
    
    updatePlanets();
    showMessage('Press [-] to see galaxy view!', '#00FF00');
}

// ============================================================
// Zoom Functions
// ============================================================
function updateZoom(dt) {
    if (zoomLevel < targetZoom) {
        zoomLevel += ZOOM_SPEED * dt;
        if (zoomLevel > targetZoom) zoomLevel = targetZoom;
    } else if (zoomLevel > targetZoom) {
        zoomLevel -= ZOOM_SPEED * dt;
        if (zoomLevel < targetZoom) zoomLevel = targetZoom;
    }
    
    zoomTransition = (zoomLevel - MIN_ZOOM) / (GALAXY_ZOOM - MIN_ZOOM);
    zoomTransition = Math.max(0, Math.min(1, zoomTransition));
}

function handleZoomInput(event) {
    if (event.key === '-' || event.key === '_') {
        if (!isZoomedOut) {
            isZoomedOut = true;
            targetZoom = GALAXY_ZOOM;
            showMessage('GALAXY VIEW - Black Hole Approaching!', '#FF0000');
            screenShake = 0.5;
            shakeIntensity = 5;
        }
    }
    if (event.key === '=' || event.key === '+') {
        if (isZoomedOut) {
            isZoomedOut = false;
            targetZoom = MIN_ZOOM;
            showMessage('NORMAL VIEW', '#00FF00');
        }
    }
    if (event.key === 'r' || event.key === 'R') {
        if (state === 'GAME_OVER') {
            initialize();
        }
    }
}

function worldToScreen(worldX, worldY) {
    return {
        x: SCREEN_WIDTH/2 + (worldX - SCREEN_WIDTH/2) * zoomLevel + shakeOffsetX,
        y: SCREEN_HEIGHT/2 + (worldY - SCREEN_HEIGHT/2) * zoomLevel + shakeOffsetY
    };
}

function screenToWorld(screenX, screenY) {
    return {
        x: SCREEN_WIDTH/2 + (screenX - shakeOffsetX - SCREEN_WIDTH/2) / zoomLevel,
        y: SCREEN_HEIGHT/2 + (screenY - shakeOffsetY - SCREEN_HEIGHT/2) / zoomLevel
    };
}

// ============================================================
// Update Functions
// ============================================================
function updatePlanets() {
    vixer.angle += vixer.orbitSpeed;
    vixer.x = sunX + Math.cos(vixer.angle) * vixer.orbitRadius;
    vixer.y = sunY + Math.sin(vixer.angle) * vixer.orbitRadius;
    
    planets.forEach(planet => {
        planet.angle += planet.orbitSpeed;
        planet.x = sunX + Math.cos(planet.angle) * planet.orbitRadius;
        planet.y = sunY + Math.sin(planet.angle) * planet.orbitRadius;
    });
}

function spawnAsteroid() {
    let isSpecial = Math.random() < 0.05;
    let ast = {
        active: true,
        isSpecial: isSpecial,
        energy: isSpecial ? SPECIAL_ASTEROID_ENERGY : ASTEROID_ENERGY,
        size: isSpecial ? 12 : 8,
        color: isSpecial ? '#FFD700' : '#888888',
        rotation: 0,
        rotationSpeed: Math.random() * 2 - 1,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0
    };
    
    let side = Math.floor(Math.random() * 4);
    switch(side) {
        case 0: // Top
            ast.x = Math.random() * SCREEN_WIDTH;
            ast.y = -20;
            ast.vx = Math.random() * 100 - 50;
            ast.vy = Math.random() * 50 + 30;
            break;
        case 1: // Bottom
            ast.x = Math.random() * SCREEN_WIDTH;
            ast.y = SCREEN_HEIGHT + 20;
            ast.vx = Math.random() * 100 - 50;
            ast.vy = -(Math.random() * 50 + 30);
            break;
        case 2: // Left
            ast.x = -20;
            ast.y = Math.random() * SCREEN_HEIGHT;
            ast.vx = Math.random() * 50 + 30;
            ast.vy = Math.random() * 100 - 50;
            break;
        case 3: // Right
            ast.x = SCREEN_WIDTH + 20;
            ast.y = Math.random() * SCREEN_HEIGHT;
            ast.vx = -(Math.random() * 50 + 30);
            ast.vy = Math.random() * 100 - 50;
            break;
    }
    
    asteroids.push(ast);
}

function updateAsteroids(dt) {
    asteroids.forEach(ast => {
        if (!ast.active) return;
        ast.x += ast.vx * dt;
        ast.y += ast.vy * dt;
        ast.rotation += ast.rotationSpeed * dt;
        
        if (ast.x < -50 || ast.x > SCREEN_WIDTH + 50 ||
            ast.y < -50 || ast.y > SCREEN_HEIGHT + 50) {
            ast.active = false;
        }
    });
    
    asteroids = asteroids.filter(ast => ast.active);
}

function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: Math.random() * 200 - 100,
            vy: Math.random() * 200 - 100,
            life: Math.random() * 0.5 + 0.5,
            maxLife: 1,
            color: color,
            size: Math.random() * 5 + 2
        });
    }
}

function spawnFloatingText(x, y, text, color) {
    floatingTexts.push({
        x: x,
        y: y,
        text: text,
        life: 1.5,
        color: color
    });
}

function showMessage(msg, color) {
    message = msg;
    messageColor = color;
    messageTimer = 2.0;
}

function getTotalDefense() {
    return (upgrades.gravity + upgrades.magneticField + upgrades.resistance) * 2;
}

function processUpgrade(type) {
    let totalUpgrades = upgrades.gravity + upgrades.magneticField + upgrades.resistance;
    let cost = 10 * (1 + Math.floor(totalUpgrades / 2));
    
    let level = null;
    let upName = '';
    let themeColor = '#FFFFFF';
    
    if (type === 'gravity') {
        level = 'gravity';
        upName = 'GRAVITY';
        themeColor = '#0088FF';
    } else if (type === 'magnetic') {
        level = 'magneticField';
        upName = 'MAGNETIC';
        themeColor = '#00CCFF';
    } else if (type === 'resistance') {
        level = 'resistance';
        upName = 'RESISTANCE';
        themeColor = '#00FF00';
    }
    
    if (upgrades[level] >= MAX_UPGRADE_LEVEL) {
        showMessage(upName + ' already maxed!', '#888888');
        return;
    }
    
    if (energy < cost) {
        showMessage('Need more energy!', '#FF0000');
        return;
    }
    
    energy -= cost;
    upgrades[level]++;
    spawnParticles(vixer.x, vixer.y, themeColor, 20);
    spawnFloatingText(vixer.x, vixer.y, upName + ' UP!', themeColor);
    showMessage(upName + ' Upgraded!', themeColor);
}

function triggerBlackHole() {
    state = 'BLACK_HOLE_ATTACK';
    blackHole.active = true;
    blackHole.attacking = true;
    blackHole.attackTimer = 0;
    blackHole.x = SCREEN_WIDTH / 2;
    blackHole.y = -100;
    blackHole.power = 5 + (blackHolesSurvived * 3);
    
    screenShake = 1.0;
    shakeIntensity = 10;
    
    showMessage('WARNING: BLACK HOLE DETECTED!', '#FF0000');
}

function updateBlackHole(dt) {
    blackHole.attackTimer += dt;
    blackHole.pulseTimer += dt * 3;
    
    let dx = vixer.x - blackHole.x;
    let dy = vixer.y - blackHole.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 1) {
        let speed = 80;
        blackHole.x += (dx / distance) * speed * dt;
        blackHole.y += (dy / distance) * speed * dt;
    }
    
    if (Math.random() < 0.2) {
        spawnParticles(blackHole.x, blackHole.y, '#AA00FF', 2);
    }
    
    if (distance < blackHole.size + vixer.size + 30) {
        state = 'BLACK_HOLE_BATTLE';
        blackHole.attackTimer = 0;
        showMessage('BATTLE BEGIN!', '#FF0000');
    }
}

function updateBattle(dt) {
    blackHole.attackTimer += dt;
    blackHole.pulseTimer += dt * 5;
    
    screenShake = 0.5;
    shakeIntensity = 15;
    
    if (Math.random() < 0.33) {
        let bx = vixer.x + (Math.random() * 100 - 50);
        let by = vixer.y + (Math.random() * 100 - 50);
        spawnParticles(bx, by, '#0088FF', 5);
    }
    
    if (Math.random() < 0.33) {
        let bx = blackHole.x + (Math.random() * 60 - 30);
        let by = blackHole.y + (Math.random() * 60 - 30);
        spawnParticles(bx, by, '#AA00FF', 3);
    }
    
    if (blackHole.attackTimer >= 5.0) {
        let totalDefense = getTotalDefense();
        
        if (totalDefense >= blackHole.power) {
            blackHolesSurvived++;
            vixer.level++;
            state = 'SURVIVED';
            blackHole.active = false;
            blackHole.attacking = false;
            messageTimer = 3.0;
            shieldVisual = 2.0;
            spawnParticles(vixer.x, vixer.y, '#00FF00', 50);
            showMessage('VICTORY! Vixer Survived!', '#00FF00');
        } else {
            state = 'GAME_OVER';
            spawnParticles(vixer.x, vixer.y, '#FF0000', 100);
            screenShake = 2.0;
            shakeIntensity = 20;
            showMessage('VIXER DESTROYED!', '#FF0000');
        }
    }
}

function resetAfterSurvival() {
    state = 'PLAYING';
    energy = 0;
    upgrades.gravity = 0;
    upgrades.magneticField = 0;
    upgrades.resistance = 0;
    blackHoleTimer = 0;
    combo = 0;
    showMessage('Rebuild your defenses for next attack!', '#FFFF00');
}

// ============================================================
// Main Update
// ============================================================
function update(dt) {
    if (state === 'GAME_OVER') return;
    
    gameTime += dt;
    updateZoom(dt);
    
    if (messageTimer > 0) messageTimer -= dt;
    if (comboTimer > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) combo = 0;
    }
    if (screenShake > 0) screenShake -= dt;
    
    sunPulse += dt * 2;
    if (shieldVisual > 0) shieldVisual -= dt;
    
    updateParticles(dt);
    updateFloatingTexts(dt);
    
    if (state === 'PLAYING') {
        updatePlanets();
        
        asteroidTimer += dt;
        if (asteroidTimer >= ASTEROID_SPAWN_TIME) {
            spawnAsteroid();
            asteroidTimer = 0;
        }
        
        updateAsteroids(dt);
        
        blackHoleTimer += dt;
        if (blackHoleTimer >= BLACK_HOLE_TIME) {
            triggerBlackHole();
            blackHoleTimer = 0;
        }
    } else if (state === 'BLACK_HOLE_ATTACK') {
        updateBlackHole(dt);
    } else if (state === 'BLACK_HOLE_BATTLE') {
        updateBattle(dt);
    } else if (state === 'SURVIVED') {
        if (messageTimer <= 0) {
            resetAfterSurvival();
        }
    }
}

function updateParticles(dt) {
    particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.life -= dt;
    });
    particles = particles.filter(p => p.life > 0);
}

function updateFloatingTexts(dt) {
    floatingTexts.forEach(ft => {
        ft.y -= 50 * dt;
        ft.life -= dt;
    });
    floatingTexts = floatingTexts.filter(ft => ft.life > 0);
}

// ============================================================
// Draw Functions
// ============================================================
function drawBackground() {
    if (bgImageLoaded && galaxyBackground) {
        ctx.drawImage(galaxyBackground, 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        ctx.fillStyle = 'rgba(0, 0, 10, 0.35)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    } else {
        ctx.fillStyle = '#050514';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }
    
    // Twinkling stars
    for (let i = 0; i < 150; i++) {
        let x = (i * 137) % SCREEN_WIDTH;
        let y = (i * 251) % SCREEN_HEIGHT;
        let twinkle = (Math.sin(gameTime * 3 + i) + 1) / 2;
        let alpha = bgImageLoaded ? 0.2 + twinkle * 0.4 : 0.4 + twinkle * 0.6;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(x, y, 1.5, 1.5);
    }
}

function drawGalaxyMap() {
    if (zoomTransition <= 0.01) return;
    
    let overlayAlpha = Math.floor(200 * zoomTransition);
    ctx.fillStyle = `rgba(0, 0, 20, ${overlayAlpha/255})`;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    if (zoomTransition < 0.5) return;
    
    ctx.fillStyle = '#AA44FF';
    ctx.font = 'bold 35px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DEEP SPACE GALAXY VIEW', SCREEN_WIDTH/2, 35);
    
    // Distant galaxies
    for (let i = 0; i < 50; i++) {
        let x = (i * 277) % SCREEN_WIDTH;
        let y = (i * 173) % SCREEN_HEIGHT;
        ctx.fillStyle = 'rgba(100, 100, 150, 0.6)';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Our galaxy
    let miniSunX = sunX * 0.3;
    let miniSunY = sunY * 0.3;
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(miniSunX, miniSunY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('OUR GALAXY', miniSunX, miniSunY - 30);
    
    // Massive black hole
    let bhX = blackHole.galaxyX;
    let bhY = blackHole.galaxyY;
    let bhSize = blackHole.galaxySize;
    
    // Glow
    ctx.fillStyle = 'rgba(50, 0, 50, 0.2)';
    ctx.beginPath();
    ctx.arc(bhX, bhY, bhSize + 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(100, 0, 100, 0.4)';
    ctx.beginPath();
    ctx.arc(bhX, bhY, bhSize + 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Main
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(bhX, bhY, bhSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#AA00FF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(bhX, bhY, bhSize + 10, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = '#CC00CC';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(bhX, bhY, bhSize + 5, 0, Math.PI * 2);
    ctx.stroke();
    
    // Accretion disk
    ctx.strokeStyle = 'rgba(255, 100, 0, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(bhX, bhY, bhSize * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 25px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MASSIVE BLACK HOLE', bhX, bhY - bhSize - 35);
    ctx.fillStyle = '#AA44FF';
    ctx.font = '18px Arial';
    ctx.fillText('ANOTHER GALAXY', bhX, bhY - bhSize - 10);
    
    // Distance
    ctx.fillStyle = '#FFFF00';
    ctx.font = '22px Arial';
    ctx.fillText(`DISTANCE: ${Math.floor(blackHole.distanceFromVixer)} LIGHT YEARS`, SCREEN_WIDTH/2, SCREEN_HEIGHT - 100);
    
    // Warning
    let pulse = Math.sin(gameTime * 5) * 0.5 + 0.5;
    ctx.fillStyle = `rgb(255, ${Math.floor(100 + pulse * 155)}, 0)`;
    ctx.font = 'bold 30px Arial';
    ctx.fillText('! WARNING !', SCREEN_WIDTH/2, SCREEN_HEIGHT - 150);
    
    // Path line
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(miniSunX, miniSunY);
    ctx.lineTo(bhX, bhY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Animated particles along path
    for (let i = 0; i < 5; i++) {
        let t = (gameTime * 0.5 + i * 0.2) % 1;
        let px = miniSunX + (bhX - miniSunX) * t;
        let py = miniSunY + (bhY - miniSunY) * t;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawUI() {
    // Energy bar
    ctx.fillStyle = 'rgba(30, 30, 30, 0.8)';
    roundRect(ctx, 20, 20, 300, 30, 8, true, false);
    let energyPercent = Math.max(0, Math.min(1, energy / MAX_ENERGY));
    ctx.fillStyle = `rgb(255, ${Math.floor(255 * (1 - energyPercent))}, 0)`;
    if (energyPercent > 0) {
        roundRect(ctx, 20, 20, energyPercent * 300, 30, 8, true, false);
    }
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    roundRect(ctx, 20, 20, 300, 30, 8, false, true);
    ctx.fillStyle = 'black';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`ENERGY: ${energy.toFixed(1)} / ${MAX_ENERGY}`, 28, 40);
    
    // Upgrade buttons
    let totalUpgrades = upgrades.gravity + upgrades.magneticField + upgrades.resistance;
    let cost = 10 * (1 + Math.floor(totalUpgrades / 2));
    
    drawUpgradeButton(20, 70, 210, 42, 'GRAVITY', upgrades.gravity, cost, '#0088FF');
    drawUpgradeButton(20, 120, 210, 42, 'MAGNETIC', upgrades.magneticField, cost, '#00CCFF');
    drawUpgradeButton(20, 170, 210, 42, 'RESISTANCE', upgrades.resistance, cost, '#00FF00');
    
    // Zoom controls
    ctx.fillStyle = 'rgba(30, 30, 50, 0.8)';
    roundRect(ctx, SCREEN_WIDTH - 250, SCREEN_HEIGHT - 80, 230, 60, 6, true, false);
    ctx.strokeStyle = 'rgba(90, 90, 130, 1)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, SCREEN_WIDTH - 250, SCREEN_HEIGHT - 80, 230, 60, 6, false, true);
    ctx.fillStyle = 'white';
    ctx.font = '15px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('ZOOM CONTROLS:', SCREEN_WIDTH - 240, SCREEN_HEIGHT - 70);
    ctx.fillStyle = isZoomedOut ? '#00FF00' : 'white';
    ctx.fillText('[-] Galaxy View', SCREEN_WIDTH - 240, SCREEN_HEIGHT - 50);
    ctx.fillStyle = !isZoomedOut ? '#00FF00' : 'white';
    ctx.fillText('[+] Normal View', SCREEN_WIDTH - 240, SCREEN_HEIGHT - 30);
    
    // Stats panel
    ctx.fillStyle = 'rgba(30, 30, 50, 0.8)';
    roundRect(ctx, SCREEN_WIDTH - 200, 20, 180, 120, 6, true, false);
    ctx.strokeStyle = 'rgba(90, 90, 130, 1)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, SCREEN_WIDTH - 200, 20, 180, 120, 6, false, true);
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`LEVEL: ${vixer.level}`, SCREEN_WIDTH - 190, 35);
    ctx.fillText(`SURVIVED: ${blackHolesSurvived}`, SCREEN_WIDTH - 190, 55);
    ctx.fillText(`DEFENSE: ${getTotalDefense()}`, SCREEN_WIDTH - 190, 75);
    ctx.fillStyle = combo > 1 ? '#FF8800' : 'white';
    ctx.fillText(`COMBO: x${combo}`, SCREEN_WIDTH - 190, 95);
    
    // Black hole countdown
    if (state === 'PLAYING') {
        let timeLeft = Math.max(0, BLACK_HOLE_TIME - blackHoleTimer);
        if (timeLeft < BLACK_HOLE_WARNING_TIME) {
            let pulse = Math.sin(gameTime * 8) * 0.5 + 0.5;
            ctx.fillStyle = `rgb(255, ${Math.floor(60 + pulse * 60)}, ${Math.floor(60 + pulse * 60)})`;
        } else {
            ctx.fillStyle = '#FF0000';
        }
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`BLACK HOLE IN: ${Math.floor(timeLeft)} sec`, SCREEN_WIDTH/2, 25);
    }
    
    // Message
    if (messageTimer > 0) {
        let alpha = Math.max(0, Math.min(1, messageTimer / 0.5));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = messageColor;
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 50);
        ctx.globalAlpha = 1;
    }
    
    // Battle indicator
    if (state === 'BLACK_HOLE_BATTLE') {
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BATTLE IN PROGRESS!', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 50);
        
        ctx.fillStyle = '#333333';
        roundRect(ctx, SCREEN_WIDTH/2 - 100, SCREEN_HEIGHT/2 + 100, 200, 20, 6, true, false);
        let battleProgress = Math.max(0, Math.min(1, blackHole.attackTimer / 5));
        if (battleProgress > 0) {
            ctx.fillStyle = '#FF0000';
            roundRect(ctx, SCREEN_WIDTH/2 - 100, SCREEN_HEIGHT/2 + 100, 200 * battleProgress, 20, 6, true, false);
        }
    }
    
    // Game over
    if (state === 'GAME_OVER') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 - 50);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('Vixer was destroyed by the black hole!', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 20);
        ctx.fillText(`You survived ${blackHolesSurvived} black holes`, SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 50);
        ctx.fillText(`Total energy collected: ${totalEnergyCollected.toFixed(1)}`, SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 80);
        ctx.fillStyle = '#00FF00';
        ctx.fillText('Press [R] to Restart', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 115);
        ctx.fillStyle = 'white';
        ctx.fillText('Press [ESC] to Exit', SCREEN_WIDTH/2, SCREEN_HEIGHT/2 + 140);
    }
}

function drawUpgradeButton(x, y, w, h, label, level, cost, themeColor) {
    let maxed = level >= MAX_UPGRADE_LEVEL;
    let canAfford = energy >= cost;
    let hovering = !maxed && isMouseOver(x, y, w, h);
    
    // Background
    if (maxed) {
        ctx.fillStyle = 'rgba(35, 35, 40, 0.82)';
    } else if (hovering) {
        let alpha = canAfford ? 0.35 : 0.18;
        ctx.fillStyle = hexToRgba(themeColor, alpha);
    } else {
        ctx.fillStyle = 'rgba(50, 50, 70, 0.78)';
    }
    roundRect(ctx, x, y, w, h, 8, true, false);
    
    // Border
    ctx.strokeStyle = maxed ? '#5A5A5A' : themeColor;
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 8, false, true);
    
    // Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 10, y + 20);
    
    ctx.fillStyle = '#CCCCCC';
    ctx.font = '13px Arial';
    ctx.fillText(`Lv.${level}/${MAX_UPGRADE_LEVEL}`, x + 118, y + 21);
    
    if (maxed) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 13px Arial';
        ctx.fillText('MAXED OUT', x + 10, y + 38);
    } else {
        ctx.fillStyle = canAfford ? '#78FF78' : '#FF6E6E';
        ctx.font = '13px Arial';
        ctx.fillText(`Cost: ${cost} E`, x + 10, y + 38);
    }
    
    // Level pips
    for (let i = 0; i < MAX_UPGRADE_LEVEL; i++) {
        ctx.fillStyle = i < level ? themeColor : '#464650';
        ctx.fillRect(x + 118 + i * 14, y + 30, 10, 8);
    }
}

function roundRect(ctx, x, y, w, h, r, doFill, doStroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (doFill) ctx.fill();
    if (doStroke) ctx.stroke();
}

function hexToRgba(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================================
// Mouse Input
// ============================================================
let mouseX = 0, mouseY = 0;

function isMouseOver(x, y, w, h) {
    return mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
}

canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
});

canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clickX = (e.clientX - rect.left) * scaleX;
    let clickY = (e.clientY - rect.top) * scaleY;
    
    // Upgrade buttons
    if (clickX >= 20 && clickX <= 230) {
        if (clickY >= 70 && clickY <= 112) {
            processUpgrade('gravity');
            return;
        }
        if (clickY >= 120 && clickY <= 162) {
            processUpgrade('magnetic');
            return;
        }
        if (clickY >= 170 && clickY <= 212) {
            processUpgrade('resistance');
            return;
        }
    }
    
    // Asteroid clicks (only in normal view)
    if (!isZoomedOut && state === 'PLAYING') {
        let worldPos = screenToWorld(clickX, clickY);
        
        for (let ast of asteroids) {
            if (!ast.active) continue;
            
            let dx = worldPos.x - ast.x;
            let dy = worldPos.y - ast.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < ast.size * zoomLevel + 15) {
                let bonusMultiplier = 1 + combo * 0.1;
                let requestedEnergy = ast.energy * bonusMultiplier;
                let actualEnergy = Math.min(requestedEnergy, MAX_ENERGY - energy);
                
                if (actualEnergy > 0.001) {
                    energy += actualEnergy;
                    totalAsteroidsCollected++;
                    totalEnergyCollected += actualEnergy;
                    combo++;
                    comboTimer = 3.0;
                    
                    spawnParticles(ast.x, ast.y, ast.color, 15);
                    
                    if (ast.isSpecial) {
                        specialAsteroidsCollected++;
                        spawnFloatingText(ast.x, ast.y, '+5 ENERGY!', '#FFD700');
                        showMessage('SPECIAL ASTEROID COLLECTED!', '#FFD700');
                        screenShake = 0.3;
                        shakeIntensity = 5;
                    } else {
                        spawnFloatingText(ast.x, ast.y, `+${actualEnergy.toFixed(1)}`, '#00FF00');
                        if (combo > 1) {
                            spawnFloatingText(ast.x, ast.y - 20, `COMBO x${combo}!`, '#FF8800');
                        }
                    }
                } else {
                    spawnFloatingText(ast.x, ast.y, 'ENERGY FULL!', '#FF0000');
                }
                
                ast.active = false;
                break;
            }
        }
    }
});

// ============================================================
// Keyboard Input
// ============================================================
document.addEventListener('keydown', function(e) {
    handleZoomInput(e);
    
    if (e.key === 'Escape') {
        // Can't close browser tab, but can restart
        if (state === 'GAME_OVER') {
            initialize();
        }
    }
});

// ============================================================
// Main Draw Function
// ============================================================
function draw() {
    // Compute shake offset
    shakeOffsetX = 0;
    shakeOffsetY = 0;
    if (screenShake > 0) {
        let range = Math.max(1, Math.floor(shakeIntensity * 2));
        shakeOffsetX = Math.floor(Math.random() * range) - shakeIntensity;
        shakeOffsetY = Math.floor(Math.random() * range) - shakeIntensity;
    }
    
    ctx.save();
    
    drawBackground();
    
    // Orbit paths
    let sunScreen = worldToScreen(sunX, sunY);
    ctx.strokeStyle = 'rgba(40, 40, 60, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sunScreen.x, sunScreen.y, vixer.orbitRadius * zoomLevel, 0, Math.PI * 2);
    ctx.stroke();
    
    planets.forEach(planet => {
        ctx.beginPath();
        ctx.arc(sunScreen.x, sunScreen.y, planet.orbitRadius * zoomLevel, 0, Math.PI * 2);
        ctx.stroke();
    });
    
    // Sun
    let sunPulseSize = (sunSize + Math.sin(sunPulse) * 5) * zoomLevel;
    ctx.fillStyle = 'rgba(255, 200, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(sunScreen.x, sunScreen.y, sunPulseSize + 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 150, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(sunScreen.x, sunScreen.y, sunPulseSize + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(sunScreen.x, sunScreen.y, sunPulseSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFC8';
    ctx.beginPath();
    ctx.arc(sunScreen.x, sunScreen.y, sunPulseSize * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // Planets
    planets.forEach(planet => {
        let pScreen = worldToScreen(planet.x, planet.y);
        let pSize = planet.size * zoomLevel;
        ctx.fillStyle = planet.color;
        ctx.beginPath();
        ctx.arc(pScreen.x, pScreen.y, pSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(planet.name, pScreen.x, pScreen.y + pSize + 12);
    });
    
    // Vixer
    let vScreen = worldToScreen(vixer.x, vixer.y);
    let vSize = vixer.size * zoomLevel;
    if (shieldVisual > 0) {
        let shieldSize = vSize + 15 + Math.sin(gameTime * 5) * 5;
        ctx.strokeStyle = 'rgba(100, 255, 100, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(vScreen.x, vScreen.y, shieldSize, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.fillStyle = vixer.color;
    ctx.beginPath();
    ctx.arc(vScreen.x, vScreen.y, vSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(vScreen.x, vScreen.y, vSize + 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 15px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VIXER', vScreen.x, vScreen.y + vSize + 18);
    
    // Asteroids
    asteroids.forEach(ast => {
        if (!ast.active) return;
        let aScreen = worldToScreen(ast.x, ast.y);
        let aSize = ast.size * zoomLevel;
        
        ctx.save();
        ctx.translate(aScreen.x, aScreen.y);
        ctx.rotate(ast.rotation);
        ctx.fillStyle = ast.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            let angle = (i / 6) * Math.PI * 2;
            let x = Math.cos(angle) * aSize;
            let y = Math.sin(angle) * aSize;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        if (ast.isSpecial) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(aScreen.x, aScreen.y, aSize + 8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(aScreen.x, aScreen.y, aSize + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
    
    // Black hole (attack phase)
    if (blackHole.active) {
        let bScreen = worldToScreen(blackHole.x, blackHole.y);
        let pulseSize = (blackHole.size + Math.sin(blackHole.pulseTimer) * 5) * zoomLevel;
        ctx.fillStyle = 'rgba(50, 0, 50, 0.4)';
        ctx.beginPath();
        ctx.arc(bScreen.x, bScreen.y, pulseSize + 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(bScreen.x, bScreen.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#AA00FF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bScreen.x, bScreen.y, pulseSize + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#FF0000';
        ctx.font = '15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BLACK HOLE', bScreen.x, bScreen.y - 30);
    }
    
    // Particles
    particles.forEach(p => {
        let pScreen = worldToScreen(p.x, p.y);
        let alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(pScreen.x, pScreen.y, p.size * zoomLevel, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    
    // Floating texts
    floatingTexts.forEach(ft => {
        let tScreen = worldToScreen(ft.x, ft.y);
        let alpha = Math.max(0, Math.min(1, ft.life / 1.5));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = ft.color;
        ctx.font = '15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, tScreen.x, tScreen.y);
    });
    ctx.globalAlpha = 1;
    
    ctx.restore();
    
    // Galaxy view overlay
    drawGalaxyMap();
    
    // UI
    drawUI();
}

// ============================================================
// Game Loop
// ============================================================
let lastTime = 0;
let energy = 0;

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let dt = Math.min((timestamp - lastTime) / 1000, 0.05); // Cap dt to avoid jumps
    lastTime = timestamp;
    
    update(dt);
    draw();
    
    requestAnimationFrame(gameLoop);
}

// ============================================================
// Start Game
// ============================================================
loadAssets();
initialize();
requestAnimationFrame(gameLoop);

console.log('VIXER - Planet Defense Game started!');
console.log('Controls: Click asteroids | [-] Galaxy View | [+] Normal View | [R] Restart');