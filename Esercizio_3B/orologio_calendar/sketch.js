let canvasParent;
let clockCanvas;
let activityInputs = [];
let colors = [
  "#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed",
  "#be185d", "#0891b2", "#4b5563", "#ea580c", "#65a30d"
];

// === Google API - CORRETTA ===
const CLIENT_ID = '969498870533-77kj92i0guh5b22gu45fvqfbg7usn776.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDVxb0DVJykGc_u-mkjztSUeimAzCVi198';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

let gapiInited = false;
let gisInited = false;
let tokenClient;

function setup() {
  noCanvas();
  createLayout();

  clockCanvas = createCanvas(600, 600);
  clockCanvas.parent(canvasParent);

  // Inizializza Google API
  gapi.load('client', initializeGapi);
  
  // Inizializza Google Identity Services
  gisInited = true;
  maybeEnableButtons();
}

async function initializeGapi() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
  });
  gapiInited = true;
  maybeEnableButtons();
}

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    select('#login-button').removeAttribute('disabled');
    
    // Inizializza il token client solo quando tutto è pronto
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: handleTokenResponse,
    });
  }
}

function handleTokenResponse(resp) {
  if (resp.error !== undefined) {
    console.error('Errore autenticazione:', resp);
    return;
  }
  
  // IMPORTANTE: Setta il token in gapi.client
  gapi.client.setToken({
    access_token: resp.access_token
  });
  
  console.log('Token ricevuto, caricamento eventi...');
  listTodayEvents();
  
  select('#login-button').hide();
  select('#logout-button').show();
}

function handleSignIn() {
  if (tokenClient) {
    tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    console.error('Token client non inizializzato');
  }
}

function handleSignOut() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token, () => {
      console.log('Token revocato');
    });
    gapi.client.setToken('');
    activityInputs = [];
    select('#login-button').show();
    select('#logout-button').hide();
  }
}

async function listTodayEvents() {
  // Verifica che il token sia settato
  if (!gapi.client.getToken()) {
    console.error('Nessun token di accesso disponibile');
    return;
  }

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  console.log('Caricamento eventi da:', start.toISOString(), 'a:', end.toISOString());

  try {
    const response = await gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime'
    });

    console.log('Risposta API:', response);
    const events = response.result.items;
    console.log('Eventi trovati:', events.length);
    
    if (events && events.length > 0) {
      convertEventsToActivityInputs(events);
      console.log('ActivityInputs creati:', activityInputs.length);
    } else {
      console.log('Nessun evento trovato per oggi');
      activityInputs = [];
    }
    
  } catch (error) {
    console.error('Errore nel recuperare gli eventi:', error);
    
    // Debug aggiuntivo
    if (error.result && error.result.error) {
      console.error('Dettagli errore API:', error.result.error);
    }
  }
}

function convertEventsToActivityInputs(events) {
  activityInputs = [];
  console.log('Conversione eventi:', events);

  events.forEach((ev, index) => {
    console.log(`Evento ${index}:`, ev);
    
    // Gestisci sia eventi con orario che eventi di tutto il giorno
    let startTime, endTime;
    
    if (ev.start.dateTime) {
      // Evento con orario specifico
      startTime = new Date(ev.start.dateTime);
      endTime = new Date(ev.end.dateTime);
    } else if (ev.start.date) {
      // Evento di tutto il giorno - salta per ora
      console.log('Evento di tutto il giorno saltato:', ev.summary);
      return;
    } else {
      console.log('Evento senza orario valido:', ev);
      return;
    }

    const timeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}` +
                    `-${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

    const color = colors[index % colors.length];

    const activityInput = {
      time: { value: () => timeStr },
      color: { elt: { dataset: { color: color } } },
      label: { value: () => ev.summary || 'Evento senza titolo' }
    };
    
    console.log('ActivityInput creato:', activityInput);
    activityInputs.push(activityInput);
  });
  
  console.log('ActivityInputs finali:', activityInputs);
}

function draw() {
  background(248, 250, 252);

  let s = min(width, height) / 600;
  translate(width / 2, height / 2);
  scale(s);

  drawCleanClock();
  drawActivitySectors();
}

function drawCleanClock() {
  strokeWeight(2);
  stroke(71, 85, 105);
  fill(255);
  ellipse(0, 0, 400, 400);

  drawCleanNumbers();
  drawMinimalTicks();
  drawPreciseHands();
  drawMinimalCenter();
}

function drawCleanNumbers() {
  textAlign(CENTER, CENTER);
  textSize(24);
  textStyle(NORMAL);
  fill(15, 23, 42);

  for (let i = 1; i <= 12; i++) {
    push();
    let angle = (i * TWO_PI / 12) - HALF_PI;
    let x = cos(angle) * 150;
    let y = sin(angle) * 150;
    text(i, x, y);
    pop();
  }
}

function drawMinimalTicks() {
  stroke(71, 85, 105);
  for (let i = 0; i < 60; i++) {
    push();
    rotate(i / 60 * TWO_PI);
    strokeWeight(i % 5 === 0 ? 2 : 1);
    line(0, -190, 0, i % 5 === 0 ? -175 : -183);
    pop();
  }
}

