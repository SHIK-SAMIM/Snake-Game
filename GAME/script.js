const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const box = 20;

const bgm = document.getElementById("bgm");
const eatSound = document.getElementById("eatSound");
const gameOverSound = document.getElementById("gameOverSound");

let snake = [];
let food;
let goldenFood = null;
let obstacles = [];
let score = 0;
let level = 1;
let lives = 3;
let dir = null;
let speed = 120;
let gameInterval = null;
let hasStarted = false;

// Stars for background animation
const stars = [];
for(let i=0;i<50;i++) stars.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, size:Math.random()*2+1});

function spawnFood(){
    return { x: Math.floor(Math.random()*(canvas.width/box))*box, y: Math.floor(Math.random()*(canvas.height/box))*box };
}

function spawnObstacles(){
    obstacles = [];
    for(let i=0;i<level;i++){
        let obs;
        do{ obs = spawnFood(); } 
        while(snake.some(s=>s.x===obs.x && s.y===obs.y) || (food && obs.x===food.x && obs.y===food.y));
        obstacles.push(obs);
    }
}

function drawStars(){
    ctx.fillStyle="#0ff";
    ctx.shadowBlur=5;
    stars.forEach(s=>{
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
        ctx.fill();
        s.y += 0.3;
        if(s.y>canvas.height) s.y=0;
    });
}

function initGame(){
    snake=[{x:200,y:200}];
    food=spawnFood();
    goldenFood=null;
    obstacles=[];
    score=0; level=1; lives=3; dir=null; hasStarted=false; speed=120;
    document.getElementById("score").innerText=score;
    document.getElementById("level").innerText=level;
    document.getElementById("lives").innerText=lives;
    document.getElementById("gameOverPopup").classList.add("hidden");
    if(gameInterval) clearInterval(gameInterval);
    gameInterval=setInterval(draw,speed);
}

function draw(){
    ctx.fillStyle="#000"; ctx.fillRect(0,0,canvas.width,canvas.height);
    drawStars();

    // Obstacles
    ctx.fillStyle="#f00"; ctx.shadowColor="#f00"; ctx.shadowBlur=10;
    obstacles.forEach(o=>ctx.fillRect(o.x,o.y,box,box));

    // Normal food
    const tFood = Date.now()/200;
    const rFood = box/2 + Math.sin(tFood)*4;
    ctx.fillStyle="yellow"; ctx.shadowColor="yellow"; ctx.shadowBlur=15;
    ctx.beginPath(); ctx.arc(food.x+box/2, food.y+box/2, rFood,0,Math.PI*2); ctx.fill();

    // Golden food
    if(goldenFood){
        const tGold = Date.now()/150;
        const rGold = box/2 + Math.sin(tGold)*4;
        ctx.fillStyle="#FFD700"; ctx.shadowColor="#FFD700"; ctx.shadowBlur=20;
        ctx.beginPath(); ctx.arc(goldenFood.x+box/2, goldenFood.y+box/2, rGold,0,Math.PI*2); ctx.fill();
    }

    // Snake
    snake.forEach((s,i)=>{
        const t = i/snake.length;
        if(i===0){ctx.fillStyle="#0ff"; ctx.shadowColor="#0ff"; ctx.shadowBlur=15;}
        else {ctx.fillStyle=`rgb(0,${Math.floor(170*(1-t))},170)`; ctx.shadowBlur=0;}
        ctx.fillRect(s.x,s.y,box-1,box-1);
    });

    if(!hasStarted) return;

    let head = {...snake[0]};
    if(dir==="LEFT") head.x-=box;
    if(dir==="RIGHT") head.x+=box;
    if(dir==="UP") head.y-=box;
    if(dir==="DOWN") head.y+=box;

    // Collision
    if(head.x<0 || head.y<0 || head.x>=canvas.width || head.y>=canvas.height ||
       snake.some(s=>s.x===head.x && s.y===head.y) ||
       obstacles.some(o=>o.x===head.x && o.y===head.y)){
        lives--; document.getElementById("lives").innerText=lives;
        if(lives<=0){
            gameOverSound.currentTime=0; gameOverSound.play();
            clearInterval(gameInterval);
            document.getElementById("finalScore").innerText=score;
            document.getElementById("gameOverPopup").classList.remove("hidden");
            return;
        }
        snake=[{x:200,y:200}]; dir=null; hasStarted=false; return;
    }

    snake.unshift(head);

    // Eat normal food
    if(head.x===food.x && head.y===food.y){
        score++; document.getElementById("score").innerText=score;
        food=spawnFood(); eatSound.currentTime=0; eatSound.play();
        if(score%5===0){
            level++; document.getElementById("level").innerText=level;
            speed=Math.max(50,speed-10);
            clearInterval(gameInterval); gameInterval=setInterval(draw,speed);
            spawnObstacles();
        }
        if(score%5===0 && !goldenFood) goldenFood=spawnFood();
    } else snake.pop();

    // Eat golden food
    if(goldenFood && head.x===goldenFood.x && head.y===goldenFood.y){
        score+=5; document.getElementById("score").innerText=score;
        goldenFood=null; eatSound.currentTime=0; eatSound.play();
    }
}

// Controls
document.addEventListener("keydown", e=>{
    if(e.key==="ArrowUp" && dir!=="DOWN") dir="UP";
    if(e.key==="ArrowDown" && dir!=="UP") dir="DOWN";
    if(e.key==="ArrowLeft" && dir!=="RIGHT") dir="LEFT";
    if(e.key==="ArrowRight" && dir!=="LEFT") dir="RIGHT";
    if(!hasStarted && dir) hasStarted=true;
});

document.getElementById("startBtn").onclick = () => {
    initGame();
    bgm.currentTime=0; bgm.volume=0.5;
    bgm.play().catch(()=>{document.body.addEventListener("click",()=>bgm.play(),{once:true});});
};

document.getElementById("restartBtn").onclick = initGame;

document.getElementById("pauseBtn").onclick = () => {
    if(gameInterval){clearInterval(gameInterval); gameInterval=null; bgm.pause();}
    else {gameInterval=setInterval(draw,speed); bgm.play().catch(()=>{});}
};

document.getElementById("popupRestart").onclick = () => {
    document.getElementById("gameOverPopup").classList.add("hidden");
    initGame();
    bgm.currentTime=0; bgm.play().catch(()=>{document.body.addEventListener("click",()=>bgm.play(),{once:true});});
};

// Start automatically
initGame();
