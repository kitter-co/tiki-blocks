function draw() {
  clearCanvas()

  useProgram(program.test)

  gl.bindBuffer(gl.ARRAY_BUFFER, program.test.buffer.a_pos)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.3, 0.3, 0.7, 0.3, 0.3, 0.7, 0.7, 0.7]), gl.DYNAMIC_DRAW)

  gl.uniform1f(program.test.uniform.u_red, Math.sin(Date.now() / 1000) / 2 + 0.5)

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}

function loaded() {
  setInterval(draw, 1000 / 60)
}

let itemsToLoad = 0, itemsLoaded = 0

function waitForLoad(promise) {
  itemsToLoad++

  promise.then(() => {
    if (++itemsLoaded === itemsToLoad) {
      loaded()
    }
  })
}
