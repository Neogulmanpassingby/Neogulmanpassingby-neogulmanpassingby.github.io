const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let grounds = [];
let dustParticles = [];

const maxDustParticles = 300; // 최대 먼지 입자 수
let flashingTimer = null;
let hasReachedRightEnd = false; // 우측 끝에 도달했는지 여부를 나타내는 플래그

const button = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
};

function resizeCanvas() {
    const aspectRatio = 16 / 9;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    if (height > width) {
        canvas.width = width;
        canvas.height = width / aspectRatio;
    } else {
        canvas.width = width;
        canvas.height = height;
    }

    // 화면 중앙에 배치
    const canvasStyle = canvas.style;
    canvasStyle.position = 'absolute';
    canvasStyle.left = `${(window.innerWidth - canvas.width) / 2}px`;
    canvasStyle.top = `${(window.innerHeight - canvas.height) / 2}px`;

    updateGrounds();
    updatePlayerSize();
    updateButtonPosition();
}

function updateGrounds() {
    grounds = [
        { x: 0, y: canvas.height * 0.75, width: canvas.width, height: 50 },  // 기본 땅
        { x: canvas.width * 0.20, y: canvas.height * 0.48, width: canvas.width * 0.2, height: 50 }, // 중간 발판
        { x: canvas.width * 0.18, y: canvas.height * 0.54, width: canvas.width * 0.64, height: 20 },  // 울타리
        { x: canvas.width * 0.79, y: canvas.height * 0.43, width: canvas.width * 0.009, height: 20 },  // 울타리
        { x: canvas.width * 0.85, y: canvas.height * 0.46, width: canvas.width * 0.009, height: 20 },
        { x: canvas.width * 0.9, y: canvas.height * 0.35, width: canvas.width * 0.007, height: 20 },
        { x: canvas.width * 0.93, y: canvas.height * 0.48, width: canvas.width * 0.007, height: 20 },
        { x: canvas.width * 0.5, y: canvas.height * 0.24, width: canvas.width * 0.05, height: 20 },  // 나무1
        { x: canvas.width * 0.49, y: canvas.height * 0.15, width: canvas.width * 0.01, height: 20 },  // 나무2
    ];
}

function updateButtonPosition() {
    button.width = canvas.width * 0.1;
    button.height = button.width; // 정사각형으로 설정
    if (window.innerHeight > window.innerWidth) {
        // 세로 모드
        button.x = canvas.width * 0.9 - button.width / 2;
        button.y = canvas.height * 2.7 - button.height / 2;
    } else {
        // 가로 모드
        button.x = canvas.width * 0.9 - button.width / 2; // 우측 하단 여백
        button.y = canvas.height * 0.9 - button.height / 2; // 우측 하단 여백
    }
    console.log(`Button position: (${button.x}, ${button.y}, ${button.width}, ${button.height})`);
}

const player = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    speed: canvas.width * 0.01,
    vx: 0,
    vy: 0,
    direction: 'right',
    grounded: true,
    m_bJump: false, // 점프 중인지 여부
    fallFrameCount: 0 // 낙하 프레임 카운트
};

