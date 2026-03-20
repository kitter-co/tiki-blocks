in vec3 v_texPos;
in float v_brightness;

uniform sampler2D u_tex;

out vec4 outColor;

void main() {
    outColor = texture(u_tex, v_texPos.xy);
    if (outColor.a == 0.0) discard;
    outColor.rgb *= v_brightness;
}
