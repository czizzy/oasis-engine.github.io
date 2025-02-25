/**
 * @title Shader Water
 * @category Material
 */
import { OrbitControl } from "@oasis-engine-toolkit/controls";
import * as dat from "dat.gui";
import {
  AssetType,
  Camera,
  Color,
  Engine,
  Material,
  MeshRenderer,
  PrimitiveMesh,
  Script,
  Shader,
  Texture2D,
  Vector3,
  WebGLEngine
} from "oasis-engine";

const gui = new dat.GUI();
//-- create engine object
const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
const rootEntity = scene.createRootEntity();

//-- create camera
const cameraEntity = rootEntity.createChild("camera_entity");
cameraEntity.transform.position = new Vector3(0, 0, 15);
cameraEntity.addComponent(Camera);
const orbitControl = cameraEntity.addComponent(OrbitControl);
orbitControl.minDistance = 15;
orbitControl.maxDistance = 15;

// 自定义材质
const vertexSource = `
uniform mat4 u_MVPMat;
attribute vec3 POSITION;
attribute vec2 TEXCOORD_0;
attribute vec3 NORMAL;

varying vec2 v_uv;
varying vec3 v_position;
varying vec3 v_normal;


void main() {

  gl_Position = u_MVPMat  *  vec4( POSITION, 1.0 );
  v_uv = TEXCOORD_0;
  v_normal = NORMAL;
  v_position = POSITION;
}
 `;

const fragSource = `
varying vec2 v_uv;
varying vec3 v_position;
varying vec3 v_normal;

uniform float u_time;
uniform sampler2D u_texture;
uniform vec3 u_cameraPos;

#define EPS 0.001
#define MAX_ITR 100
#define MAX_DIS 100.0
#define PI	 	  3.141592

uniform float u_water_scale;
uniform float u_water_speed;

uniform vec3 u_sea_base;
uniform vec3 u_water_color;
uniform float u_sea_height;

// Distance Functions
float sd_sph(vec3 p, float r) { return length(p) - r; }

// Distance Map
float map(vec3 p, vec2 sc)
{    
    float l = cos(length(p * 2.0));
    vec2 u = vec2(l, sc.y);
    vec2 um = u * 0.3;
    um.x += u_time * 0.1 * u_water_speed;
    um.y += -u_time * 0.025 * u_water_speed;
    um.x += (um.y) * 2.0;    
    float a1 = texture2D(u_texture, (p.yz  *  .4 + um) * u_water_scale).x;
    float a2 = texture2D(u_texture, (p.zx  *  .4 + um) * u_water_scale).x;
    float a3 = texture2D(u_texture, (p.xy  *  .4 + um) * u_water_scale).x;
    
    float t1 = a1 + a2 + a3;
    t1 /= 15.0 * u_water_scale;
    
    float b1 = texture2D(u_texture, (p.yz  *  1. + u) * u_water_scale).x;
    float b2 = texture2D(u_texture, (p.zx  *  1. + u) * u_water_scale).x;
    float b3 = texture2D(u_texture, (p.xy  *  1. + u) * u_water_scale).x;
    
    float t2 = b1 + b2 + b3;
    t2 /= 15.0  *  u_water_scale;
    
    float comb = t1 * 0.4 + t2 * 0.1 * (1.0 - t1);
    
    return comb + sd_sph(p, 3.); // sd_box(p, vec3(1., 1., 1.)) + sdPlane(p, vec4(0., 0., 1.0, 0.));//
}

float diffuse(vec3 n,vec3 l,float p) {
    return pow(dot(n,l) * 0.4 + 0.6,p);
}

float specular(vec3 n,vec3 l,vec3 e,float s) {    
    float nrm = (s + 8.0) / (PI * 8.0);
    return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;
}

// sky
vec3 getSkyColor(vec3 e) {
    e.y = max(e.y,0.0);
    return vec3(pow(1.0-e.y,2.0), 1.0-e.y, 0.6+(1.0-e.y)*0.4);
}

vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {  
    float fresnel = clamp(1.0 - dot(n,-eye), 0.0, 1.0);
    fresnel = pow(fresnel,3.0) * 0.65;

    vec3 reflected = getSkyColor(reflect(eye,n));    
    vec3 refracted = u_sea_base + diffuse(normalize(n),l,80.0) * u_water_color * 0.12; 

    vec3 color =  mix(refracted,reflected,fresnel);

    float atten = max(1.0 - dot(dist,dist) * 0.001, 0.0);
    color += u_water_color * (length(p) - u_sea_height) * 0.18 * atten; // 

    color += vec3(specular(n,l,eye,20.0));

    return color;
}

void main (void) {

    vec2 uv = vec2(v_uv.x * 0.5, v_uv.y * 0.5);//  / iResolution.xy;
    
    vec3 pos = v_position; 
    vec3 dist = pos - u_cameraPos;

    float dis = EPS;
    vec3 rayDir = normalize(dist);
    
    // Ray marching
    for(int i = 0; i < MAX_ITR; i++)
    {
        if(dis < EPS || dis > MAX_DIS)
          break;
        dis = map(pos, uv);
        pos += dis * rayDir;
    }
    
    if (dis >= EPS) 
    {
      discard;
    }
    
    vec3 lig = normalize(vec3(-1., -3, -4.5));
    vec2 eps = vec2(0.0, EPS);
    vec3 normal = normalize(vec3(
        map(pos + eps.yxx, uv) - map(pos - eps.yxx, uv),
        map(pos + eps.xyx, uv) - map(pos - eps.xyx, uv),
        map(pos + eps.xxy, uv) - map(pos - eps.xxy, uv)
    ));
    
    vec3 col = getSeaColor(pos, normal, lig, rayDir, dist);
    
    gl_FragColor = vec4(col,1.0);
}
`;

