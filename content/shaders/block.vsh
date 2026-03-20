/*
face data packing:

tttttttt 0rrfffzz zzzxxxxx yyyyyyyy

y/x/z = position
f = face [+y, -y, +x, -x, +z, -z]
r = texture rotation (ccw)
t = texture index
*/

const float[] FACE_BRIGHTNESS = float[](
    1.0, 0.4, 0.8, 0.8, 0.6, 0.6
);

in int a_data;
in int a_corner;

uniform ivec2 u_offset;

uniform mat4 u_viewMat;
uniform mat4 u_projectionMat;

out vec3 v_texPos;
out float v_brightness;

void main() {
    int data = a_data;

    int y    = data & 255; data >>= 8;
    int x    = data & 31;  data >>= 5;
    int z    = data & 31;  data >>= 5;
    int face = data & 7;   data >>= 3;
    int rot  = data & 7;   data >>= 3;
    int tex  = data;

    ivec3 pos = ivec3(x + u_offset.x, y, z + u_offset.y);

    /*
    corners:

    3 -- 2
    |    |
    0 -- 1
    */
    int corner = (a_corner + rot) & 3;
    //                         1 if x offset -------------¬  1 if y offset
    ivec3 cornerOffset = ivec3((corner & 1) ^ (corner >> 1), corner >> 1, 1);

    if (face == 0) {
        pos += cornerOffset.yzx;
    } else if (face == 1) {
        pos.xz += cornerOffset.xy;
    } else if (face == 2) {
        pos.z += 1 - cornerOffset.x;
        pos.xy += cornerOffset.zy;
    } else if (face == 3) {
        pos.yz += cornerOffset.yx;
    } else if (face == 4) {
        pos += cornerOffset;
    } else if (face == 5) {
        pos.x += 1 - cornerOffset.x;
        pos.y += cornerOffset.y;
    }

//    gl_Position = vec4(cornerOffset.x, cornerOffset.y, 0, 1);
    gl_Position = u_projectionMat * u_viewMat * vec4(pos, 1);

    v_brightness = FACE_BRIGHTNESS[face];
    v_texPos = vec3((a_corner & 1) ^ (a_corner >> 1), 1 - (a_corner >> 1), tex);
}
