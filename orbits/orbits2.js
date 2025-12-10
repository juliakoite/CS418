const IlliniBlue = new Float32Array([0.075, 0.16, 0.292, 1])
const IlliniOrange = new Float32Array([1, 0.373, 0.02, 1])
const IdentityMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1])



//used 3d code example for structure and understanding matrix operations

/**
 * Given the source code of a vertex and fragment shader, compiles them,
 * and returns the linked program.
 */
function compileShader(vs_source, fs_source) {
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
    program.uniforms = uniforms

    return program
}

/**
 * Sends per-vertex data to the GPU and connects it to a VS input
 * 
 * @param data    a 2D array of per-vertex data (e.g. [[x,y,z,w],[x,y,z,w],...])
 * @param loc     the layout location of the vertex shader's `in` attribute
 * @param mode    (optional) gl.STATIC_DRAW, gl.DYNAMIC_DRAW, etc
 * 
 * @returns the ID of the buffer in GPU memory; useful for changing data later
 */
function supplyDataBuffer(data, loc, mode) {
    if (mode === undefined) mode = gl.STATIC_DRAW
    
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    const f32 = new Float32Array(data.flat())
    gl.bufferData(gl.ARRAY_BUFFER, f32, mode)
    
    gl.vertexAttribPointer(loc, data[0].length, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(loc)
    
    return buf;
}

/**
 * Creates a Vertex Array Object and puts into it all of the data in the given
 * JSON structure, which should have the following form:
 * 
 * ````
 * {"triangles": a list of of indices of vertices
 * ,"attributes":
 *  [ a list of 1-, 2-, 3-, or 4-vectors, one per vertex to go in location 0
 *  , a list of 1-, 2-, 3-, or 4-vectors, one per vertex to go in location 1
 *  , ...
 *  ]
 * }
 * ````
 * 
 * @returns an object with four keys:
 *  - mode = the 1st argument for gl.drawElements
 *  - count = the 2nd argument for gl.drawElements
 *  - type = the 3rd argument for gl.drawElements
 *  - vao = the vertex array object for use with gl.bindVertexArray
 */
function setupGeomery(geom) {
    var triangleArray = gl.createVertexArray()
    gl.bindVertexArray(triangleArray)

    for(let i=0; i<geom.attributes.length; i+=1) {
        let data = geom.attributes[i]
        supplyDataBuffer(data, i)
    }

    var indices = new Uint16Array(geom.triangles.flat())
    var indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    return {
        mode: gl.TRIANGLES,
        count: indices.length,
        type: gl.UNSIGNED_SHORT,
        vao: triangleArray
    }
}

var tetrahedron =
    {"triangles":
        [0,1,2
        ,0,2,3
        ,0,3,1
        ,1,2,3
        ]
    ,"attributes":
        [ // position
            [[1,1,1]
            ,[ -1,-1,1]
            ,[-1,1,-1]
            ,[ 1,-1,-1]
            ]
        , // color
            [[1,1,1]
            ,[0,0,1]
            ,[0,1,0]
            ,[1,0,0]
            ]
        ]
    }


var octahedron =
    {"triangles":
        [0,1,2
        ,0,2,3
        ,0,3,4
        ,0,4,1
        ,5,1,4
        ,5,4,3
        ,5,3,2
        ,5,2,1
        ]
    ,"attributes":
        [ // position
        [[1,0,0],
        [0,1,0],
        [0,0,1],
        [0,-1,0],
        [0,0,-1],
        [-1,0,0]]
        , // color
        [[1,0.5,0.5],
        [0.5,1,0.5],
        [0.5,0.5,1],
        [0.5,0,0.5],
        [0.5,0.5,0],
        [0,0.5,0.5]]
        ]
    }



// const octahedron = {
//     positions: [[1,0,0],[0,1,0],[0,0,1],[0,-1,0],[0,0,-1],[-1,0,0]],
//     colors: [[1,0.5,0.5],[0.5,1,0.5],[0.5,0.5,1],[0.5,0,0.5],[0.5,0.5,0],[0,0.5,0.5]],
//     indices: [[0,1,2], [0,2,3], [0,3,4], [0,4,1], [5,1,4], [5,4,3], [5,3,2], [5,2,1]]
// };


function drawBody(geom, modelMatrix) {
    gl.bindVertexArray(geom.vao);
    const view = m4view([0,10,25],[0,0,0,],[0,1,0]);

    const mv = m4mul(view, modelMatrix);
    
    gl.uniformMatrix4fv(program.uniforms.mv, false, mv);
    gl.uniformMatrix4fv(program.uniforms.p, false, window.p);
    
    gl.drawElements(geom.mode, geom.count, geom.type, 0);
}



function draw(seconds) {
    gl.clearColor(...IlliniBlue) // f(...[1,2,3]) means f(1,2,3)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(program)

    //gl.bindVertexArray(geom.vao)

    const sunRotation = (seconds / 2) * Math.PI * 2;
    const sunModel = m4mul(
        m4rotY(sunRotation),
        m4scale(2, 2, 2)
    );
    drawBody(octaGeom, sunModel);

    const earthOrbitPeriod = 4;
    const earthSpinPeriod = 0.5;
    const earthOrbitAngle = (seconds / earthOrbitPeriod) * Math.PI * 2;
    const earthSpinAngle = (seconds / earthSpinPeriod) * Math.PI * 2;
    const earthDistance = 6;
    
    const earthModel = m4mul(
        m4rotY(earthOrbitAngle),
        m4trans(earthDistance, 0, 0),
        m4rotY(earthSpinAngle),
        m4scale(0.8, 0.8, 0.8)
    );
    drawBody(octaGeom, earthModel);


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
    drawBody(octaGeom, marsModel);


    const moonOrbitPeriod = 2;
    const moonOrbitAngle = (seconds / moonOrbitPeriod) * Math.PI * 2;
    const moonDistance = 1.5;
    
    const moonModel = m4mul(
        m4rotY(earthOrbitAngle),
        m4trans(earthDistance, 0, 0),
        m4rotY(moonOrbitAngle),
        m4trans(moonDistance, 0, 0),
        m4rotY(-moonOrbitAngle),
        m4scale(0.3, 0.3, 0.3)
    );
    drawBody(tetraGeom, moonModel);

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
    drawBody(tetraGeom, phobosModel);

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
    drawBody(tetraGeom, deimosModel);



    //drawBody(tetraGeom, moonModel);


    gl.uniform4fv(program.uniforms.color, IlliniOrange)
    let m = m4rotX(seconds)
    let v = m4view([1,2,3], [0,0,0], [0,1,0])
    gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(v,m))
    gl.uniformMatrix4fv(program.uniforms.p, false, p)
    
    gl.drawElements(geom.mode, geom.count, geom.type, 0)

    let wrapped = seconds % 4
    let stage = Math.floor(wrapped)
    let t = wrapped - stage
    if (stage == 0) {
        tr = m4trans(1,0,1*(1-t) + -1*(t))
    } else if (stage == 1) { 
        tr = m4trans(...lerp(t, [1,0,-1], [-1,0,-1]))
    } else if (stage == 2) { 
        tr = m4trans(...lerp(t, [-1,0,-1], [-1,0,1]))
    } else { // stage == 3
        tr = m4trans(...lerp(t, [-.5,0,.5], [1,0,1]))
    }

    let m2 = m4mul(tr, m4scale(0.5, 0.5, 0.5))

    gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(v,m2))
    gl.drawElements(geom.mode, geom.count, geom.type, 0)

    let m3 = m4mul(m, m4trans(0,1,0), m4scale(0.5, 0.5, 0.5), m4rotZ(seconds))
    gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(v,m3))
    gl.drawElements(geom.mode, geom.count, geom.type, 0)

    let m4 = m4mul(m3, m4trans(1,0,0), m4scale(0.5, 0.5, 0.5))
    gl.uniformMatrix4fv(program.uniforms.mv, false, m4mul(v,m4))
    gl.drawElements(geom.mode, geom.count, geom.type, 0)
}

/** Compute any time-varying or animated aspects of the scene */
function tick(milliseconds) {
    let seconds = milliseconds / 1000;

    draw(seconds)
    requestAnimationFrame(tick)
}

/** Resizes the canvas to completely fill the screen */
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

/** Compile, link, set up geometry */
window.addEventListener('load', async (event) => {
    window.gl = document.querySelector('canvas').getContext('webgl2',
        // optional configuration object: see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
        {antialias: false, depth:true, preserveDrawingBuffer:true}
    )
    const vs = await fetch('./vertex.glsl').then(res => res.text())
    const fs = await fetch('./fragment.glsl').then(res => res.text())
    window.program = compileShader(vs,fs)
    gl.enable(gl.DEPTH_TEST)

    window.geom = setupGeomery(tetrahedron)

    window.tetraGeom = setupGeomery(tetrahedron)
    window.octaGeom = setupGeomery(octahedron)
    fillScreen()
    window.addEventListener('resize', fillScreen)
    requestAnimationFrame(tick)
})