// 初始化 shader
Shader.create("water", vertexSource, fragSource);

class ShaderMaterial extends Material {
  constructor(engine: Engine) {
    super(engine, Shader.find("water"));

    this.shaderData.setFloat("u_sea_height", 0.6);
    this.shaderData.setFloat("u_water_scale", 0.2);
    this.shaderData.setFloat("u_water_speed", 3.5);
    this.shaderData.setColor("u_sea_base", new Color(0.1, 0.2, 0.22));
    this.shaderData.setColor("u_water_color", new Color(0.8, 0.9, 0.6));
  }
}
const material = new ShaderMaterial(engine);

// 创建球体形的海面
const sphereEntity = rootEntity.createChild("sphere");
const renderer = sphereEntity.addComponent(MeshRenderer);
renderer.mesh = PrimitiveMesh.createSphere(engine, 3, 50);
renderer.setMaterial(material);

// 加载噪声纹理
engine.resourceManager
  .load({
    type: AssetType.Texture2D,
    url: "https://gw.alipayobjects.com/mdn/rms_7c464e/afts/img/A*AC4IQZ6mfCIAAAAAAAAAAAAAARQnAQ"
  })
  .then((texture: Texture2D) => {
    material.shaderData.setTexture("u_texture", texture);
    engine.run();
  });

// u_time 更新脚本
class WaterScript extends Script {
  onUpdate() {
    material.shaderData.setFloat("u_time", engine.time.timeSinceStartup * 0.001);
  }
}
sphereEntity.addComponent(WaterScript);

// debug
function openDebug() {
  const shaderData = material.shaderData;
  const baseColor = shaderData.getColor("u_sea_base");
  const waterColor = shaderData.getColor("u_water_color");
  const debug = {
    sea_height: shaderData.getFloat("u_sea_height"),
    water_scale: shaderData.getFloat("u_water_scale"),
    water_speed: shaderData.getFloat("u_water_speed"),
    sea_base: [baseColor.r * 255, baseColor.g * 255, baseColor.b * 255],
    water_color: [waterColor.r * 255, waterColor.g * 255, waterColor.b * 255]
  };

  gui.add(debug, "sea_height", 0, 3).onChange((v) => {
    shaderData.setFloat("u_sea_height", v);
  });
  gui.add(debug, "water_scale", 0, 4).onChange((v) => {
    shaderData.setFloat("u_water_scale", v);
  });
  gui.add(debug, "water_speed", 0, 4).onChange((v) => {
    shaderData.setFloat("u_water_speed", v);
  });
  gui.addColor(debug, "sea_base").onChange((v) => {
    baseColor.r = v[0] / 255;
    baseColor.g = v[1] / 255;
    baseColor.b = v[2] / 255;
  });
  gui.addColor(debug, "water_color").onChange((v) => {
    waterColor.r = v[0] / 255;
    waterColor.g = v[1] / 255;
    waterColor.b = v[2] / 255;
  });
}

openDebug();
