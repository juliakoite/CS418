
let program;
let tetrahedronVAO, octahedronVAO;
let tetrahedronIndexCount, octahedronIndexCount;


const tetrahedron = {
    positions: [[1,1,1], [-1,-1,1], [-1,1,-1], [1,-1,-1]],
    colors: [[1,1,1], [0,0,1], [0,1,0], [1,0,0]],
    indices: [[0,1,2], [0,2,3], [0,3,1], [1,2,3]]
};

const octahedron = {
    positions: [[1,0,0],[0,1,0],[0,0,1],[0,-1,0],[0,0,-1],[-1,0,0]],
    colors: [[1,0.5,0.5],[0.5,1,0.5],[0.5,0.5,1],[0.5,0,0.5],[0.5,0.5,0],[0,0.5,0.5]],
    indices: [[0,1,2], [0,2,3], [0,3,4], [0,4,1], [5,1,4], [5,4,3], [5,3,2], [5,2,1]]
};

async function loadFile(url) {
    const response = await fetch(url);
    return await response.text();
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        return null;
    }
    
    return program;
}

function createVAO(gl, positions, colors, indices) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    
    // Flatten positions and colors
    const flatPositions = positions.flat();
    const flatColors = colors.flat();
    const flatIndices = indices.flat();
    
    // Position buffer (location 0)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatPositions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    
    // Color buffer (location 1)
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatColors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    
    // Index buffer
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatIndices), gl.STATIC_DRAW);
    
    gl.bindVertexArray(null);
    
    return { vao, indexCount: flatIndices.length };
}

async function setup() {
    console.log("in setup");
    window.gl = document.querySelector('canvas').getContext('webgl2')
    const vs = await fetch('./vertex.glsl').then(res => res.text())
    const fs = await fetch('./fragment.glsl').then(res => res.text())
    window.program = compile(vs,fs)
    
    // Create VAOs
    const tetraData = createVAO(gl, tetrahedron.positions, tetrahedron.colors, tetrahedron.indices);
    tetrahedronVAO = tetraData.vao;
    tetrahedronIndexCount = tetraData.indexCount;
    
    const octaData = createVAO(gl, octahedron.positions, octahedron.colors, octahedron.indices);
    octahedronVAO = octaData.vao;
    octahedronIndexCount = octaData.indexCount;
    
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    
    // Start animation
    fillScreen();
    window.addEventListener('resize', fillScreen);
    requestAnimationFrame(draw);
}

function compile(vs_source, fs_source) {
    const vs = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vs, vs_source)
    gl.compileShader(vs)
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vs))
        throw Error("Vertex shader compilation failed")
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fs, fs_source)
    gl.compileShader(fs)
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fs))
        throw Error("Fragment shader compilation failed")
    }

    const program = gl.createProgram()
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program))
        throw Error("Linking failed")
    }
    
    const uniforms = {}
    for(let i=0; i<gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i+=1) {
        let info = gl.getActiveUniform(program, i)
        uniforms[info.name] = gl.getUniformLocation(program, info.name)
    }
    program.uniforms = uniforms;

    return program;
}

//fillscreen in code example
function fillScreen() {
    let canvas = document.querySelector('canvas')
    document.body.style.margin = '0'
    canvas.style.width = '100vw'
    canvas.style.height = '100vh'
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
    canvas.style.width = ''
    canvas.style.height = ''
    if (window.gl) {
        gl.viewport(0,0, canvas.width, canvas.height)
        window.p = m4perspNegZ(0.1, 10, 1.5, canvas.width, canvas.height)
    }
}

function drawBody(vao, indexCount, modelMatrix) {
    gl.bindVertexArray(vao);
    
    const aspect = gl.canvas.width / gl.canvas.height;
    const projection = Matrix.perspective(Math.PI / 4, aspect, 0.1, 100);
    const view = Matrix.lookAt([0, 5, 15], [0, 0, 0], [0, 1, 0]);
    
    let mvp = Matrix.multiply(projection, view);
    mvp = Matrix.multiply(mvp, modelMatrix);
    
    const mvpLoc = gl.getUniformLocation(program, 'uMVP');
    gl.uniformMatrix4fv(mvpLoc, false, mvp);
    
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
}

