import React, { ReactPropTypes } from 'react'
import { mat4 } from 'gl-matrix'

const vsSource = `
attribute vec4 aVertexPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
`

const fsSource = `
void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`

interface ProgramInfo {
  program: WebGLProgram
  attribLocations: {
    vertexPosition: number
  }
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation | null
    modelViewMatrix: WebGLUniformLocation | null
  }
}

class TitleCanvas extends React.Component {
  state = {
    t: 0
  }
  private canvasRef = React.createRef<HTMLCanvasElement>()

  constructor(props: ReactPropTypes) {
    super(props)
  }

  componentDidMount() {
    this.drawCanvas()
  }

  componentDidUpdate() {
    this.drawCanvas()
  }

  drawCanvas() {
    const gl = this.canvasRef.current!.getContext('webgl')
    if (gl === null) {
      alert('Unable to initialize WebGL. Your browser or machine may not support it.')
      return
    }
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    const shaderProgram = this.initShaderProgram(gl, vsSource, fsSource)!

    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition')
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix')
      }
    }

    const buffers = this.initBuffers(gl)

    this.drawScene(gl, programInfo, buffers)
  }

  private drawScene(gl: WebGLRenderingContext, programInfo: ProgramInfo, buffers: { positions: WebGLBuffer }) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
    gl.clearDepth(1.0) // Clear everything
    gl.enable(gl.DEPTH_TEST) // Enable depth testing
    gl.depthFunc(gl.LEQUAL) // Near things obscure far things

    // clear the canvas before we start drawing on it
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fieldOfView = (45 * Math.PI) / 180
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight
    const zNear = 0.1
    const zFar = 100.0
    const projectionMatrix = mat4.create()

    mat4.perspective(
      projectionMatrix, // first arg is destination to receive the result
      fieldOfView,
      aspect,
      zNear,
      zFar
    )

    // set the view (drawing position?) to the "identity" (center of the screen)
    const modelViewMatrix = mat4.create()

    mat4.translate(
      modelViewMatrix, // destination matrix
      modelViewMatrix, // matrix to translate
      [0.0, 0.0, -5.0] // amount to translate
    )

    // Tell WebGL how to pull out the positions from the position buffer
    // into the vertexBuffer attribute
    {
      const numComponents = 2
      const type = gl.FLOAT
      const normalize = false
      const stride = 0

      const offset = 0
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.positions)
      gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset)
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)

      gl.useProgram(programInfo.program)
      gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix)
      gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix)

      {
        const offset = 0
        const vertexCount = 4
        gl.drawArrays(gl.TRIANGLE_FAN, offset, vertexCount)
        // gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount)
      }
    }
  }

  private initBuffers(gl: WebGLRenderingContext): { positions: WebGLBuffer } {
    // Create a buffer for the square's positions.

    const positionBuffer = gl.createBuffer()!

    // select the positionBuffer as the one to apply buffer operations to from now on.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

    // Now create an array of positions for the square
    const positions = [-1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0]

    // Now pass the list of positions into WebGL to build the shape.
    // We do this by creating a Float32Array from the JavaScript array,
    // then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    return { positions: positionBuffer }
  }

  private initShaderProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string): WebGLProgram | null {
    const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vsSrc)!
    const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSrc)!

    // Create shader program
    const shaderProgram = gl.createProgram()!
    gl.attachShader(shaderProgram, vertexShader)
    gl.attachShader(shaderProgram, fragmentShader)
    gl.linkProgram(shaderProgram)

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram))
      return null
    }
    return shaderProgram
  }

  private loadShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type)!
    // send the source to the shader object
    gl.shaderSource(shader, source)
    // Compile the shader program
    gl.compileShader(shader)
    // check if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert('An error occurred compiling the shader: ' + gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }

    return shader
  }

  render() {
    return <canvas ref={this.canvasRef} width={360} height={240}></canvas>
  }
}


const IndexPage = () => (<TitleCanvas />)

export default IndexPage
