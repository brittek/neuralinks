// Configuration
const CONFIG = {
  range: 180,
  baseConnections: 3,
  addedConnections: 5,
  baseSize: 5,
  minSize: 1,
  dataToConnectionSize: 0.4,
  sizeMultiplier: 0.7,
  allowedDist: 40,
  baseDist: 40,
  addedDist: 30,
  connectionAttempts: 100,
  dataToConnections: 1,
  baseSpeed: 0.04,
  addedSpeed: 0.05,
  baseGlowSpeed: 0.4,
  addedGlowSpeed: 0.4,
  rotVelX: 0.003,
  rotVelY: 0.002,
  repaintColor: "#111",
  connectionColor: "hsla(200,60%,light%,alp)",
  rootColor: "hsla(0,60%,light%,alp)",
  endColor: "hsla(160,20%,light%,alp)",
  dataColor: "hsla(40,80%,light%,alp)",
  wireframeWidth: 0.1,
  wireframeColor: "#88f",
  depth: 250,
  focalLength: 250
};

// Utility functions
const squareDist = (a, b) => {
  const x = b.x - a.x;
  const y = b.y - a.y;
  const z = b.z - a.z;
  return x * x + y * y + z * z;
};

// Classes
class Connection {
  constructor(x, y, z, size) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.size = size;
    this.screen = {};
    this.links = [];
    this.probabilities = [];
    this.isEnd = false;
    this.glowSpeed = CONFIG.baseGlowSpeed + CONFIG.addedGlowSpeed * Math.random();
  }

  link() {
    if (this.size < CONFIG.minSize) {
      this.isEnd = true;
      return;
    }

    const links = [];
    const connectionsNum = (CONFIG.baseConnections + Math.random() * CONFIG.addedConnections) | 0;
    let attempt = CONFIG.connectionAttempts;

    while (links.length < connectionsNum && --attempt > 0) {
      const alpha = Math.random() * Math.PI;
      const beta = Math.random() * Math.PI * 2;
      const len = CONFIG.baseDist + CONFIG.addedDist * Math.random();

      const pos = {
        x: this.x + len * Math.cos(alpha) * Math.sin(beta),
        y: this.y + len * Math.sin(alpha) * Math.sin(beta),
        z: this.z + len * Math.cos(beta)
      };

      if (pos.x * pos.x + pos.y * pos.y + pos.z * pos.z < CONFIG.range * CONFIG.range) {
        const passedExisting = !connections.some(conn => 
          squareDist(pos, conn) < CONFIG.allowedDist * CONFIG.allowedDist
        );
        const passedBuffered = !links.some(link => 
          squareDist(pos, link) < CONFIG.allowedDist * CONFIG.allowedDist
        );

        if (passedExisting && passedBuffered) {
          links.push(pos);
        }
      }
    }

    if (links.length === 0) {
      this.isEnd = true;
    } else {
      this.links = links.map(pos => {
        const connection = new Connection(
          pos.x,
          pos.y,
          pos.z,
          this.size * CONFIG.sizeMultiplier
        );
        all.push(connection);
        connections.push(connection);
        return connection;
      });
      
      toDevelop.push(...this.links);
    }
  }

  setScreen() {
    let { x, y, z } = this;

    // Apply rotation on X axis
    const Y = y;
    y = y * cosX - z * sinX;
    z = z * cosX + Y * sinX;

    // Rotate on Y
    const Z = z;
    z = z * cosY - x * sinY;
    x = x * cosY + Z * sinY;

    this.screen.z = z;
    z += CONFIG.depth;

    this.screen.scale = CONFIG.focalLength / z;
    this.screen.x = CONFIG.vanishPoint.x + x * this.screen.scale;
    this.screen.y = CONFIG.vanishPoint.y + y * this.screen.scale;
  }

  step() {
    this.setScreen();
    this.screen.color = (this.isEnd ? CONFIG.endColor : CONFIG.connectionColor)
      .replace("light", 30 + ((tick * this.glowSpeed) % 30))
      .replace("alp", 0.2 + (1 - this.screen.z / mostDistant) * 0.8);

    for (const link of this.links) {
      ctx.moveTo(this.screen.x, this.screen.y);
      ctx.lineTo(link.screen.x, link.screen.y);
    }
  }

  draw() {
    ctx.fillStyle = this.screen.color;
    ctx.beginPath();
    ctx.arc(this.screen.x, this.screen.y, this.screen.scale * this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Data {
  constructor(connection) {
    this.glowSpeed = CONFIG.baseGlowSpeed + CONFIG.addedGlowSpeed * Math.random();
    this.speed = CONFIG.baseSpeed + CONFIG.addedSpeed * Math.random();
    this.screen = {};
    this.setConnection(connection);
  }

  reset() {
    this.setConnection(connections[0]);
    this.ended = 2;
  }

  step() {
    this.proportion += this.speed;

    if (this.proportion < 1) {
      this.x = this.ox + this.dx * this.proportion;
      this.y = this.oy + this.dy * this.proportion;
      this.z = this.oz + this.dz * this.proportion;
      this.size = (this.os + this.ds * this.proportion) * CONFIG.dataToConnectionSize;
    } else {
      this.setConnection(this.nextConnection);
    }

    this.screen.lastX = this.screen.x;
    this.screen.lastY = this.screen.y;
    this.setScreen();
    this.screen.color = CONFIG.dataColor
      .replace("light", 40 + ((tick * this.glowSpeed) % 50))
      .replace("alp", 0.2 + (1 - this.screen.z / mostDistant) * 0.6);
  }

  draw() {
    if (this.ended) return --this.ended;

    ctx.beginPath();
    ctx.strokeStyle = this.screen.color;
    ctx.lineWidth = this.size * this.screen.scale;
    ctx.moveTo(this.screen.lastX, this.screen.lastY);
    ctx.lineTo(this.screen.x, this.screen.y);
    ctx.stroke();
  }

  setConnection(connection) {
    if (connection.isEnd) {
      this.reset();
    } else {
      this.connection = connection;
      this.nextConnection = connection.links[(connection.links.length * Math.random()) | 0];

      this.ox = connection.x;
      this.oy = connection.y;
      this.oz = connection.z;
      this.os = connection.size;

      this.nx = this.nextConnection.x;
      this.ny = this.nextConnection.y;
      this.nz = this.nextConnection.z;
      this.ns = this.nextConnection.size;

      this.dx = this.nx - this.ox;
      this.dy = this.ny - this.oy;
      this.dz = this.nz - this.oz;
      this.ds = this.ns - this.os;

      this.proportion = 0;
    }
  }

  setScreen() {
    let { x, y, z } = this;

    const Y = y;
    y = y * cosX - z * sinX;
    z = z * cosX + Y * sinX;

    const Z = z;
    z = z * cosY - x * sinY;
    x = x * cosY + Z * sinY;

    this.screen.z = z;
    z += CONFIG.depth;

    this.screen.scale = CONFIG.focalLength / z;
    this.screen.x = CONFIG.vanishPoint.x + x * this.screen.scale;
    this.screen.y = CONFIG.vanishPoint.y + y * this.screen.scale;
  }
}

// Initialize
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;

CONFIG.vanishPoint = { x: w / 2, y: h / 2 };

const squareRange = CONFIG.range * CONFIG.range;
const squareAllowed = CONFIG.allowedDist * CONFIG.allowedDist;
const mostDistant = CONFIG.depth + CONFIG.range;

let sinX = 0, sinY = 0, cosX = 0, cosY = 0;
let connections = [];
let toDevelop = [];
let data = [];
let all = [];
let tick = 0;

// Loading screen
ctx.fillStyle = "#222";
ctx.fillRect(0, 0, w, h);
ctx.fillStyle = "#ccc";
ctx.font = "50px Verdana";
ctx.fillText(
  "Calculating Nodes",
  w / 2 - ctx.measureText("Calculating Nodes").width / 2,
  h / 2 - 15
);

// Initialize network
function init() {
  connections.length = 0;
  data.length = 0;
  all.length = 0;
  toDevelop.length = 0;

  const connection = new Connection(0, 0, 0, CONFIG.baseSize);
  connection.step = Connection.rootStep;
  connections.push(connection);
  all.push(connection);
  connection.link();

  while (toDevelop.length > 0) {
    toDevelop[0].link();
    toDevelop.shift();
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = CONFIG.repaintColor;
  ctx.fillRect(0, 0, w, h);

  ++tick;

  const rotX = tick * CONFIG.rotVelX;
  const rotY = tick * CONFIG.rotVelY;

  cosX = Math.cos(rotX);
  sinX = Math.sin(rotX);
  cosY = Math.cos(rotY);
  sinY = Math.sin(rotY);

  if (data.length < connections.length * CONFIG.dataToConnections) {
    const datum = new Data(connections[0]);
    data.push(datum);
    all.push(datum);
  }

  ctx.globalCompositeOperation = "lighter";
  ctx.beginPath();
  ctx.lineWidth = CONFIG.wireframeWidth;
  ctx.strokeStyle = CONFIG.wireframeColor;
  
  all.forEach(item => item.step());
  ctx.stroke();
  
  ctx.globalCompositeOperation = "source-over";
  all.sort((a, b) => b.screen.z - a.screen.z);
  all.forEach(item => item.draw());
}

// Event listeners
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

window.addEventListener("resize", debounce(() => {
  CONFIG.vanishPoint.x = (w = canvas.width = window.innerWidth) / 2;
  CONFIG.vanishPoint.y = (h = canvas.height = window.innerHeight) / 2;
  ctx.fillRect(0, 0, w, h);
}, 250));

window.addEventListener("click", init);

// Start
setTimeout(() => {
  init();
  animate();
}, 4); 