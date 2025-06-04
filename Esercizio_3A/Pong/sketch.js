// --- VARIABILI GLOBALI ---

let balls = [];           // Array che contiene tutte le palline attive nel gioco
let barBlueY;             // Posizione verticale della barra blu (cursore giocatore)
let prevBarBlueY;         // Posizione precedente della barra blu (per calcolare velocità movimento)
let lineLength;           // Lunghezza delle barre (rossa e blu)
let ballRadius = 10;      // Raggio standard delle palline piccole
let gameOver = false;     // Flag che indica se il gioco è terminato
let gameStarted = false;  // Flag che indica se il gioco è iniziato
let score = 0;            // Punteggio corrente
let highScore = 0;        // Record punteggio più alto
let initialSpeed = 6;     // Velocità iniziale delle palline piccole
let lastSpeedIncreaseScore = 0; // Ultimo punteggio in cui è stata aumentata la velocità
let lastBallAddedScore = 0;      // Ultimo punteggio in cui è stata aggiunta una pallina
let lastHitBall = null;          // Riferimento all'ultima pallina colpita dalla barra blu

// Flag per tenere traccia se la MegaBall è attiva
let megaBallActive = false;

// --- CLASSE BALL ---

class Ball {
  constructor(x, y, speedX, speedY, radius = ballRadius, isMega = false) {
    this.x = x;             // Coordinata X
    this.y = y;             // Coordinata Y
    this.speedX = speedX;   // Velocità orizzontale
    this.speedY = speedY;   // Velocità verticale
    this.radius = radius;   // Raggio pallina (default 10)
    this.active = true;     // Stato attivo/inattivo
    this.isMega = isMega;   // Flag se è MegaBall (palla grande)
  }
  
  update() {
    if (!gameStarted) return;  // Se gioco non iniziato, non aggiornare
    
    this.x += this.speedX;
    this.y += this.speedY;
    
    // Rimbalzo alto/basso
    if (this.y - this.radius <= 0 || this.y + this.radius >= height) {
      this.speedY = -this.speedY;
    }
    
    // Se pallina esce a destra (solo per palline normali)
    if (!this.isMega && this.x - this.radius > width) {
      this.active = false;
    }
    
    // Per MegaBall il game over avviene quando esce a sinistra
    if (this.isMega && this.x + this.radius < 0) {
      this.active = false;
    }
  }
  
  display() {
    noStroke();
    if (this.isMega) {
      fill(255, 165, 0); // Colore arancione per MegaBall
    } else {
      fill(255); // Bianco per le palline normali
    }
    ellipse(this.x, this.y, this.radius * 2, this.radius * 2);
  }
  
  // Barra rossa segue questa pallina (solo per palline normali e MegaBall)
  displayRedBar() {
    stroke(255, 0, 0);
    strokeWeight(10);
    let barY = constrain(this.y, lineLength / 2, height - lineLength / 2);
    line(30, barY - lineLength / 2, 30, barY + lineLength / 2);
  }
  
  // Collisione con barra rossa (solo palline normali e MegaBall)
  checkRedBarCollision() {
    let barY = constrain(this.y, lineLength / 2, height - lineLength / 2);
    if (this.x - this.radius <= 30 + 10 && abs(this.y - barY) <= lineLength / 2) {
      // Se è MegaBall, attiva la divisione in due palline veloci
      if (this.isMega) {
        this.active = false;      // Disattiva la MegaBall
        splitMegaBall(this);      // Divide MegaBall in due palline piccole
      } else {
        this.speedX = abs(this.speedX); // Inverti verso destra la pallina normale
      }
    }
  }
  
  // Collisione con barra blu (giocatore)
  checkBlueBarCollision(blueBarY, barBlueSpeed) {
    if (this.x + this.radius >= width - 30 - 10 && abs(this.y - blueBarY) <= lineLength / 2) {
      this.speedX = -abs(this.speedX); // Inverti verso sinistra
      
      // Influenza velocità verticale in base alla velocità barra blu
      let maxInfluence = 4;
      this.speedY += barBlueSpeed * 0.4;
      this.speedY = constrain(this.speedY, -maxInfluence, maxInfluence);
      
      lastHitBall = this;   // Registra come ultima pallina colpita
      score++;              // Aumenta punteggio
      
      // Aumenta velocità ogni 5 punti
      if (score % 5 === 0 && score > lastSpeedIncreaseScore) {
        let speedIncrease = 0.5;
        this.speedX = this.speedX > 0 ? this.speedX + speedIncrease : this.speedX - speedIncrease;
        this.speedY = this.speedY > 0 ? this.speedY + speedIncrease : this.speedY - speedIncrease;
        lastSpeedIncreaseScore = score;
      }
      
      // Aggiunge nuova pallina ogni 4 punti (se non è MegaBall)
      if (!megaBallActive && score % 4 === 0 && score > lastBallAddedScore) {
        addNewBall();
        lastBallAddedScore = score;
      }
      
      // Se raggiungiamo 10 palline, creiamo la MegaBall
      if (!megaBallActive && balls.filter(b => b.active).length >= 10) {
        createMegaBall();
      }
      
      return true;
    }
    return false;
  }
}

// --- FUNZIONE PER CREARE LA MEGABALL ---

function createMegaBall() {
  // Rimuovi tutte le palline attive
  balls = [];
  
  // Crea MegaBall gigante al centro, 20 volte più grande
  let megaRadius = ballRadius * 20;
  let x = width / 2;
  let y = height / 2;
  let speedX = -initialSpeed; // Sempre verso sinistra (verso barra rossa)
  let speedY = 0;
  
  let megaBall = new Ball(x, y, speedX, speedY, megaRadius, true);
  balls.push(megaBall);
  
  megaBallActive = true; // Attiva il flag MegaBall
}

