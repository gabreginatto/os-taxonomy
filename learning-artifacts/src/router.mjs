export const routingVersion = '1.0.0';
const need = (available, tool) => available[tool] !== false;
export function routeTools({spatial=false,dense2d=false,customMesh=false,liveBlenderAuthoring=false,coordinatedMotion=false,outputs=['interactive_browser'],preference=null,capabilities={}}={}) {
  const decisions=[],blocked=[];
  let representation=preference||(spatial?'threejs':dense2d?'canvas2d':'html_svg');
  if(!['html_svg','canvas2d','threejs'].includes(representation))throw new Error('Unsupported representation '+representation);
  if(spatial&&representation!=='threejs')blocked.push('The declared spatial interaction requires 3D; a simpler view must receive a revised learning contract.');
  if(representation==='threejs'&&!need(capabilities,'webgl2'))blocked.push('Required WebGL2 capability is unavailable; no silent output downgrade.');
  decisions.push({tool:representation,role:'representation',reason:spatial?'Viewpoint manipulation and depth have an explicit learning purpose.':dense2d?'Many continuous 2D marks justify a canvas.':'Semantic 2D controls and diagrams suffice.',capability_status:capabilities[representation==='threejs'?'webgl2':'browser']===true?'probed':'verify_before_acceptance'});
  if(coordinatedMotion)decisions.push({tool:'gsap',role:'presentation_only',reason:'Coordinate or interrupt visual emphasis without changing domain truth.'});
  if(customMesh){
    const useMcp=liveBlenderAuthoring&&capabilities.blender_mcp===true;
    if(!useMcp&&!need(capabilities,'blender'))blocked.push('A required custom mesh has no available authoring adapter.');
    decisions.push({tool:useMcp?'blender_mcp':'headless_blender',role:'asset_build',reason:'Custom geometry is required by the presentation contract.'});
  }
  if(outputs.includes('mp4')){
    if(!need(capabilities,'hyperframes'))blocked.push('The requested MP4 cannot be exported without HyperFrames.');
    decisions.push({tool:'hyperframes',role:'scripted_video_export',reason:'An MP4 was explicitly requested; reuse the model and a fixed demonstration scenario.'});
  }
  if(outputs.includes('interactive_deck'))blocked.push('Interactive decks are documented but not implemented by this compiler.');
  return {policy_version:routingVersion,status:blocked.length?'blocked_capability':'planned',representation,decisions,blocked,preserve:['learning_objectives','required_interactions','requested_output_types','explicit_representation']};
}
