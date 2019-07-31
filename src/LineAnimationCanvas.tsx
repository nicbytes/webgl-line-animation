import React from 'react'
import { mat4 } from 'gl-matrix'

const vsSource = `
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uTranslationMatrix;

varying lowp vec4 vColor;

void main() {
  gl_Position = uTranslationMatrix * aVertexPosition;
  vColor = aVertexColor;
}
`

const fsSource = `
varying lowp vec4 vColor;
void main() {
  // gl_FragColor = vec4(1.0,1.0,1.0,1.0);
  gl_FragColor = vColor;
}
`

interface ProgramInfo {
  program: WebGLProgram
  attribLocations: {
    vertexPosition: number,
    vertexColor: number
  }
  uniformLocations: {
    translationMatrix: WebGLUniformLocation | null
  }
}

interface PropTypes {
    children?: React.ReactNode
    width?: string | number | undefined
    height?: string | number | undefined
    center?: boolean
    onError?: Function
  }

class TitleCanvas extends React.Component<PropTypes> {
  state = {
    t: 0
  }
  private canvasRef = React.createRef<HTMLCanvasElement>()
  private errorHandler: Function;

  constructor(props: PropTypes) {
    super(props)
    if(props.onError) {
      this.errorHandler = props.onError
    } else {
      this.errorHandler = (e:string) => alert(e)
    }
  }

  componentDidMount() {
    this.createCanvas()
  }

  componentDidUpdate() {
    this.createCanvas()
  }

  /**
   * Creates a new Canvas instance.
   */
  createCanvas() {
    const gl = this.canvasRef.current!.getContext('webgl')
    if (gl === null) {
      this.errorHandler('Unable to initialize WebGL. Your browser or machine may not support it.')
      return
    }

    const shaderProgram = this.initShaderProgram(gl, vsSource, fsSource)!

    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
      },
      uniformLocations: {
        translationMatrix: gl.getUniformLocation(shaderProgram, 'uTranslationMatrix'),
      }
    }

    const buffers = this.initBuffers(gl)

    this.drawScene(gl, programInfo, buffers)
  }

  private drawScene(gl: WebGLRenderingContext, programInfo: ProgramInfo, buffers: { position: WebGLBuffer, color: WebGLBuffer }) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0) // Clear to black, fully opaque
    gl.clearDepth(1.0) // Clear everything
    // gl.enable(gl.DEPTH_TEST) // Enable depth testing
    // gl.depthFunc(gl.LEQUAL) // Near things obscure far things
    // clear the canvas before we start drawing on it
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const w = gl.canvas.clientWidth
    const h = gl.canvas.clientHeight
    
    const translationMatrix = mat4.create()
    mat4.scale(
        translationMatrix,
        translationMatrix,
        [ 2.0/w, 2.0/h, 1.0 ]
    )
    if (!(this.props.center)) {
        mat4.translate(
            translationMatrix,
            translationMatrix,
            [ -w/2.0, -h/2.0, 0 ]
        )
    }

    {
      const numComponents = 2
      const type = gl.FLOAT
      const normalize = false
      const stride = 0

      const offset = 0
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
      gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset)
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)
    }
    // Tell WebGL how to pull out the colors from the color buffer
    // into the vertexColor attribute.
    {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColor);
    }
    gl.useProgram(programInfo.program)
    gl.uniformMatrix4fv(programInfo.uniformLocations.translationMatrix, false, translationMatrix)
    {
      const offset = 0
      const vertexCount = 4
      // gl.drawArrays(gl.TRIANGLE_FAN, offset, vertexCount)
      gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount)
    }
  }

  private initBuffers(gl: WebGLRenderingContext): { position: WebGLBuffer, color: WebGLBuffer } {


    // Create a buffer for the square's positions.

    const positionBuffer = gl.createBuffer()!

    // select the positionBuffer as the one to apply buffer operations to from now on.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

    // Now create an array of positions for the square
    const positions = [-100.0, 100.0, 100.0, 100.0, -100.0, -100.0, 100.0, -100.0]
    // const positions = [-0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5]
    // const positions = [20,20,20,120,120,120,120,20]

    // Now pass the list of positions into WebGL to build the shape.
    // We do this by creating a Float32Array from the JavaScript array,
    // then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)


    const colors = [
        1.0,  1.0,  1.0,  1.0,    // white
        1.0,  0.0,  0.0,  1.0,    // red
        0.0,  1.0,  0.0,  1.0,    // green
        0.0,  0.0,  1.0,  1.0,    // blue
      ];

    const colorBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return { position: positionBuffer, color: colorBuffer }
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
      this.errorHandler('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram))
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
      this.errorHandler('An error occurred compiling the shader: ' + gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }

    return shader
  }

  render() {
    return <canvas ref={this.canvasRef} width={720} height={250}></canvas>
  }
}


const IndexPage = () => (<TitleCanvas center />)

export default IndexPage
