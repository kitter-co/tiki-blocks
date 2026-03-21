const { mat4, glMatrix } = window.glMatrix

let camera = { x: -0.5, y: 3.5, z: 4, yaw: glMatrix.toRadian(30), pitch: glMatrix.toRadian(30) }

let keysDown = {}
onkeydown = e => {
  if (!e.metaKey) keysDown[e.code] = "press"
}
onkeyup = e => {
  keysDown[e.code] = false
}

function processKeys() {
  const MOVE_SPEED = 0.1, LOOK_SPEED = 0.03

  if (keysDown.ArrowDown) camera.pitch += LOOK_SPEED
  if (keysDown.ArrowUp) camera.pitch -= LOOK_SPEED
  if (keysDown.ArrowRight) camera.yaw += LOOK_SPEED
  if (keysDown.ArrowLeft) camera.yaw -= LOOK_SPEED

  if (keysDown.Space) camera.y += MOVE_SPEED
  if (keysDown.ShiftLeft) camera.y -= MOVE_SPEED

  let fwd = 0, right = 0
  if (keysDown.KeyW) fwd++
  if (keysDown.KeyS) fwd--
  if (keysDown.KeyD) right++
  if (keysDown.KeyA) right--

  fwd *= MOVE_SPEED
  right *= MOVE_SPEED

  let sin = Math.sin(camera.yaw), cos = Math.cos(camera.yaw)
  camera.x += right * cos + fwd * sin
  camera.z += right * sin - fwd * cos

  for (let i in keysDown) {
    keysDown[i] &&= true
  }
}

function setup() {
  useProgram(programs.block)

  gl.bindBuffer(gl.ARRAY_BUFFER, programs.block.buffer.a_corner)
  gl.bufferData(gl.ARRAY_BUFFER, new Int8Array([0, 1, 3, 2]), gl.STATIC_DRAW)
  gl.vertexAttribDivisor(programs.block.attrib.a_data, 1)
}

const viewMat = mat4.create()

function draw() {
  clearCanvas()

  useProgram(programs.block)

  gl.bindBuffer(gl.ARRAY_BUFFER, programs.block.buffer.a_data)
  gl.bufferData(gl.ARRAY_BUFFER, new Int32Array([
    block(0, 0, 0),
    block(0, 1, 0),
    block(0, 2, 0),
    block(1, 2, 0),
    block(2, 2, 0),
    block(2, 1, 0),
    block(2, 0, 0),
    block(1, 0, 0)
  ].flat()), gl.DYNAMIC_DRAW)

  useTexture(programs.block.uniform.u_tex, textures.blocks.stone_bricks, 0)

  mat4.fromXRotation(viewMat, camera.pitch)
  mat4.rotateY(viewMat, viewMat, camera.yaw)
  mat4.translate(viewMat, viewMat, [-camera.x, -camera.y, -camera.z])

  gl.uniformMatrix4fv(programs.block.uniform.u_projectionMat, false, projectionMat)
  gl.uniformMatrix4fv(programs.block.uniform.u_viewMat, false, viewMat)

  gl.uniform2i(programs.block.uniform.u_offset, 0, 0)

  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 6 * 8)
}

// temporary
function block(x, y, z) {
  let pos = (z << 5 | x) << 8 | y
  return [
    pos,
    pos | 1 << 18,
    pos | 2 << 18,
    pos | 3 << 18,
    pos | 4 << 18,
    pos | 5 << 18
  ]
}

function loaded() {
  setup()
  setInterval(() => {
    processKeys()
    draw()
  }, 1000 / 60)
}

let itemsToLoad = 0, itemsLoaded = 0

function itemLoaded() {
  if (++itemsLoaded === itemsToLoad) {
    console.log("loaded!")
    loaded()
  } else {
    console.log(`loading... ${itemsLoaded}/${itemsToLoad}`)
  }
}

function waitForLoad(promise) {
  itemsToLoad++
  promise.then(itemLoaded)
}