function drawPreciseHands() {
  push();
  let h = hour() % 12 + minute() / 60;
  rotate(h / 12 * TWO_PI);
  strokeWeight(6);
  stroke(15, 23, 42);
  line(0, 15, 0, -100);
  strokeWeight(4);
  line(0, -100, 0, -110);
  pop();

  push();
  let m = minute();
  rotate(m / 60 * TWO_PI);
  strokeWeight(4);
  stroke(15, 23, 42);
  line(0, 15, 0, -160);
  strokeWeight(2);
  line(0, -160, 0, -170);
  pop();

  push();
  let s = second();
  rotate(s / 60 * TWO_PI);
  strokeWeight(2);
  stroke(220, 38, 38);
  line(0, 20, 0, -175);
  noStroke();
  fill(220, 38, 38);
  ellipse(0, -175, 8, 8);
  pop();
}

function drawMinimalCenter() {
  strokeWeight(2);
  stroke(71, 85, 105);
  fill(255);
  ellipse(0, 0, 20, 20);
  noStroke();
  fill(15, 23, 42);
  ellipse(0, 0, 8, 8);
}

function drawActivitySectors() {
  if (activityInputs.length === 0) {
    return; // Nessuna attività da mostrare
  }
  
  let radius = 280;
  let now = hour() * 60 + minute();

  activityInputs.forEach(row => {
    let timeVal = row.time.value().trim();
    let labelVal = row.label.value();
    let colorVal = row.color.elt.dataset.color;

    if (timeVal.includes("-") && labelVal.trim() !== "") {
      let [startStr, endStr] = timeVal.split("-").map(s => s.trim());
      let [sh, sm] = startStr.split(":").map(Number);
      let [eh, em] = endStr.split(":").map(Number);

      let startMin = sh * 60 + sm;
      let endMin = eh * 60 + em;

      // Nascondi solo le attività che sono completamente finite (ora corrente > ora di fine)
      if (now > endMin) return;

      // Determina se l'attività è in corso per l'evidenziazione visiva
      let inRange = startMin <= endMin
        ? now >= startMin && now < endMin
        : now >= startMin || now < endMin;

      let startA = timeToAngle(startStr);
      let endA = timeToAngle(endStr);

      if (!isNaN(startA) && !isNaN(endA)) {
        fill(colorVal + '80');
        stroke(colorVal);
        strokeWeight(2);
        arc(0, 0, radius * 2, radius * 2, startA, endA, PIE);

        let midAngle = (startA + endA) / 2;
        if (endA < startA) {
          midAngle = (startA + endA + TWO_PI) / 2;
        }

        let textRadius = radius * 0.8;
        let labelX = cos(midAngle) * textRadius;
        let labelY = sin(midAngle) * textRadius;

        push();
        translate(labelX, labelY);
        textAlign(CENTER, CENTER);
        textSize(14);
        let textW = textWidth(labelVal) + 16;
        let textH = 24;
        strokeWeight(2);
        stroke(colorVal);
        fill(255, 255, 255, 250);
        rect(-textW / 2, -textH / 2, textW, textH, 4);
        noStroke();
        fill(15, 23, 42);
        textStyle(BOLD);
        text(labelVal, 0, 0);
        pop();
      }
    }
  });
}

function timeToAngle(timeStr) {
  let [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return NaN;
  let totalMinutes = h * 60 + m;
  let angle = (totalMinutes / (12 * 60)) * TWO_PI;
  return angle - HALF_PI;
}

function createLayout() {
  let wrapper = createDiv().id('main-wrapper').style(`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    width: 100vw;
    height: 100vh;
    box-sizing: border-box;
    overflow: hidden;
    background: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `);

  let sidebar = createDiv().id('sidebar').style(`
    width: 400px;
    padding: 24px;
    box-sizing: border-box;
    background: #ffffff;
    overflow-y: auto;
    height: 100%;
    border-right: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  `).parent(wrapper);

  createElement('h2', 'Pianificatore Attività').parent(sidebar).style(`
    margin: 0 0 24px 0;
    color: #0f172a;
    font-size: 24px;
    font-weight: 600;
    text-align: center;
  `);

  // Bottone di login
  let loginBtn = createButton('Accedi a Google Calendar');
  loginBtn.id('login-button');
  loginBtn.style(`
    width: 100%;
    padding: 12px;
    background: #4285f4;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    margin-bottom: 16px;
    font-weight: 500;
  `);
  loginBtn.attribute('disabled', 'true');
  loginBtn.mousePressed(handleSignIn);
  loginBtn.parent(sidebar);

  // Bottone di logout
  let logoutBtn = createButton('Disconnetti');
  logoutBtn.id('logout-button');
  logoutBtn.style(`
    width: 100%;
    padding: 12px;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    margin-bottom: 16px;
    font-weight: 500;
    display: none;
  `);
  logoutBtn.mousePressed(handleSignOut);
  logoutBtn.parent(sidebar);

  canvasParent = createDiv().id('canvas-container').style(`
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    overflow: hidden;
    background: #f8fafc;
  `).parent(wrapper);
}

function windowResized() {
  let canvasW = windowWidth - 400;
  let canvasH = windowHeight;
  resizeCanvas(canvasW > 600 ? 600 : canvasW, canvasH);
}