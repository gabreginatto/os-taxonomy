import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { packageRoot, hash, pythonExecutable } from './taxonomy.mjs';
import { html } from './generator.mjs';
import { validateManifest, verifySourceHashes, validationFingerprint, videoValidationFingerprint } from './validation.mjs';
import { runProcess } from './verify.mjs';
import { replay } from './models.mjs';
import { loadExtension } from './extensions.mjs';
import { serveDirectory } from './server.mjs';

export async function renderVideo(root,{seconds=8,fps=15,chromium='/usr/bin/chromium'}={}) {
  root=path.resolve(root);
  if(!Number.isFinite(seconds)||seconds<=0||seconds>60)throw new Error('Video duration must be 0–60 seconds.');
  if(!Number.isInteger(fps)||fps<1||fps>30)throw new Error('FPS must be an integer from 1 to 30.');
  const manifest=validateManifest(JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))));
  verifySourceHashes(root,manifest);
  if(manifest.outputs.interactive_browser.status!=='verified')throw new Error('Verify the interactive artifact before rendering its demonstration.');
  if(manifest.validation?.validation_fingerprint!==validationFingerprint(manifest,manifest.validation?.browser?.profile))throw new Error('Validation is stale after a validator/policy change. Verify again.');
  if(manifest.lessons.length!==1)throw new Error('Video currently accepts one lesson per composition; generate one artifact per topic for video.');
  if(manifest.lessons[0].scenario.some(e=>e.time>=seconds-.1))throw new Error('Video duration would truncate the lesson scenario. Choose a longer duration.');
  const exportRoot=path.join(root,'exports');fs.mkdirSync(exportRoot,{recursive:true});
  const stage=fs.mkdtempSync(path.join(exportRoot,'composition-'));
  for(const item of ['app.js','app.css','chunks','assets'])if(fs.existsSync(path.join(root,item)))fs.cpSync(path.join(root,item),path.join(stage,item),{recursive:true});
  const css=path.join(stage,'app.css');
  fs.writeFileSync(css,fs.readFileSync(css,'utf8').replace(/transition:[^;}]+;?/g,''));
  fs.writeFileSync(path.join(stage,'index.html'),html({video:true,duration:seconds}));
  const output=path.join(exportRoot,'lesson.mp4');
  if(fs.existsSync(output))throw new Error('Video already exists. Preserve it or choose a fresh artifact directory before another export.');
  const env={...process.env,HYPERFRAMES_BROWSER_PATH:chromium,PRODUCER_HEADLESS_SHELL_PATH:chromium,HYPERFRAMES_NO_TELEMETRY:'1',DO_NOT_TRACK:'1',PRODUCER_MAX_WORKERS:'1',PRODUCER_FORCE_SCREENSHOT:'true',PRODUCER_BROWSER_GPU_MODE:'software'};
  const command=path.join(packageRoot,'node_modules/.bin/hyperframes');
  const lint=await runProcess(command,['lint',stage],{cwd:packageRoot,env,timeout:60000});
  fs.writeFileSync(path.join(exportRoot,'hyperframes-lint.log'),lint.stdout+lint.stderr);
  if(lint.code!==0)throw new Error('HyperFrames lint failed; see exports/hyperframes-lint.log.');
  const render=await runProcess(command,['render',stage,'--output',output,'--fps',String(fps),'--workers','1','--no-browser-gpu','--low-memory-mode','--quality','draft'],{cwd:packageRoot,env,timeout:300000});
  fs.writeFileSync(path.join(exportRoot,'hyperframes-render.log'),render.stdout+render.stderr);
  if(render.code!==0||!fs.existsSync(output))throw new Error('HyperFrames render failed; see exports/hyperframes-render.log.');
  const probe=await runProcess('ffprobe',['-v','error','-show_streams','-show_format','-of','json',output],{timeout:30000});
  if(probe.code!==0)throw new Error('ffprobe could not validate rendered video.');
  const info=JSON.parse(probe.stdout), stream=info.streams.find(s=>s.codec_type==='video');
  if(!stream||Math.abs(Number(info.format.duration)-seconds)>.15||stream.width!==1280||stream.height!==720)throw new Error('Rendered duration or dimensions differ from the composition contract.');
  const [rateNumerator,rateDenominator]=stream.r_frame_rate.split('/').map(Number);
  if(Math.abs(rateNumerator/rateDenominator-fps)>.001)throw new Error('Rendered frame rate differs from the requested rate.');
  const sampled=[];
  const scenario=manifest.lessons[0].scenario;
  const middleEvent=scenario[Math.floor((scenario.length-1)/2)];
  const sampleTimes=[0,Math.min(seconds-.1,middleEvent?.time+.3||seconds/2),seconds-.1];
  for(const [index,time]of sampleTimes.entries()){
    const frame=path.join(exportRoot,'frame-'+index+'.png');
    const extraction=await runProcess('ffmpeg',['-v','error','-ss',String(time),'-i',output,'-frames:v','1','-y',frame],{timeout:30000});
    if(extraction.code!==0||!fs.existsSync(frame))throw new Error('Unable to decode a representative video frame.');
    sampled.push({time,file:'exports/'+path.basename(frame),sha256:hash(fs.readFileSync(frame))});
  }
  const model=manifest.lessons[0].extension?await loadExtension(path.join(root,'source/extension.mjs'),{artifactRoot:root}):(await import(pathToFileURL(path.join(root,'source/models.mjs')).href+'?video='+manifest.fingerprints.accepted_source)).getModel(manifest.lessons[0].plugin_id);
  const expectedSamples=sampleTimes.map(time=>({time,expected_observed:model.observe(replay(model,scenario,time))}));
  const sampleFile=path.join(exportRoot,'expected-samples.json');
  fs.writeFileSync(sampleFile,JSON.stringify(expectedSamples,null,2)+'\n');
  const service=await serveDirectory(stage);
  let frameComparison;
  try {
    const comparison=await runProcess(pythonExecutable,[path.join(packageRoot,'scripts/verify_video.py'),'--url','http://127.0.0.1:'+service.port,'--video',output,'--samples',sampleFile,'--report',path.join(exportRoot,'frame-comparison.json'),'--chromium',chromium],{timeout:120000});
    try{frameComparison=JSON.parse(comparison.stdout);}catch{throw new Error('Video frame comparator failed: '+comparison.stderr);}
    if(comparison.code!==0||frameComparison.status!=='passed')throw new Error('Decoded video does not match its expected teaching states: '+JSON.stringify(frameComparison));
  } finally {await service.close();}
  const browserVersion=(await runProcess(chromium,['--version'],{timeout:10000})).stdout.trim();
  const ffmpegVersion=(await runProcess('ffmpeg',['-version'],{timeout:10000})).stdout.split('\n')[0];
  const toolchain={hyperframes:'0.8.171',chromium:browserVersion,ffmpeg:ffmpegVersion};
  const report={status:'verified',entry:'exports/lesson.mp4',sha256:hash(fs.readFileSync(output)),source_fingerprint:manifest.fingerprints.accepted_source,video_validation_fingerprint:videoValidationFingerprint(),duration:Number(info.format.duration),width:stream.width,height:stream.height,fps,sampled_frames:sampled,frame_comparison:frameComparison,toolchain,scenario:manifest.lessons[0].scenario,assessment:'Scripted demonstration; no learner response observed.',render_fingerprint:hash(JSON.stringify({source:manifest.fingerprints.accepted_source,scenario:manifest.lessons[0].scenario,seconds,fps,toolchain,video_adapter:hash(fs.readFileSync(path.join(packageRoot,'src/video.mjs'))),video_validator:hash(fs.readFileSync(path.join(packageRoot,'scripts/verify_video.py')))}))};
  fs.writeFileSync(path.join(exportRoot,'video-report.json'),JSON.stringify(report,null,2)+'\n');
  manifest.outputs.mp4=report;
  if(!manifest.requested_outputs.includes('mp4'))manifest.requested_outputs.push('mp4');
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  return report;
}
