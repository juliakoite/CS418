const IlliniBlue = new Float32Array([0.075, 0.16, 0.292, 1]);
const IlliniOrange = new Float32Array([1, 0.373, 0.02, 1]);

let gl;
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
    

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatPositions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatColors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(flatIndices), gl.STATIC_DRAW);
    
    //gl.bindVertexArray(0);
    
    return { vao, indexCount: flatIndices.length };
}


async function setup() {
    console.log("in setup");
    gl = document.querySelector('canvas').getContext('webgl2');
    const vs = await fetch('./vertex.glsl').then(res => res.text());
    const fs = await fetch('./fragment.glsl').then(res => res.text());
    program = compile(vs,fs);
    
    // Create VAOs
    const tetraData = createVAO(gl, tetrahedron.positions, tetrahedron.colors, tetrahedron.indices);
    tetrahedronVAO = tetraData.vao;
    tetrahedronIndexCount = tetraData.indexCount;
    
    const octaData = createVAO(gl, octahedron.positions, octahedron.colors, octahedron.indices);
    octahedronVAO = octaData.vao;
    octahedronIndexCount = octaData.indexCount;
    
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);
    

    fillScreen();
    window.addEventListener('resize', fillScreen);
    
    requestAnimationFrame(tick);
}



function compile(vs_source, fs_source) {
    console.log("compiling shader");
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
    console.log("Found uniforms:", uniforms)

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
    if (gl) {
        gl.viewport(0,0, canvas.width, canvas.height)
        window.p = m4perspNegZ(0.1, 10, 1.5, canvas.width, canvas.height)
        console.log("p =", window.p);
    }
}

function drawBody(vao, indexCount, modelMatrix) {
    console.log("drawBody called - vao:", vao, "indexCount:", indexCount);
    gl.bindVertexArray(vao);

    const view = m4view([0, 10, 25], [0, 0, 0], [0, 1, 0]);
    const mv = m4mul(view, modelMatrix);
    const mvLoc = gl.getUniformLocation(program, 'mv');
    const pLoc = gl.getUniformLocation(program, 'p');

    // console.log("program =", program);
    //  console.log("mv =", mv);
    //  console.log("p =", window.p);

    gl.uniformMatrix4fv(mvLoc, false, mv);
    gl.uniformMatrix4fv(pLoc, false, window.p);
    
    // const aspect = gl.canvas.width / gl.canvas.height;
    // const projection = m4perspNegZ(Math.PI / 4, aspect, 0.1, 100);
    // const view = m4view([0, 5, 15], [0, 0, 0], [0, 1, 0]);
    
    // let mvp =m4mul(projection, view);
    // mvp = m4mul(mvp, modelMatrix);
    
    // const mvpLoc = gl.getUniformLocation(program, 'uMVP');
    // gl.uniformMatrix4fv(mvpLoc, false, mvp);
    
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

}

function tick(milliseconds) {
    const seconds = milliseconds / 1000
    draw(seconds)
    requestAnimationFrame(tick) // <- only call this here, nowhere else
}

