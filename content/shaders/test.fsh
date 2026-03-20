in vec2 v_pos;

uniform float u_red;

out vec4 outColor;

void main() {
    outColor = vec4(u_red, v_pos, 1);
}
