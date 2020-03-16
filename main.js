var gl;
var index = 0;

var maxNumTriangles = 200;
var maxNumVertices = 3 * maxNumTriangles;
var canvas;
var vBuffer;
var cBuffer;
var vColor;
var vPosition;
var program;
var texture;

var enemyPosition = [];
var lives = 3;
var score;
var speed;
var interval = 3000;
var hitSound;
var loseSound;
var gameOnSound;

// ================== Virus Texture ===============
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(0.19125, 0.0735, 0.0225, 1.0);
var materialDiffuse = vec4(0.7038, 0.27048, 0.0828, 1.0);
var materialSpecular = vec4(0.256777, 0.137622, 0.086014, 1.0);
var materialShininess = 12.8;
// ===============================================

var colors = [
  vec4(1.0, 0.0, 0.0, 1.0), // red
  vec4(1.0, 1.0, 1.0, 1.0), // white
  vec4(1.0, 1.0, 0.0, 1.0), // yellow
  vec4(0.0, 1.0, 0.0, 1.0), // green
  vec4(0.0, 0.0, 1.0, 1.0), // blue
  vec4(1.0, 0.0, 1.0, 1.0), // magenta
  vec4(0.0, 1.0, 1.0, 1.0) // cyan
];

function between(val, min, max) {
  return val >= min && val <= max;
}

window.onload = function() {
  canvas = document.getElementById("glCanvas");

  // Load Audio Files
  hitSound = new Audio("hit.wav");
  loseSound = new Audio("lose.wav");
  gameOnSound = new Audio("gameOn.mp3");

  // Iniitialize Score and Speed
  score = document.getElementById("score").innerHTML;
  speed = document.getElementById("speed").innerHTML;
  score = 0;
  speed = 0;

  document.body.addEventListener("mousemove", function(event) {
    const cursor = document.getElementById("cursor");
    cursor.style.left = event.clientX + "px";
    cursor.style.top = event.clientY - 20 + "px";
  });

  document.getElementById("new-game").addEventListener("click", function() {
    document.getElementById("start-modal").classList.replace("show", "hide");
    gameOnSound.loop = true;
    gameOnSound.play();
    loadGame();
  });

  document.getElementById("retry-game").addEventListener("click", function() {
    console.log("test");
    while (enemyPosition.length > 0) {
      hideOldCovid();
    }
    enemyPosition = [];
    lives = 3;
    interval = 3000;
    speed = 0;
    score = 0;
    document.getElementById("score").innerHTML = score;
    document.getElementById("speed").innerHTML = speed;
    document.getElementById("lives").innerHTML = lives;
    document.getElementById("lose-modal").classList.replace("show", "hide");
    gameOnSound.play();
    loadGame();
  });

  // Setup WebGL in canvas
  gl = WebGLUtils.setupWebGL(canvas);

  if (!gl) {
    alert("WebGL isn't available");
  }

  // Create viewport based on canvas size
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Set defult background color for viewport
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Load vertex-shader
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  // Configure Webgl Buffer
  vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumVertices, gl.STATIC_DRAW);

  vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumVertices, gl.STATIC_DRAW);

  vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  // =========

  render();
};

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.drawArrays(gl.POINTS, 0, index);
  window.requestAnimFrame(render);
}

function loadGame() {
  canvas.addEventListener("mousedown", function(event) {
    if (lives > 0) {
      var mousePosX =
        (2 * (event.clientX - canvas.offsetLeft)) / canvas.width - 1;
      var mousePosY =
        (2 * (canvas.height - event.clientY + canvas.offsetTop)) /
          canvas.height -
        1;
      var isHitVirus = false;

      for (let i = 0; i < enemyPosition.length; i++) {
        if (
          between(
            mousePosX,
            enemyPosition[i].x - 0.03,
            enemyPosition[i].x + 0.03
          ) &&
          between(
            mousePosY,
            enemyPosition[i].y - 0.03,
            enemyPosition[i].y + 0.03
          )
        ) {
          isHitVirus = true;

          mousePosX = enemyPosition[i].x;
          mousePosY = enemyPosition[i].y;
          enemyPosition.splice(i, 1);
        }
      }

      if (isHitVirus) {
        generateCovidShape(vec4(0.0, 0.0, 0.0, 1.0), mousePosX, mousePosY);

        score += 1;
        hitSound.play();
        document.getElementById("score").innerHTML = score;
        isHitVirus = false;

        if (interval >= 1000) {
          interval -= 100;
        }
      }
    } else {
      document.getElementById("lose-modal").classList.replace("hide", "show");
    }
  });

  // Load Generate Opponents
  spawnEnemy();
}

function spawnEnemy() {
  setTimeout(function callback() {
    if (lives > 0 && enemyPosition.length > 0) {
      console.log("Hadoo");
      hideOldCovid();
    }
    generateCovid();
    console.log("masuk");
    if (interval > 1000) {
      interval -= 50;
      speed += 50;
      document.getElementById("speed").innerHTML = speed;
    }
    if (lives > 0) {
      setTimeout(callback, interval);
    } else {
      loseSound.play();
      document.getElementById("lose-modal").classList.replace("hide", "show");
    }
  }, interval);
}

function generateCovid() {
  var randomX = Math.floor(Math.random() * 1000);
  var randomY = Math.floor(Math.random() * 1000);

  var positionX = (2 * Math.floor(randomX % canvas.width)) / canvas.width - 1;
  var positionY =
    (2 * (canvas.height - Math.floor(randomY % canvas.height))) /
      canvas.height -
    1;

  let enemy = {
    x: positionX,
    y: positionY
  };

  enemyPosition.push(enemy);

  generateCovidShape(colors[index % 7], positionX, positionY);

  render();
}

function hideOldCovid() {
  console.log("keluar");
  generateCovidShape(
    vec4(0.0, 0.0, 0.0, 1.0),
    enemyPosition[0].x,
    enemyPosition[0].y
  );

  lives -= 1;
  document.getElementById("lives").innerHTML = lives;
  enemyPosition.shift();
}

function generateCovidShape(color, posX, posY) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  var t = vec2(posX, posY);
  gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index, flatten(t));

  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  t = vec4(color);
  gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(t));

  // ======= Kodingan mengatur tekstur
  var ambientProduct = mult(lightAmbient, materialAmbient);
  var diffuseProduct = mult(lightDiffuse, materialDiffuse);
  var specularProduct = mult(lightSpecular, materialSpecular);
  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition)
  );

  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);
  // ==========================================================
  index++;
}