function draw(seconds) {
    //const seconds = milliseconds / 1000;
    //console.log("Drawing frame at", seconds, "seconds"); // ADD THIS

    gl.clearColor(...IlliniBlue);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.useProgram(program);
    //gl.clear(gl.COLOR_BUFFER_BIT)
    //gl.useProgram(program)

    //gl.bindVertexArray(vao)

    //gl.uniform4fv(program.uniforms.color, IlliniOrange)
    
    const sunRotation = (seconds / 2) * Math.PI * 2; 
    const sunModel = m4mul(
        m4rotY(sunRotation),
        m4scale(2, 2, 2)
    );

    drawBody(octahedronVAO, octahedronIndexCount, sunModel);
    
    const earthOrbitPeriod = 4;
    const earthSpinPeriod = 0.5; 
    const earthOrbitAngle = (seconds / earthOrbitPeriod) * Math.PI * 2;
    const earthSpinAngle = (seconds / earthSpinPeriod) * Math.PI * 2;
    const earthDistance = 5;


    // const m_scale = m4scale(.8,.8,.8);
    // const m_rotate_spin = m4rotY(earthSpinAngle);
    // const m_prod = m4mul(m_rotate_spin, m_scale);
    // const m_trans = m4trans(earthDistance, 0, 0);
    // const m_rotate_y = m4rotY(earthOrbitAngle);

        const earthModel = m4mul(
        m4rotY(earthOrbitAngle),
        m4trans(earthDistance, 0, 0),
        m4rotY(earthSpinAngle),
        m4scale(0.8, 0.8, 0.8)
    );

    //m_final_prod = m4mul(m_trans, m_prod);
    //const earthModel = m4mul(m_rotate_y, m_final_prod);


    drawBody(octahedronVAO, octahedronIndexCount, earthModel);
    
    const marsOrbitPeriod = earthOrbitPeriod * 1.9;
    const marsSpinPeriod = earthSpinPeriod * 2.2;
    const marsOrbitAngle = (seconds / marsOrbitPeriod) * Math.PI * 2;
    const marsSpinAngle = (seconds / marsSpinPeriod) * Math.PI * 2;
    const marsDistance = earthDistance * 1.6;
    
    const marsModel = m4mul(
        m4rotY(marsOrbitAngle),
        m4trans(marsDistance, 0, 0),
        m4rotY(marsSpinAngle),
        m4scale(0.7, 0.7, 0.7)
    );

    drawBody(octahedronVAO, octahedronIndexCount, marsModel);
    
    const moonOrbitPeriod = 2; 
    const moonOrbitAngle = (seconds / moonOrbitPeriod) * Math.PI * 2;
    const moonDistance = 1.5;
    
    //used llm to understand some matrix multiplications concepts
 
       const moonModel = m4mul(
        m4rotY(earthOrbitAngle),
        m4trans(earthDistance, 0, 0),
        m4rotY(moonOrbitAngle),
        m4trans(moonDistance, 0, 0),
        m4rotY(-moonOrbitAngle),
        m4scale(0.3, 0.3, 0.3)

    );

    drawBody(tetrahedronVAO, tetrahedronIndexCount, moonModel);
    
    const phobosOrbitPeriod = 0.3; 
    const phobosOrbitAngle = (seconds / phobosOrbitPeriod) * Math.PI * 2;
    const phobosDistance = 1.2;
    
    const phobosModel = m4mul(
    m4rotY(marsOrbitAngle),
    m4trans(marsDistance, 0, 0),
    m4rotY(phobosOrbitAngle),
    m4trans(phobosDistance, 0, 0),
    m4rotY(-phobosOrbitAngle),
    m4scale(0.25, 0.25, 0.25)
    );
    drawBody(tetrahedronVAO, tetrahedronIndexCount, phobosModel);
    
    const deimosOrbitPeriod = marsSpinPeriod * 0.9; 
    const deimosOrbitAngle = (seconds / deimosOrbitPeriod) * Math.PI * 2;
    const deimosDistance = phobosDistance * 2;
    
    const deimosModel = m4mul(
    m4rotY(marsOrbitAngle),
    m4trans(marsDistance, 0, 0),
    m4rotY(deimosOrbitAngle),
    m4trans(deimosDistance, 0, 0),
    m4rotY(-deimosOrbitAngle),
    m4scale(0.125, 0.125, 0.125)
    );

    drawBody(tetrahedronVAO, tetrahedronIndexCount, deimosModel);
    
}

window.addEventListener('load', setup)

//from code example

// window.addEventListener('load', async (event) => {
//     window.gl = document.querySelector('canvas').getContext('webgl2',
//         // optional configuration object: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
//         {antialias: false, depth:true, preserveDrawingBuffer:true}
//     )
//     let vs = document.querySelector('./vertex.glsl').getContext(webgl2)
//     let fs = document.querySelector('./fragment.glsl').getContext(webgl2)
//     window.program = compileShader(vs,fs)
//     gl.enable(gl.DEPTH_TEST)
//     window.geom = setupGeomery(tetrahedron)
//     fillScreen()
//     window.addEventListener('resize', fillScreen)
//     requestAnimationFrame(tick)
// })