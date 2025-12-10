#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vPosition;

uniform vec3 uLightPosition;  // World space
uniform vec3 uCameraPosition; // World space
uniform vec3 uDiffuseColor;   // Earth tone (e.g., 0.6, 0.4, 0.2)
uniform vec3 uSpecularColor;  // White (1, 1, 1)
uniform float uShininess;     // e.g., 32.0

out vec4 fragColor;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(uLightPosition - vPosition);
    vec3 viewDir = normalize(uCameraPosition - vPosition);
    vec3 halfDir = normalize(lightDir + viewDir);
    
    // Diffuse
    float diffuse = max(dot(normal, lightDir), 0.0);
    
    // Specular (Blinn-Phong)
    float specular = pow(max(dot(normal, halfDir), 0.0), uShininess);
    
    vec3 color = uDiffuseColor * diffuse + uSpecularColor * specular;
    fragColor = vec4(color, 1.0);
}