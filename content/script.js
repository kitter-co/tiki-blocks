Object.assign(window, glMatrix) // jank

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
    //tttttttt 0rrfffzz zzzxxxxx yyyyyyyy
    0b00000000_00000000_01100001_00000001,
    0b00000000_00000100_01100001_00000001,
    0b00000000_00001000_01100001_00000001,
    0b00000000_00001100_01100001_00000001,
    0b00000000_00010000_01100001_00000001,
    0b00000000_00010100_01100001_00000001,
  ]), gl.DYNAMIC_DRAW)

  useTexture(programs.block.uniform.u_tex, textures.blocks.stone_bricks, 0)

  mat4.identity(viewMat) // TODO

  gl.uniformMatrix4fv(programs.block.uniform.u_projectionMat, false, projectionMat)
  gl.uniformMatrix4fv(programs.block.uniform.u_viewMat, false, viewMat)

  gl.uniform2i(programs.block.uniform.u_offset, 0, -10)

  gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 6)
}

function loaded() {
  setup()
  setInterval(draw, 1000 / 60)
}

let itemsToLoad = 0, itemsLoaded = 0

function itemLoaded() {
  if (++itemsLoaded === itemsToLoad) {
    loaded()
  }
  console.log(`loading... ${itemsLoaded}/${itemsToLoad}`)
}

function waitForLoad(promise) {
  itemsToLoad++
  promise.then(itemLoaded)
}
