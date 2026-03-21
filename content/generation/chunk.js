importScripts("../blocks.js")

function computeFaces({ data, heightmap }) {
  let py = [], ny = [], px = [], nx = [], pz = [], nz = []

  // see shaders/block.vsh
  // tttttttt 0rrfffzz zzzxxxxx yyyyyyyy

  for (let x = 0; x < CHUNK_SIZE; x++) {
    let blockDataX = x << 8

    for (let z = 0; z < CHUNK_SIZE; z++) {
      let blockDataXZ = blockDataX | z << 13

      let layerIndex = x + z * CHUNK_SIZE
      let height = heightmap[layerIndex]

      for (let y = 0; y < height; y++) {
        let i = layerIndex + y * CHUNK_LAYER_LEN
        let block = data[i]

        if (isFullBlock(block)) {
          let blockData = blockDataXZ | y

          if (y === height - 1 || isTransparent(data[i + CHUNK_LAYER_LEN])) {
            py.push(blockData)
          }
          if (y > 0 && isTransparent(data[i - CHUNK_LAYER_LEN])) {
            ny.push(blockData | 1 << 18)
          }
          if (x < CHUNK_SIZE - 1 && isTransparent(data[i + 1])) {
            px.push(blockData | 2 << 18)
          }
          if (x > 0 && isTransparent(data[i - 1])) {
            nx.push(blockData | 3 << 18)
          }
          if (z < CHUNK_SIZE - 1 && isTransparent(data[i + CHUNK_SIZE])) {
            pz.push(blockData | 4 << 18)
          }
          if (z > 0 && isTransparent(data[i - CHUNK_SIZE])) {
            nz.push(blockData | 5 << 18)
          }
        } else {
          // TODO other models
        }
      }
    }
  }

  return {
    data: new Int32Array(px.concat(py, pz, nx, ny, nz)),
    lengths: [px.length, py.length, pz.length, nx.length, ny.length, nz.length]
  }
}

function generateChunk(chunkX, chunkZ) {
  let data = new Uint8Array(CHUNK_LEN), heightmap = new Uint8Array(CHUNK_LAYER_LEN)

  for (let x = 0; x < CHUNK_SIZE; x++) {
    let worldX = x + chunkX * CHUNK_SIZE

    for (let z = 0; z < CHUNK_SIZE; z++) {
      let worldZ = z + chunkZ * CHUNK_SIZE

      let layerIndex = x + z * CHUNK_SIZE
      let height = Math.round(getHeight(worldX, worldZ))
      heightmap[layerIndex] = height

      for (let y = 0; y < height; y++) {
        data[layerIndex + y * CHUNK_LAYER_LEN] = 1
      }
    }
  }

  return { data, heightmap }
}

function getHeight(x, z) {
  return (Math.sin(x / 50) + Math.sin(z / 50)) * 15 + (Math.sin(x / 10) + Math.sin(z / 10)) * 4 + 20
}

function isTransparent(id) {
  return !id // TODO store in block data
}

function isFullBlock(id) {
  return id === 1 // TODO store in block data
}
