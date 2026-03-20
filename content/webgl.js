const shaderNames = ["test"]

const canvas = document.querySelector("canvas"), gl = canvas.getContext("webgl2")

let width, height

function resizeCanvas() {
  width = canvas.width = innerWidth * devicePixelRatio
  height = canvas.height = innerHeight * devicePixelRatio

  gl.viewport(0, 0, width, height)
}

resizeCanvas()
onresize = resizeCanvas

// SHADERS

const SHADER_PREFIX = "#version 300 es\nprecision highp float;\n\n"

async function loadShaderProgram(name) {
  let [vs, fs, { attributes, uniforms }] = await Promise.all([
    fetch(`./shaders/${name}.vsh`).then(res => res.text()),
    fetch(`./shaders/${name}.fsh`).then(res => res.text()),
    fetch(`./shaders/${name}.json`).then(res => res.json())
  ])

  let program = gl.createProgram()

  for (let [source, type, typeStr] of [
    [vs, gl.VERTEX_SHADER, "vertex"],
    [fs, gl.FRAGMENT_SHADER, "fragment"]
  ]) {
    let shader = gl.createShader(type)

    gl.shaderSource(shader, SHADER_PREFIX + source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log(`!!! ${typeStr} shader ${typeStr} died !!!`)
      console.log(gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return
    }

    gl.attachShader(program, shader)
  }

  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.log(`!!! shader program ${name} died !!!`)
    console.log(gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return
  }

  program.vao = gl.createVertexArray()

  useProgram(program)

  program.attrib = {}
  program.uniform = {}
  program.buffer = {}

  for (let name in attributes) {
    let { size, type } = attributes[name]

    let attrib = program.attrib[name] = gl.getAttribLocation(program, name)
    let buffer = program.buffer[name] = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.enableVertexAttribArray(attrib)
    gl.vertexAttribPointer(attrib, size, gl[type], false, 0, 0)
  }

  for (let name of uniforms) {
    program.uniform[name] = gl.getUniformLocation(program, name)
  }

  return program
}

function useProgram(program) {
  gl.useProgram(program)
  gl.bindVertexArray(program.vao)
}

const program = {}
for (let name of shaderNames) {
  waitForLoad(loadShaderProgram(name).then(p => program[name] = p))
}

// DRAWING

gl.clearColor(0, 0, 0, 1)

function clearCanvas() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}

gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE)

function blend(enable) {
  if (enable) {
    gl.enable(gl.BLEND)
  } else {
    gl.disable(gl.BLEND)
  }
}
