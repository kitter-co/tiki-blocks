const { mat4, glMatrix } = window.glMatrix

const debugElem = document.getElementById("debug")
let showDebug = false

let camera = { x: -4, y: 40, z: 27, yaw: glMatrix.toRadian(325), pitch: glMatrix.toRadian(25) }

let keysDown = {}
onkeydown = e => {
  if (!e.metaKey) keysDown[e.code] = "press"
}
onkeyup = e => {
  keysDown[e.code] = false
}

function processKeys() {
  const MOVE_SPEED = 1, LOOK_SPEED = 0.03

  if (keysDown.ArrowDown) camera.pitch += LOOK_SPEED
  if (keysDown.ArrowUp) camera.pitch -= LOOK_SPEED
  if (keysDown.ArrowRight) camera.yaw += LOOK_SPEED
  if (keysDown.ArrowLeft) camera.yaw -= LOOK_SPEED

  camera.pitch = clamp(camera.pitch, -Math.PI / 2, Math.PI / 2)
  camera.yaw %= 2 * Math.PI
  while (camera.yaw < 0) camera.yaw += 2 * Math.PI

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

  if (keysDown.Backquote === "press") {
    debugElem.classList.toggle("show", showDebug = !showDebug)
  }

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
  if (showDebug) {
    debugElem.innerText = [
      `Pos: ${camera.x.toFixed(2)}, ${camera.y.toFixed(4)}, ${camera.z.toFixed(2)}`,
      `Yaw: ${glMatrix.toDegree(camera.yaw).toFixed(1)}, Pitch: ${glMatrix.toDegree(camera.pitch).toFixed(1)}`
    ].join("\n")
  }

  loadedChunks.clear()
  loadChunksAround(camera.x, camera.z, renderDistance)

  clearCanvas()

  useProgram(programs.block)

  useTexture(programs.block.uniform.u_tex, textures.blocks.stone_bricks, 0)

  mat4.fromXRotation(viewMat, camera.pitch)
  mat4.rotateY(viewMat, viewMat, camera.yaw)
  mat4.translate(viewMat, viewMat, [-camera.x, -camera.y, -camera.z])

  gl.uniformMatrix4fv(programs.block.uniform.u_projectionMat, false, projectionMat)
  gl.uniformMatrix4fv(programs.block.uniform.u_viewMat, false, viewMat)

  for (let key of loadedChunks) {
    let chunk = chunks.get(key)
    if (chunk.loading) continue

    gl.uniform2i(programs.block.uniform.u_offset, chunk.x * CHUNK_SIZE, chunk.z * CHUNK_SIZE)

    gl.bindBuffer(gl.ARRAY_BUFFER, chunk.faces.buffer)
    gl.vertexAttribIPointer(programs.block.attrib.a_data, 1, gl.INT, 0, 0)

    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, chunk.faces.data.length)
  }
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

function waitForLoad(promise = null) {
  itemsToLoad++
  promise?.then(itemLoaded)
}

waitForLoad()
onload = itemLoaded
