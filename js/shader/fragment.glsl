uniform float time; 
uniform float progress;
uniform sampler2D landscape;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vNormal;
float PI = 3.141592653589793238;
void main() {

  vec2 uv = gl_FragCoord.xy/vec2(1000.);

	vec3 X = dFdx(vNormal);
	vec3 Y = dFdy(vNormal);
	vec3 normal = normalize(cross(X,Y));

  float diffuse = dot(normal,vec3(1.));
	vec4 t = texture2D(landscape, uv);
  //gl_FragColor = vec4(vUv,0.0,1.);
  gl_FragColor = t;
  //gl_FragColor = vec4(diffuse);
}