function draw(timestamp) {
    const seconds = timestamp / 1000;
    
    gl.clearColor(0.1, 0.1, 0.15, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.useProgram(program);
    
    // Sun - large octahedron at origin, spinning
    const sunRotation = (seconds / 2) * Math.PI * 2; // Full rotation every 2 seconds
    const sunModel = Matrix.multiply(
        Matrix.rotateY(sunRotation),
        Matrix.scale(2, 2, 2)
    );
    drawBody(octahedronVAO, octahedronIndexCount, sunModel);
    
    // Earth - smaller octahedron orbiting and spinning
    const earthOrbitPeriod = 4; // seconds for one orbit
    const earthSpinPeriod = 0.5; // seconds for one spin
    const earthOrbitAngle = (seconds / earthOrbitPeriod) * Math.PI * 2;
    const earthSpinAngle = (seconds / earthSpinPeriod) * Math.PI * 2;
    const earthDistance = 5;
    
    const earthModel = Matrix.multiply(
        Matrix.rotateY(earthOrbitAngle),
        Matrix.multiply(
            Matrix.translate(earthDistance, 0, 0),
            Matrix.multiply(
                Matrix.rotateY(earthSpinAngle),
                Matrix.scale(0.8, 0.8, 0.8)
            )
        )
    );
    drawBody(octahedronVAO, octahedronIndexCount, earthModel);
    
    // Mars - 1.6x farther, 1.9x slower orbit, 2.2x slower spin
    const marsOrbitPeriod = earthOrbitPeriod * 1.9;
    const marsSpinPeriod = earthSpinPeriod * 2.2;
    const marsOrbitAngle = (seconds / marsOrbitPeriod) * Math.PI * 2;
    const marsSpinAngle = (seconds / marsSpinPeriod) * Math.PI * 2;
    const marsDistance = earthDistance * 1.6;
    
    const marsModel = Matrix.multiply(
        Matrix.rotateY(marsOrbitAngle),
        Matrix.multiply(
            Matrix.translate(marsDistance, 0, 0),
            Matrix.multiply(
                Matrix.rotateY(marsSpinAngle),
                Matrix.scale(0.7, 0.7, 0.7)
            )
        )
    );
    drawBody(octahedronVAO, octahedronIndexCount, marsModel);
    
    // Moon - orbits Earth, tidally locked
    const moonOrbitPeriod = 2; // Faster than Earth's orbit, slower than Earth's spin
    const moonOrbitAngle = (seconds / moonOrbitPeriod) * Math.PI * 2;
    const moonDistance = 1.5;
    
    const moonModel = Matrix.multiply(
        Matrix.rotateY(earthOrbitAngle),
        Matrix.multiply(
            Matrix.translate(earthDistance, 0, 0),
            Matrix.multiply(
                Matrix.rotateY(moonOrbitAngle),
                Matrix.multiply(
                    Matrix.translate(moonDistance, 0, 0),
                    Matrix.multiply(
                        Matrix.rotateY(-moonOrbitAngle), // Tidally locked
                        Matrix.scale(0.3, 0.3, 0.3)
                    )
                )
            )
        )
    );
    drawBody(tetrahedronVAO, tetrahedronIndexCount, moonModel);
    
    // Phobos - orbits Mars fast, tidally locked
    const phobosOrbitPeriod = 0.3; // Several times faster than Mars spins
    const phobosOrbitAngle = (seconds / phobosOrbitPeriod) * Math.PI * 2;
    const phobosDistance = 1.2;
    
    const phobosModel = Matrix.multiply(
        Matrix.rotateY(marsOrbitAngle),
        Matrix.multiply(
            Matrix.translate(marsDistance, 0, 0),
            Matrix.multiply(
                Matrix.rotateY(phobosOrbitAngle),
                Matrix.multiply(
                    Matrix.translate(phobosDistance, 0, 0),
                    Matrix.multiply(
                        Matrix.rotateY(-phobosOrbitAngle), // Tidally locked
                        Matrix.scale(0.25, 0.25, 0.25)
                    )
                )
            )
        )
    );
    drawBody(tetrahedronVAO, tetrahedronIndexCount, phobosModel);
    
    // Deimos - half size of Phobos, twice as far, slower orbit, tidally locked
    const deimosOrbitPeriod = marsSpinPeriod * 0.9; // Only a little faster than Mars spins
    const deimosOrbitAngle = (seconds / deimosOrbitPeriod) * Math.PI * 2;
    const deimosDistance = phobosDistance * 2;
    
    const deimosModel = Matrix.multiply(
        Matrix.rotateY(marsOrbitAngle),
        Matrix.multiply(
            Matrix.translate(marsDistance, 0, 0),
            Matrix.multiply(
                Matrix.rotateY(deimosOrbitAngle),
                Matrix.multiply(
                    Matrix.translate(deimosDistance, 0, 0),
                    Matrix.multiply(
                        Matrix.rotateY(-deimosOrbitAngle), // Tidally locked
                        Matrix.scale(0.125, 0.125, 0.125)
                    )
                )
            )
        )
    );
    drawBody(tetrahedronVAO, tetrahedronIndexCount, deimosModel);
    
    requestAnimationFrame(draw);
}

window.addEventListener('DOMContentLoaded', setup);