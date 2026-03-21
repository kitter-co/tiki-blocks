let renderDistance = 12

// cannot be bigger than 32, 256 or many things will die
const CHUNK_SIZE = 32, CHUNK_HEIGHT = 256

const CHUNK_LAYER_LEN = CHUNK_SIZE ** 2, CHUNK_LEN = CHUNK_LAYER_LEN * CHUNK_HEIGHT

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x))
}
