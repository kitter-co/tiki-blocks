importScripts("../utils.js", "./chunk.js")

let blockTextureIndices

onmessage = ({ data: { id, type, data } }) => {
  if (type === "setup") {
    blockTextureIndices = data.blockTextureIndices
    postMessage(null)
  } else if (type === "generate") {
    let chunk = generateChunk(data.x, data.z)
    chunk.faces = computeFaces(chunk)

    postMessage(
      { id, data: chunk },
      { transfer: [chunk.faces.data.buffer] }
    )
  } else {
    console.error(`Unknown message type sent to worker '${type}'`, data)
  }
}
