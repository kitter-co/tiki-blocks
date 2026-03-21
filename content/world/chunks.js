let chunks = new Map(), loadedChunks = new Set()

function getBlockIdAt(x, y, z) {
  if (y < 0 || y >= CHUNK_HEIGHT) return null

  let key = chunkKey(...getChunkAt(x, z))
  if (!chunks.has(key)) return null

  return chunks.get(key).blocks[
    chunkBlockIndex(...wrapPosToChunkSize(x, y, z))
  ]
}

function wrapPosToChunkSize(x, y, z) {
  let [chunkX, chunkZ] = getChunkAt(x, z)
  return [x - chunkX * CHUNK_SIZE, y, z - chunkZ * CHUNK_SIZE]
}

function chunkBlockIndex(x, y, z) {
  return x + z * CHUNK_SIZE + y * CHUNK_LAYER_LEN
}

function getChunkAt(x, z) {
  return [Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE)]
}

let workers = Array.from({ length: 4 }, () => {
  let { promise, resolve } = Promise.withResolvers()

  let worker = new Worker("./generation/main.js")
  let workerData = { worker, tasks: 0, loadingPromise: promise }

  worker.postMessage({ type: "setup", data: { blockTextureIndices } })
  worker.onmessage = () => {
    resolve()
    workerData.loadingPromise = null
    worker.onmessage = receiveMessage
  }

  return workerData
})

function loadChunksAround(centerX, centerZ, renderDist) {
  centerX /= CHUNK_SIZE
  centerZ /= CHUNK_SIZE
  let chunkX = Math.floor(centerX), chunkZ = Math.floor(centerZ)

  let toLoad = []

  for (let x = chunkX - renderDist; x <= chunkX + renderDist; x++) {
    for (let z = chunkZ - renderDist; z <= chunkZ + renderDist; z++) {
      // TODO maybe should be more generous to include chunks partially visible in render distance fog
      let dist = Math.hypot(x - centerX, z - centerZ)
      if (dist <= renderDist) {
        toLoad.push({ dist, x, z })
      }
    }
  }

  toLoad.sort((a, b) => a.dist - b.dist)

  for (let { x, z } of toLoad) {
    loadChunk(x, z)
  }
}

async function loadChunk(x, z) {
  let key = chunkKey(x, z)
  loadedChunks.add(key)

  if (chunks.has(key)) return

  chunks.set(key, { loading: true })

  let chunk = await queueGenerateTask(x, z)
  chunks.set(key, chunk)

  chunk.x = x
  chunk.z = z

  let buffer = chunk.faces.buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, chunk.faces.data, gl.STATIC_DRAW)
}

let messageReceivedCallbacks = new Map(), messageReceivedCallbackId = 0

async function queueGenerateTask(x, z) {
  let id = messageReceivedCallbackId++

  let worker = workers.sort((a, b) => a.tasks - b.tasks)[0]
  worker.tasks++

  if (worker.loadingPromise) await worker.loadingPromise

  return new Promise(resolve => {
    worker.worker.postMessage({ id, type: "generate", data: { x, z } })

    messageReceivedCallbacks.set(id, chunk => {
      worker.tasks--
      resolve(chunk)
    })
  })
}

function receiveMessage({ data: { id, data } }) {
  if (!messageReceivedCallbacks.has(id)) {
    console.error(`Message received from worker with unknown id '${id}'`, data)
    return
  }

  messageReceivedCallbacks.get(id)(data)
  messageReceivedCallbacks.delete(id)
}

function chunkKey(x, z) {
  return `${x}:${z}`
}
