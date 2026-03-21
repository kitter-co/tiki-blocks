const BLOCK_TEXTURE_SIZE = 16

let blockTextureIndices = {} // name -> index

let blockTextures = new Set(blocks.flatMap(b => [b.texture, b.textureTop, b.textureBottom]))
blockTextures.delete(undefined)
blockTextures = [...blockTextures]

for (let i = 0; i < blockTextures.length; i++) {
  let texture = blockTextures[i]
  blockTextureIndices[texture] = i

  waitForLoad(loadImage(`blocks/${texture}`).then(img => {
    gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, BLOCK_TEXTURE_SIZE, BLOCK_TEXTURE_SIZE, 1, gl.RGBA, gl.UNSIGNED_BYTE, img)
  }))
}

let blockTexture = createTexture(BLOCK_TEXTURE_SIZE, BLOCK_TEXTURE_SIZE, blockTextures.length)
