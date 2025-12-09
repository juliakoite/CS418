#version 300 es
layout(location=0)in vec2 aPos;
layout(location=1) in vec3 aColor;

uniform mat4 mat;

out vec3 vColor;
uniform float time;

void main() {
    //vec4 p = vec4(aPos, 0.0, 1.0);

    vec4 p = vec4(aPos, 0.0, 1.0);
    gl_Position = mat * p;


    //gl_Position = vec4(
    //  position.xy*cos(seconds*.6180339887),
    //  position.zw
    //);
    vColor = aColor;
}