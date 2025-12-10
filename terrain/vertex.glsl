#version 300 es
precision highp float;

in vec3 aPosition;
in vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

out vec3 vNormal;
out vec3 vPosition;

void main() {
    // Transform to world space
    vec4 worldPos = uModel * vec4(aPosition, 1.0);
    vPosition = worldPos.xyz;
    
    // Transform normal to world space
    vNormal = mat3(uModel) * aNormal;
    
    gl_Position = uProjection * uView * worldPos;
}