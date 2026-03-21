let chunks = new Map(), loadedChunks = new Set()

let workers = Array.from({ length: 4 }, () => {
  let worker = new Worker("./generation/main.js")
  worker.onmessage = receiveMessage
  return { worker, tasks: 0 }
})

function loadChunksAround(centerX, centerZ, renderDist) {
  let chunkX = Math.floor(centerX / CHUNK_SIZE)
  let chunkZ = Math.floor(centerZ / CHUNK_SIZE)

  let toLoad = []

  for (let x = -renderDist; x <= renderDist; x++) {
    for (let z = -renderDist; z <= renderDist; z++) {
      // TODO maybe should be more generous to include chunks partially visible in render distance fog
      let dist = Math.hypot(x, z)
      if (dist <= renderDist) {
        toLoad.push({ dist, x, z })
      }
    }
  }

  toLoad.sort((a, b) => a.dist - b.dist)

  for (let { x, z } of toLoad) {
    loadChunk(x + chunkX, z + chunkZ)
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

function queueGenerateTask(x, z) {
  let id = messageReceivedCallbackId++

  let worker = workers.sort((a, b) => a.tasks - b.tasks)[0]
  worker.tasks++

  return new Promise(resolve => {
    worker.worker.postMessage({ id, data: { x, z } })

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
