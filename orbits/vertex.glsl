#version 300 es
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aColor;

uniform mat4 mv;
uniform mat4 p;

out vec3 vColor;

void main() {
    vColor = aColor;
    gl_Position = p* mv * vec4(aPos, 1.0);
}
