const illini_orange = [1, .373, .02];
let buffer_global;

// function toClipX(x) {
//     return x/10*2 - 1;
// }
// function toClipY(y) {
//     return y/13.5*2 - 1;
// }

const paper_vertices = [
    10,    13.5,
    1.50,  13.5,
    10, 10.5,
    1.5,  10.5, 

    8, 10.5,
    3.5, 10.5,
    8, 3,
    3.5, 3,

    10, 3,
    1.5, 3,
    10, 0,
    1.5, 0
]

const tri_idx = [
    0, 1, 2,
    1, 3, 2, 

    4, 5, 6,
    5, 7, 6, 

    8, 9, 10, 
    9, 11, 10
    // 3, 4, 7,
    // 4, 7, 8,
    // 6, 9, 10,
    // 9, 10, 11
]

function normalizeVertex(x, y) {
    const midX = 5.75;
    const midY = 6.75;
    const halfW = 4.25;
    const halfH = 6.75;
    return [
        (x - midX) / halfW,
        (y - midY) / halfH
    ];
}

//const identity = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

//const m4scale = (sx,sy,sz) => new Float32Array([sx,0,0,0, 0,sy,0,0, 0,0,sz,0, 0,0,0,1])
const m4rowdot = (m, r, v) => m[r]*v[0] + m[r+4]*v[1] + m[r+8]*v[2] + m[r+12]*v[3];
const m4col = (m, c) => [m[c*4], m[c*4+1], m[c*4+2], m[c*4+3]];
const m4trans = (dx,dy,dz) => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, dx,dy,dz,1])
const m4rotZ = (ang) => { // around z axis
    let c = Math.cos(ang), s = Math.sin(ang);
    return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
}
const m4scale = (sx,sy,sz) => new Float32Array([sx,0,0,0, 0,sy,0,0, 0,0,sz,0, 0,0,0,1])
const m4mul = (...args) => args.reduce((m1,m2) => {
  if(m2.length == 4) return m2.map((e,i)=>m4rowdot(m1,i,m2)) // m*v
  if(m1.length == 4) return m1.map((e,i)=>m4rowdot(m2,i,m1)) // v*m
  let ans = new m1.constructor(16)
  for(let c=0; c<4; c+=1) for(let r=0; r<4; r+=1)
    ans[r+c*4] = m4rowdot(m1,r,m4col(m2,c))
  return ans // m*m
})



let v = [];
for(let i = 0; i < paper_vertices.length; i+=2) {
    const[nx, ny] = normalizeVertex(paper_vertices[i], paper_vertices[i+1]);
    v.push(nx, ny, ...illini_orange);
}

const vertices = new Float32Array(v);
const dynamic_vertices = new Float32Array(vertices);

function func_calls() {
    //buffer_global = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_global)
    gl.bufferData(gl.ARRAY_BUFFER, dynamic_vertices, gl.DYNAMIC_DRAW)
}



async function setup() {
    console.log("in setup");
    window.gl = document.querySelector('canvas').getContext('webgl2')
    const vs = await fetch('./vertex.glsl').then(res => res.text())
    const fs = await fetch('./fragment.glsl').then(res => res.text())
    window.program = compile(vs,fs)


    buffer_global = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer_global)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW)

    const ibo = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo)
    
    const triangles = new Uint16Array(tri_idx)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangles, gl.STATIC_DRAW)

    const stride = 5 * 4
  
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0)


    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 2*4)


    tick(0) // <- ensure this function is called only once, at the end of setup
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



function tick(milliseconds) {
    const seconds = milliseconds / 1000
    draw(seconds)
    requestAnimationFrame(tick) // <- only call this here, nowhere else
}



//let start = performance.now();

function draw(seconds) {
   // const count = 6+(seconds*10)%100          // number of vertices to draw

    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.useProgram(program)

    //used claude ai to fix canvas viewing issues, gave me this line of code
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const time = seconds;

   // const cx = 0.4 * Math.cos(time*1.2);
    //const cy = .25 * Math.sin(time*1.2);
    const a = .001 * Math.sin(time*.7);
    //const s = .3 + .15 * Math.sin(time*.9);

    //const trans = m4trans(cx, cy, 0);
    //const rot = m4rotZ(a);
    const scale = m4scale(.5, .5, 1)

    let M = m4mul(scale);

    gl.uniformMatrix4fv(program.uniforms.mat, false, M);

    gl.uniform1f(program.uniforms.time, time);

    let i;

    for (i = 0; i < vertices.length; i++) {
        dynamic_vertices[i] = v[i] + (Math.random() - .5) * .05;
        dynamic_vertices[i+1] = v[i+1] + (Math.random()- .5) * .03;

    }

    func_calls();

    gl.drawElements(gl.TRIANGLES, tri_idx.length, gl.UNSIGNED_SHORT, 0);

}

window.addEventListener('load', setup)