// --- FUNZIONE PER DIVIDERE LA MEGABALL IN DUE PALLINE VELOCI ---

function splitMegaBall(megaBall) {
  // Le due nuove palline avranno raggio standard, velocità doppia rispetto alla MegaBall
  let newSpeed = abs(megaBall.speedX) * 2;
  let radius = ballRadius;
  
  // Posizione centrale di partenza per entrambe le nuove palline
  let baseX = megaBall.x;
  let baseY = megaBall.y;
  
  // Pallina che va verso l'alto
  let ballUp = new Ball(
    baseX, baseY,
    newSpeed,   // Velocità X verso destra
    -newSpeed   // Velocità Y verso l'alto
  );
  
  // Pallina che va verso il basso
  let ballDown = new Ball(
    baseX, baseY,
    newSpeed,    // Velocità X verso destra
    newSpeed     // Velocità Y verso il basso
  );
  
  // Sostituisci array palline con queste due
  balls = [ballUp, ballDown];
  
  megaBallActive = false; // MegaBall non più attiva
}

// --- FUNZIONI PRINCIPALI ---

function setup() {
  createCanvas(windowWidth, windowHeight);
  lineLength = windowHeight / 6;
  barBlueY = mouseY;
  prevBarBlueY = barBlueY;
  resetGame();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);
  
  // Linea centrale verticale
  stroke(255);
  strokeWeight(2);
  line(width / 2, 0, width / 2, height);
  
  // Barra blu (giocatore)
  stroke(0, 0, 255);
  strokeWeight(10);
  prevBarBlueY = barBlueY;
  barBlueY = constrain(mouseY, lineLength / 2, height - lineLength / 2);
  line(width - 30, barBlueY - lineLength / 2, width - 30, barBlueY + lineLength / 2);
  
  // Calcola velocità barra blu (per influenzare palline)
  let barBlueSpeed = barBlueY - prevBarBlueY;
  
  // Controlla se tutte le palline sono inattive (game over)
  let allBallsInactive = true;
  
  // Aggiorna, disegna e controlla collisioni per ogni pallina attiva
  for (let ball of balls) {
    if (ball.active) {
      allBallsInactive = false;
      ball.displayRedBar();
      ball.display();
      ball.update();
      ball.checkRedBarCollision();
      ball.checkBlueBarCollision(barBlueY, barBlueSpeed);
    }
  }
  
  // Game over se tutte le palline inattive e gioco iniziato
  if (allBallsInactive && balls.length > 0 && gameStarted) {
    gameOver = true;
  }
  
  noStroke();
  
  // Mostra punteggio e info se gioco iniziato
  if (gameStarted) {
    let margin = width / 50;
    let scoreTextSize = height / 20;
    textSize(scoreTextSize);
    fill(255);
    textAlign(LEFT, BOTTOM);
    
    text("Score: " + score, margin, height - margin);
    let recordText = highScore > 0 ? highScore : "-";
    text("Record: " + recordText, margin, height - margin - scoreTextSize - 5);
    
    // Mostra velocità massima tra palline attive
    if (balls.length > 0) {
      let maxSpeed = 0;
      for (let ball of balls) {
        if (ball.active) {
          let currentSpeed = abs(ball.speedX);
          if (currentSpeed > maxSpeed) maxSpeed = currentSpeed;
        }
      }
      text("Speed: " + maxSpeed.toFixed(1), margin, height - margin - (scoreTextSize * 2) - 10);
    }
    
    // Mostra numero palline in gioco
    let activeBalls = balls.filter(b => b.active).length;
    text("Balls: " + activeBalls, margin, height - margin - (scoreTextSize * 3) - 15);
  }
  
  // Testo inizio gioco
  if (!gameStarted && !gameOver) {
    textAlign(CENTER, CENTER);
    textSize(48);
    fill(255);
    text("CLICK TO START", width / 2, height / 2);
  }
  
  // Testo Game Over
  if (gameOver) {
    textAlign(CENTER, CENTER);
    textSize(64);
    fill(255, 0, 0);
    text("GAME OVER", width / 2, height / 2);
    text("impegnati di più", width / 2, height / 2 + 80);
    fill(255);
    textSize(24);
    text("click to restart", width / 2, height / 2 + 140);
  }
}

// --- AGGIUNGI NUOVA PALLINA PICCOLA ---

function addNewBall() {
  // Posizione centrale
  let x = width / 2;
  let y = height / 2;
  let speedX, speedY;
  
  if (lastHitBall && lastHitBall.active && gameStarted) {
    // 3/4 velocità dell'ultima pallina colpita
    let baseSpeedX = abs(lastHitBall.speedX) * 0.75;
    let baseSpeedY = abs(lastHitBall.speedY) * 0.75;
    
    speedX = -baseSpeedX; // Verso sinistra
    speedY = baseSpeedY * (random() > 0.5 ? 1 : -1); // Direzione verticale casuale
  } else {
    speedX = -initialSpeed;
    speedY = initialSpeed * (random() > 0.5 ? 1 : -1);
  }
  
  balls.push(new Ball(x, y, speedX, speedY));
}

// --- RESET DEL GIOCO ---

function resetGame() {
  // Aggiorna record
  if (score > highScore) {
    highScore = score;
  }
  
  balls = [];
  addNewBall();
  
  score = 0;
  lastSpeedIncreaseScore = 0;
  lastBallAddedScore = 0;
  lastHitBall = null;
  gameOver = false;
  gameStarted = false;
  megaBallActive = false;
}

// --- GESTIONE CLICK MOUSE ---

function mousePressed() {
  if (!gameStarted && !gameOver) {
    gameStarted = true;
  } else if (gameOver) {
    resetGame();
  }
}