function updatePlayerSize() {
    player.width = canvas.width * 0.05;
    player.height = player.width;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = grounds.length > 0 ? grounds[0].y - player.height : 0;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
ctx.imageSmoothingEnabled = false;
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.msImageSmoothingEnabled = false;
ctx.oImageSmoothingEnabled = false;

const playerImage = new Image();
playerImage.src = 'crouch.png';

const attackImage = new Image();
attackImage.src = 'attack.png';

const jumpImage = new Image();
jumpImage.src = 'jump.png';

const fallImage = new Image();
fallImage.src = 'fall.png';

const menuImage = new Image();
menuImage.src = 'menu.png';  // 메뉴 이미지 경로

const backgroundImage = new Image();
backgroundImage.src = 'background.jpg';

const youtubeImage = new Image();
youtubeImage.src = "youtube.png";

const spriteWidth = 40;
const spriteHeight = 40;
let frameX = 0;
let gameFrame = 0;
const staggerFrames = 5;
let isAttacking = false;
let attackFrameX = 0;
let isJumping = false;
let isFalling = false;
let jumpFrameX = 0;
let fallFrameX = 0;
const gravity = canvas.height * 0.001;  // 중력을 조금 더 강하게 설정
const jumpVelocity = -canvas.height * 0.03; // 점프 속도 감소

const menu = {
    x: canvas.width * 0.45,
    y: grounds[8].y * 1.1,
    width: canvas.width * 0.03,
    height: canvas.width * 0.03,
    url: 'https://youtu.be/w46luJ4rUqw?si=X6FxB-vjsJJWTiaD',
    health: 3,
    maxHealth: 3,
    isFlashing: false // 메뉴가 번쩍이는지 여부
};

const youtubeMenu = {
    x: canvas.width * 0.53,
    y: grounds[8].y * 1.2  ,
    width: canvas.width * 0.03,
    height: canvas.width * 0.03,
    url: 'https://www.youtube.com/@%EB%84%88%EA%B5%AC%EB%A6%AC%EB%86%80%EC%9D%B4%ED%84%B0/videos',
    health: 3,
    maxHealth: 3,
    isFlashing: false // 유튜브 메뉴가 번쩍이는지 여부
};

const attackSound = new Audio('attack.mp3');
attackSound.volume = 0.3; // 50% 볼륨

const walkingSound = new Audio('walking.mp3');
walkingSound.volume = 0.3; // 50% 볼륨

function drawSprite(img, sX, sY, sW, sH, dX, dY, dW, dH, flip = false) {
    ctx.save();
    if (flip) {
        ctx.translate(dX + dW / 2, dY + dH / 2);
        ctx.scale(-1, 1);
        ctx.translate(-(dX + dW / 2), -(dY + dH / 2));
    }
    ctx.drawImage(img, sX, sY, sW, sH, dX, dY, dW, dH);
    ctx.restore();
}

function drawMenu(menu) {
    if (menu.isFlashing) {
        // 하얀색으로 번쩍이게 하기 위해 밝기 조정
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.filter = 'brightness(3)';
        ctx.drawImage(menuImage, menu.x, menu.y, menu.width, menu.height);
        ctx.restore();
    } else {
        ctx.drawImage(menuImage, menu.x, menu.y, menu.width, menu.height);
    }
}

function drawYoutubeMenu(menu) {
    if (menu.isFlashing) {
        // 하얀색으로 번쩍이게 하기 위해 밝기 조정
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.filter = 'brightness(3)';
        ctx.drawImage(youtubeImage, menu.x, menu.y, menu.width, menu.height);
        ctx.restore();
    } else {
        ctx.drawImage(youtubeImage, menu.x, menu.y, menu.width, menu.height);
    }
}

function drawGrounds() {
    ctx.fillStyle = 'rgba(0,0,0,0)';
    grounds.forEach(ground => {
        ctx.fillRect(ground.x, ground.y, ground.width, ground.height);
    });
}

function drawDustParticles() {
    dustParticles.forEach((particle, index) => {
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = 'rgba(229, 191, 129, 1)';
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        ctx.globalAlpha = 1;

        particle.x += particle.vx * 0.5;
        particle.y += particle.vy * 0.5;
        particle.alpha -= 0.02;
        if (particle.alpha <= 0) {
            dustParticles.splice(index, 1);
        }
    });
}

function createDustParticle() {
    for (let i = 0; i < 3; i++) {
        const size = Math.random() * 3 + 1;
        const x = player.direction === 'right' ? player.x + player.width * 0.3 : player.x + player.width * 0.7;
        const y = player.y + player.height * 0.75;
        const vx = Math.random() * 2;
        const vy = -Math.random() * 2;

        if (dustParticles.length < maxDustParticles) {
            dustParticles.push({ x, y, vx, vy, size, alpha: 1 });
        }
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function update() {
    clearCanvas();
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    drawGrounds();
    drawMenu(menu);
    drawYoutubeMenu(youtubeMenu);
    drawDustParticles();

    const flip = player.direction === 'left';

    if (isAttacking) {
        drawSprite(attackImage, attackFrameX * spriteWidth, 0, spriteWidth, spriteHeight, player.x, player.y, player.width, player.height, flip);
        if (gameFrame % staggerFrames === 0) {
            if (attackFrameX < 7) {
                attackFrameX++;
            } else {
                stopAttack();
            }
        }
        if (checkCollision(player, menu)) {
            if (menu.health > 0) {
                menu.isFlashing = true; // 메뉴가 번쩍이게 설정
                setTimeout(() => {
                    menu.isFlashing = false; // 번쩍임을 종료
                }, 100); // 100ms 후에 종료
                menu.health = 0; // 체력을 모두 감소시킴
                attackSound.play(); // 공격 소리 재생
                if (menu.health <= 0) {
                    window.location.href = menu.url;
                }
            }
        }
        if (checkCollision(player, youtubeMenu)) {
            if (youtubeMenu.health > 0) {
                youtubeMenu.isFlashing = true; // 유튜브 메뉴가 번쩍이게 설정
                setTimeout(() => {
                    youtubeMenu.isFlashing = false; // 번쩍임을 종료
                }, 100); // 100ms 후에 종료
                youtubeMenu.health = 0; // 체력을 모두 감소시킴
                attackSound.play(); // 공격 소리 재생
                if (youtubeMenu.health <= 0) {
                    window.location.href = youtubeMenu.url;
                }
            }
        }
    } else if (isJumping) {
        drawSprite(jumpImage, jumpFrameX * spriteWidth, 0, spriteWidth, spriteHeight, player.x, player.y, player.width, player.height, flip);
        if (gameFrame % staggerFrames === 0) {
            if (jumpFrameX < 3) {
                jumpFrameX++;
            } else {
                jumpFrameX = 3;
            }
        }
        player.y += player.vy;
        player.vy += gravity;

        if (player.vy >= 0) {
            isJumping = false;
            isFalling = true;
            jumpFrameX = 0;
            player.fallFrameCount = 0; // 낙하 프레임 카운트 초기화
        }
    } else if (isFalling) {
        if (player.fallFrameCount < 3) {
            drawSprite(fallImage, fallFrameX * spriteWidth, 0, spriteWidth, spriteHeight, player.x, player.y, player.width, player.height, flip);
            if (gameFrame % staggerFrames === 0) {
                if (fallFrameX < 2) {
                    fallFrameX++;
                } else {
                    fallFrameX = 0;
                }
            }
            player.fallFrameCount++;
        } else {
            drawSprite(fallImage, 2 * spriteWidth, 0, spriteWidth, spriteHeight, player.x, player.y, player.width, player.height, flip);
        }
        player.y += player.vy;
        player.vy += gravity;

        let onGround = false;
        for (let ground of grounds) {
            if (player.y + player.height >= ground.y && player.x + player.width > ground.x && player.x < ground.x + ground.width) {
                if (player.vy > 0 && player.y + player.height - player.vy <= ground.y) {
                    player.y = ground.y - player.height;
                    player.vy = 0;
                    isFalling = false;
                    player.grounded = true;
                    player.m_bJump = false; // 점프 상태 해제
                    onGround = true;
                    break;
                }
            }
        }

        if (!onGround) {
            player.grounded = false;
        } else {
            player.grounded = true;
            isFalling = false;
        }

    } else {
        drawSprite(playerImage, frameX * spriteWidth, 0, spriteWidth, spriteHeight, player.x, player.y, player.width, player.height, flip);
        if (player.vx !== 0 || isJumping) {
            if (gameFrame % staggerFrames === 0) {
                frameX < 7 ? frameX++ : frameX = 0;
                walkingSound.play(); 
                createDustParticle(); // 이동 중일 때 먼지 입자 생성
            }
        } else {
            frameX = 0;
        }

        let onGround = false;
        for (let ground of grounds) {
            if (player.y + player.height === ground.y && player.x + player.width > ground.x && player.x < ground.x + ground.width) {
                onGround = true;
                break;
            }
        }

        if (!onGround) {
            isFalling = true;
            player.vy += gravity;
        }
    }

    // 플레이어가 우측 끝에 도달했을 때 페이지 이동
    if (!hasReachedRightEnd && player.x + player.width >= canvas.width) {
        hasReachedRightEnd = true;
        window.location.href = 'https://onesdiary.tistory.com/'; // 이동할 주소
    }

    player.x += player.vx;

    // 플레이어가 왼쪽 끝에 도달했을 때 멈춤
    if (player.x < 0) {
        player.x = 0;
    }

    gameFrame++;
}

function animate() {
    update();
    requestAnimationFrame(animate);
}

function movePlayer(event) {
    if (event.key === 'ArrowLeft') {
        player.vx = -player.speed;
        player.direction = 'left';
    } else if (event.key === 'ArrowRight') {
        player.vx = player.speed;
        player.direction = 'right';
    }
}

function stopPlayer(event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        player.vx = 0;
    }
}

function attack() {
    isAttacking = true;
    attackFrameX = 0;
    attackSound.play(); // 공격 소리 재생
    if (checkCollision(player, menu)) {
        if (menu.health > 0) {
            startFlashing(menu); // 번쩍임 효과 시작
            menu.health = 0; // 체력을 모두 감소시킴
            if (menu.health <= 0) {
                window.location.href = menu.url;
            }
        }
    }
    if (checkCollision(player, youtubeMenu)) {
        if (youtubeMenu.health > 0) {
            startFlashing(youtubeMenu); // 번쩍임 효과 시작
            youtubeMenu.health = 0; // 체력을 모두 감소시킴
            if (youtubeMenu.health <= 0) {
                window.location.href = youtubeMenu.url;
            }
        }
    }
}

function jump(event) {
    if ((event.key === 'ArrowUp') && player.grounded && !player.m_bJump) {
        player.vy = jumpVelocity;
        isJumping = true;
        jumpFrameX = 0;
        player.grounded = false;
        player.m_bJump = true; // 점프 상태 설정
    }
}

function stopAttack() {
    isAttacking = false;
    frameX = 0;
}

document.addEventListener('keydown', movePlayer);
document.addEventListener('keyup', stopPlayer);
document.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
        attack();
    } else if (event.key === 'ArrowUp') {
        jump(event);
    }
});

