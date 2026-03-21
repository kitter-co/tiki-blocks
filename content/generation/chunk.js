importScripts("../world/block_data.js")

function computeFaces({ blocks, heightmap }) {
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
        let block = blocks[i], data = blocksById[block]

        if (data.invisible) continue

        let tex = blockTextureIndices[data.texture]
        let blockData = blockDataXZ | y | tex << 24

        if (y === height - 1 || isTransparent(blocks[i + CHUNK_LAYER_LEN])) {
          py.push(blockData)
        }
        if (y > 0 && isTransparent(blocks[i - CHUNK_LAYER_LEN])) {
          ny.push(blockData | 1 << 18)
        }
        if (x < CHUNK_SIZE - 1 && isTransparent(blocks[i + 1])) {
          px.push(blockData | 2 << 18)
        }
        if (x > 0 && isTransparent(blocks[i - 1])) {
          nx.push(blockData | 3 << 18)
        }
        if (z < CHUNK_SIZE - 1 && isTransparent(blocks[i + CHUNK_SIZE])) {
          pz.push(blockData | 4 << 18)
        }
        if (z > 0 && isTransparent(blocks[i - CHUNK_SIZE])) {
          nz.push(blockData | 5 << 18)
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
  let blocks = new Uint8Array(CHUNK_LEN), heightmap = new Uint8Array(CHUNK_LAYER_LEN)

  for (let x = 0; x < CHUNK_SIZE; x++) {
    let worldX = x + chunkX * CHUNK_SIZE

    for (let z = 0; z < CHUNK_SIZE; z++) {
      let worldZ = z + chunkZ * CHUNK_SIZE

      let layerIndex = x + z * CHUNK_SIZE
      let height = Math.round(getHeight(worldX, worldZ))
      heightmap[layerIndex] = height

      for (let y = 0; y < height; y++) {
        let block = 1
        if (y === height - 1) {
          let noise = Math.sin(worldX / 13) + Math.sin(worldZ / 13)
          let slope = getSlope(worldX, worldZ) + noise / 4
          if (slope < 0.3) block = 2
          else if (slope < 0.5) block = noise > 0.5 ? 4 : 3
          else if (slope < 0.6) block = 4
        }
        blocks[layerIndex + y * CHUNK_LAYER_LEN] = block
      }
    }
  }

  return { blocks, heightmap }
}

function getHeight(x, z) {
  return (Math.sin(x / 50) + Math.sin(z / 50)) * 15 + (Math.sin(x / 10) + Math.sin(z / 10)) * 4 + 20
}
// temporary
function getSlope(x, z) {
  return Math.hypot(0.3 * Math.cos(x / 50) + 0.4 * Math.cos(x / 10), 0.3 * Math.cos(z / 50) + 0.4 * Math.cos(z / 10))
}

function isTransparent(id) {
  return blocksById[id].transparent
}
