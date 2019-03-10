var map = {
  37: false,
  39: false,
  32: false
};
var inp_left, inp_right;
var player, tracks = [],
  walls = [],
  trains = [],
  coins = [],
  coins_collected = 0,
  jetpacks = 0,
  sneakers = 0,
  score = 0;
var game_over = false;

main();

function main() {

  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  player = new cube(gl, [0, 2, 0]);

  for (i = 0; i < 400; ++i) {
    tracks.push(new track(gl, [0, 0, -i]));
    tracks.push(new track(gl, [-2.0, 0, -i]));
    tracks.push(new track(gl, [2.0, 0, -i]));
  }
  tracks.push(new track(gl, [0, 0, 1]));
  tracks.push(new track(gl, [-2.0, 0, 1]));
  tracks.push(new track(gl, [2.0, 0, 1]));

  for (i = 0; i < 1600; i += 8) {
    walls.push(new wall(gl, [3, 1, -i]));
    walls.push(new wall(gl, [-3, 1, -i]));
  }

  let z = Math.floor(Math.random() * 100) % 20;
  let z1 = Math.floor(Math.random() * 100) % 20;

  jetpacks = new jetpack(gl, [0, 2, player.pos[2] - z]);
  sneakers = new sneaker(gl, [0, 2, player.pos[2] - z1]);

  for (i = 0; i < 40; i += 1) {
    let z = Math.floor(Math.random() * 100) % 50;
    if (i % 3 == 0) coins.push(new coin(gl, [0, 2, -z]));
    else if (i % 3 == 1) coins.push(new coin(gl, [2.0, 2, -z]));
    else if (i % 3 == 2) coins.push(new coin(gl, [-2.0, 2, -z]));
  }

  for (i = 0; i < 5; ++i) {
    let z = Math.floor(Math.random() * 1000) % 400;
    if (i % 3 == 0) trains.push(new train(gl, [0, 2, -z]));
    else if (i % 3 == 1) trains.push(new train(gl, [2.0, 2, -z]));
    else if (i % 3 == 2) trains.push(new train(gl, [-2.0, 2, -z]));
  }
  // trains.push(new train(gl, [0, 2, -10]));

  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;

      // Apply lighting effect

      highp vec3 ambientLight = vec3(1, 1, 1);
      highp vec3 directionalLightColor = vec3(0.5, 0.5, 0.5);
      highp vec3 directionalVector = normalize(vec3(0.0, 0.0, -1));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  // Fragment shader program

  const fsSource = `
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;

    uniform sampler2D uSampler;

    void main(void) {
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

      gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  //const buffers

  var then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001; // convert to seconds
    const deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, deltaTime);
    tick_elements();

    if (game_over) {
      return 0;
    }
    requestAnimationFrame(render);
  }
  if (game_over) {
    return 0;
  }
  requestAnimationFrame(render);
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, deltaTime) {
  gl.clearColor(0.15, 0.59, 1.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  eye = [0, 5, player.pos[2] + 4];
  target = [0, player.pos[1], player.pos[2] - 5];

  const fieldOfView = 45 * Math.PI / 180; // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
    fieldOfView,
    aspect,
    zNear,
    zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  var cameraMatrix = mat4.create();
  // mat4.translate(cameraMatrix, cameraMatrix, [0, 0, 0]);

  var up = [0, 1, 0];

  mat4.lookAt(cameraMatrix, eye, target, up); //out, eye, center(target), up

  var viewMatrix = cameraMatrix; //mat4.create();

  //mat4.invert(viewMatrix, cameraMatrix);

  var viewProjectionMatrix = mat4.create();

  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);


  for (t of tracks)
    t.drawTrack(gl, viewProjectionMatrix, programInfo, deltaTime);

  for (t of trains)
    t.drawTrain(gl, viewProjectionMatrix, programInfo, deltaTime);

  for (c of coins)
    c.drawCoin(gl, viewProjectionMatrix, programInfo, deltaTime);

  for (w of walls)
    w.drawWall(gl, viewProjectionMatrix, programInfo, deltaTime);

  player.drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);

  jetpacks.drawJetpack(gl, viewProjectionMatrix, programInfo, deltaTime);
  sneakers.drawSneaker(gl, viewProjectionMatrix, programInfo, deltaTime);
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
    width, height, border, srcFormat, srcType,
    pixel);

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
      srcFormat, srcType, image);

    // WebGL1 has different requirements for power of 2 images
    // vs non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

onkeydown = onkeyup = function (event) {
  map[event.keyCode] = event.type == 'keydown';
}

function tick_input() {
  if (map[37]) // left
    inp_left = true;
  else if (inp_left) {
    if (player.pos[0] != -1.7)
      player.pos[0] -= 1.7;
    inp_left = false;
  }
  if (map[39]) // right
    inp_right = true;
  else if (inp_right) {
    if (player.pos[0] != 1.7)
      player.pos[0] += 1.7;
    inp_right = false;
  }
  if (map[32] && !player.jetpack) // space
  {
    if (!player.jump) {
      player.jump = true;
      if (!player.sneaker) {
        player.acceleration = 0.8;
      } else {
        player.acceleration = 1.2;
      }
    }
  }
};

function tick_elements() {
  tick_input();
  move_objects();
  collisions();
  if ((-player.pos[2]) % 2 == 0) ++score;
  // player.pos[2] -= player.speed;

  for (t of trains) {
    t.tick();
    t.pos[2] += t.speed;
  }
  for (c of coins) {
    c.tick();
  }
  sneakers.tick();
  jetpacks.tick();
  player.tick();

  if (player.jump) {
    player.pos[1] += player.acceleration;
    player.acceleration -= 0.1;
    if (player.acceleration <= -0.8)
      player.jump = false;
  }

  if (player.jetpack) {
    player.pos[1] += 0.1;
    if (player.pos[1] > 5)
      player.pos[1] = 5;
    player.rotation = Math.PI;
  }
};

function move_objects() {
  for (t of trains) {
    if (t.pos[2] > player.pos[2] + 30)
      t.pos[2] -= 100;
  }
  for (c of coins) {
    c.rotation += 0.1;
    if (c.pos[2] > player.pos[2] + 30)
      c.pos[2] -= 100;
  }
};

function collisions() {
  for (c of coins) {
    if (detect_collisions(c.bounding_box, player.bounding_box)) {
      c.pos[2] -= 100;
      coins_collected += 1;
      console.log('COIN!');
    }
  }

  for (t of trains) {
    console.log(t.bounding_box, player.bounding_box)
    if (detect_collisions(t.bounding_box, player.bounding_box)) {
      console.log('GAME OVER');
      game_over = true;
    }
  }
};

function detect_collisions(a, b) {
  var temp = (Math.abs(a.x - b.x) * 2 < (a.len_x + b.len_x)) &&
    (Math.abs(a.y - b.y) * 2 < (a.len_y + b.len_y)) &&
    (Math.abs(a.z - b.z) * 2 < (a.len_z + b.len_z));
  // console.log (a, b);
  console.log(temp);
  return temp;
};