// 터치 이벤트 추가
document.addEventListener('touchstart', handleTouchStart, false);
document.addEventListener('touchmove', handleTouchMove, false);
document.addEventListener('touchend', handleTouchEnd, false);

let touchStartX = null;
let touchStartY = null;
let lastTouchTime = 0; // 두 번 터치 감지를 위한 변수

function handleTouchStart(event) {
    const firstTouch = event.touches[0];
    touchStartX = firstTouch.clientX;
    touchStartY = firstTouch.clientY;

    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTouchTime;
    if (tapLength < 300 && tapLength > 0) {
        // 두 번 터치 간격이 300ms 이내면 공격 실행
        attack();
    }
    lastTouchTime = currentTime;
}

function handleTouchMove(event) {
    if (!touchStartX || !touchStartY) {
        return;
    }
    const touch = event.touches[0];
    const touchEndX = touch.clientX;
    const touchEndY = touch.clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
            player.vx = player.speed;
            player.direction = 'right';
        } else {
            player.vx = -player.speed;
            player.direction = 'left';
        }
    } else {
        if (diffY < -canvas.height * 0.05) { // 일정 거리 이상 위로 스와이프할 경우
            if (player.grounded && !player.m_bJump) {
                player.vy = jumpVelocity;
                isJumping = true;
                jumpFrameX = 0;
                player.grounded = false;
                player.m_bJump = true;
            }
        }
    }

    touchStartX = touchEndX;
    touchStartY = touchEndY;
}

function handleTouchEnd(event) {
    player.vx = 0;
}

const images = [playerImage, attackImage, jumpImage, fallImage, menuImage, backgroundImage, youtubeImage];
let imagesLoaded = 0;

function imageLoaded() {
    imagesLoaded++;
    console.log(`Image loaded: ${imagesLoaded}/${images.length}`);
    if (imagesLoaded === images.length) {
        animate();
    }
}

images.forEach((image) => {
    image.onload = imageLoaded;
});

// 배경 음악 재생
document.addEventListener('DOMContentLoaded', () => {
    const backgroundMusic = document.getElementById('backgroundMusic');
    backgroundMusic.volume = 0.1; // 볼륨을 10%로 설정

    // 사용자 상호작용 이벤트를 기다림
    const playBackgroundMusic = () => {
        backgroundMusic.play().catch(error => {
            console.error("Failed to play background music:", error);
        });
        document.removeEventListener('click', playBackgroundMusic);
        document.removeEventListener('keydown', playBackgroundMusic);
    };

    // 클릭이나 키다운 이벤트를 통해 배경 음악을 재생
    document.addEventListener('click', playBackgroundMusic);
    document.addEventListener('keydown', playBackgroundMusic);
});
