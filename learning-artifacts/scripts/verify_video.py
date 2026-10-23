"""Compare actual decoded frames with the artifact's expected state and scene."""
import argparse,json,subprocess,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser()
p.add_argument('--url',required=True);p.add_argument('--video',required=True);p.add_argument('--samples',required=True);p.add_argument('--report',required=True);p.add_argument('--chromium',default='/usr/bin/chromium')
a=p.parse_args()
samples=json.loads(Path(a.samples).read_text())
def crop_filter(box):
    # Use the same even pixel rectangle for RGB screenshots and subsampled H.264.
    x,y,w,h=[int(box[k])//2*2 for k in ['x','y','width','height']]
    return f'crop={w}:{h}:{x}:{y},scale=128:64'
def rgb_from_png(data,box):
    command=['ffmpeg','-v','error','-threads','1','-i','pipe:0','-vf',crop_filter(box),'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']
    result=subprocess.run(command,input=data,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=30)
    if result.returncode: raise RuntimeError(result.stderr.decode())
    return result.stdout
def rgb_from_video(time,box):
    command=['ffmpeg','-v','error','-threads','1','-ss',str(time),'-i',a.video,'-vf',crop_filter(box),'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']
    result=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=30)
    if result.returncode:raise RuntimeError(result.stderr.decode())
    return result.stdout
def distance(left,right):
    if len(left)!=len(right) or not left: raise RuntimeError('Decoded frame size mismatch')
    return sum(abs(x-y) for x,y in zip(left,right))/len(left)
checks=[]
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=a.chromium,headless=True,args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':1280,'height':720},device_scale_factor=1,reduced_motion='reduce')
        page.goto(a.url,wait_until='networkidle');page.wait_for_function('window.__lessonReady === true')
        initial={}
        for sample in samples:
            snapshot=page.evaluate('(t)=>window.lessonAPI.renderAt(t)',sample['time'])
            if snapshot['observed']!=sample['expected_observed']:raise AssertionError('Staged model observation mismatch')
            png=page.screenshot()
            reference=Path(a.report).parent/('expected-'+str(sample['time']).replace('.','_')+'-page.png')
            reference.write_bytes(png)
            for selector in ['.stage-wrap','#readout']:
                region=page.locator(selector)
                box=region.bounding_box()
                expected=rgb_from_png(png,box)
                actual=rgb_from_video(sample['time'],box)
                error=distance(actual,expected)
                baseline=distance(expected,initial[selector]) if selector in initial else 0
                initial.setdefault(selector,expected)
                wrong_state_error=distance(actual,initial[selector])
                # Tolerate codec/subpixel noise; meaningful differences must favor the correct state.
                if error>4:raise AssertionError(f'{selector} expected-scene error {error:.3f} exceeds tolerance; box={box}')
                if baseline>1 and error>=wrong_state_error-min(.15,baseline*.1):raise AssertionError(f'{selector} frame is not closer to the expected state than the initial state; correct_error={error:.3f}, initial_error={wrong_state_error:.3f}')
                checks.append({'time':sample['time'],'region':selector,'mean_absolute_error':round(error,4),'change_from_initial':round(baseline,4),'error_against_initial':round(wrong_state_error,4),'status':'passed'})
        browser.close()
    if not any(c['change_from_initial']>1 for c in checks):raise AssertionError('Scenario produced no meaningful visual change in stage/readout')
    report={'status':'passed','checks':checks,'scope':'Decoded stage/readout compared with actual artifact model and presentation at known scenario times; no learner effectiveness claim.'}
except Exception as e:report={'status':'failed','checks':checks,'error':str(e)}
Path(a.report).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report));sys.exit(0 if report['status']=='passed' else 1)
