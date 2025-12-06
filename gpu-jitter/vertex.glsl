#version 300 es
in vec2 aPos;
in vec3 aColor;

uniform mat4 mat;

out vec3 vColor;
uniform float time;

void main() {
    //vec4 p = vec4(aPos, 0.0, 1.0);

    float vertexPhase = aPos.x * 5.0 + aPos.y * 3.0;
    //utilized claude ai to figure out offset calculations
    float offsetX = 0.1 * sin(time * 15.0 + vertexPhase);
    float offsetY = 0.1 * cos(time * 15.0 + vertexPhase);

    float amplitude = 0.9 + 0.1 * sin(float(gl_VertexID));
    offsetX *= amplitude;
    offsetY *= amplitude;

    vec2 newPos = aPos + vec2(offsetX, offsetY);
    vec4 p = vec4(newPos, 0.0, 1.0);
    gl_Position = mat * p;


    //gl_Position = vec4(
    //  position.xy*cos(seconds*.6180339887),
    //  position.zw
    //);
    vColor = aColor;
}