const shaderNames = ["test", "block"]

const canvas = document.querySelector("canvas"), gl = canvas.getContext("webgl2")

// SIZING

const NEAR = 0.1, FAR = null, FOV = glMatrix.toRadian(70)
const projectionMat = mat4.create()

let width, height

function resizeCanvas() {
  width = canvas.width = innerWidth * devicePixelRatio
  height = canvas.height = innerHeight * devicePixelRatio

  gl.viewport(0, 0, width, height)

  mat4.perspective(projectionMat, FOV, width / height, NEAR, FAR)
}

resizeCanvas()
onresize = resizeCanvas

// SHADERS

const SHADER_PREFIX = "#version 300 es\nprecision highp float;\nprecision highp int;\n\n"

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

  gl.useProgram(program)

  let vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  let attrib = {}, buffer = {}, uniform = {}

  for (let name in attributes) {
    let { size, type, int, buffer: doBuffer } = attributes[name]

    let attr = attrib[name] = gl.getAttribLocation(program, name)
    gl.enableVertexAttribArray(attr)

    if (doBuffer ?? true) {
      let buff = buffer[name] = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buff)

      if (int) {
        gl.vertexAttribIPointer(attr, size, gl[type], 0, 0)
      } else {
        gl.vertexAttribPointer(attr, size, gl[type], false, 0, 0)
      }
    }
  }

  for (let name of uniforms) {
    uniform[name] = gl.getUniformLocation(program, name)
  }

  return { program, vao, attrib, buffer, uniform }
}

function useProgram(program) {
  gl.useProgram(program.program)
  gl.bindVertexArray(program.vao)
}

const programs = {}
for (let name of shaderNames) {
  waitForLoad(loadShaderProgram(name).then(p => programs[name] = p))
}

// IMAGES

function loadImage(path) {
  let img = new Image()
  img.src = `./assets/${path}.png`

  return new Promise(resolve => {
    img.onload = () => resolve(img)
  })
}

/*
TODO bring back normal texture loading for non-block textures
async function loadTexture(path) {
  let img = await loadImage(path)
  let texture = gl.createTexture()

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)

  return texture
}

function loadTexturesFromObj(obj, path = "") {
  let textures = {}

  if (Array.isArray(obj)) {
    for (let file of obj) {
      waitForLoad(loadTexture(`${path}/${file}`).then(tex => textures[file] = tex))
    }
  } else {
    for (let folder in obj) {
      textures[folder] = loadTexturesFromObj(obj[folder], `${path}/${folder}`)
    }
  }

  return textures
}

const textures = loadTexturesFromObj(imagePaths)
*/

function createTexture(width, height, depth = null, data = null) {
  let array = depth !== null
  let type = array ? gl.TEXTURE_2D_ARRAY : gl.TEXTURE_2D

  let texture = gl.createTexture()

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(type, texture)

  gl.texParameteri(type, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(type, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(type, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(type, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  if (array) {
    gl.texImage3D(type, 0, gl.RGBA, width, height, depth, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)
  } else {
    gl.texImage2D(type, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)
  }

  return texture
}

function useTexture(uniform, texture, index, type = gl.TEXTURE_2D) {
  gl.activeTexture(gl.TEXTURE0 + index)
  gl.bindTexture(type, texture)
  gl.uniform1i(uniform, index)
}

// DRAWING

gl.clearColor(0.714, 0.835, 0.961, 1)

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

gl.enable(gl.DEPTH_TEST)

gl.enable(gl.CULL_FACE)
