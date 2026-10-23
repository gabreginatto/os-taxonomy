#!/usr/bin/env python3
"""Exercise the staged lesson through real toy clicks, keyboard and rendered UI."""
import argparse,json
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--artifact',required=True);parser.add_argument('--standalone');args=parser.parse_args()
artifact=Path(args.artifact).resolve();out=artifact/'checks';out.mkdir(exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*_):pass
    def do_GET(self):
        if args.standalone and self.path=='/standalone.html':
            data=Path(args.standalone).resolve().read_bytes();self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.end_headers();self.wfile.write(data)
        else:super().do_GET()
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(artifact)));Thread(target=server.serve_forever,daemon=True).start()
checks=[];errors=[];remote=[]
def require(value,message):
    if not value:raise AssertionError(message)
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':1200,'height':1000},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
        def route(r):
            if urlparse(r.request.url).scheme in ('http','https') and urlparse(r.request.url).hostname not in ('127.0.0.1','localhost'):remote.append(r.request.url);r.abort()
            else:r.continue_()
        page.route('**/*',route);page.goto(f'http://127.0.0.1:{server.server_port}'+('/standalone.html' if args.standalone else ''),wait_until='networkidle');page.wait_for_function('window.__lessonReady')
        if args.standalone:page.context.set_offline(True)
        def snap():return page.evaluate('window.lessonAPI.snapshot()')
        def canvas():return page.locator('#oc-world canvas').evaluate('(c)=>c.toDataURL()')
        def picture(name):page.screenshot(path=str(out/(('standalone-' if args.standalone else '')+name)),full_page=True)
        def check(expected):
            page.locator('#check').click();require(page.locator('#feedback').get_attribute('data-correct')==str(expected).lower(),'Wrong outcome: '+page.locator('#feedback').inner_text());require(snap()['assessment']['scope']=='this_response_only','Exceeded assessment scope')
        def personal(first='robot',second='film'):
            page.locator('#reset').click();page.locator('#oc-plan-'+first).click();page.locator('#oc-commit').click();page.locator('#oc-plan-'+second).click()
        def layout():
            require(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow')
            for name,b in snap()['presentation']['objectBounds'].items():require(b['left']>=0 and b['right']<=1 and b['top']>=0 and b['bottom']<=1,'3D toy clipped: '+name+' '+str(b))
            boxes=[]
            for b in page.locator('.ci-option').all():
                box=b.bounding_box();boxes.append(box);require(box['height']>=44,'Toy touch target too small')
                require(b.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),'Option text clipped')
            for i,a in enumerate(boxes):
                for b in boxes[i+1:]:require(a['x']+a['width']<=b['x']+1 or b['x']+b['width']<=a['x']+1,'Toy labels overlap')
            for b in page.get_by_role('button').all():
                if b.is_visible():require(b.bounding_box()['height']>=43,'Visible button below touch tolerance')
        require(snap()['presentation']['renderer']=='threejs','Missing real Three.js renderer');require(snap()['presentation']['objects']==3,'Opener must have only three adventures');require(page.locator('canvas').evaluate('(c)=>Boolean(c.getContext("webgl2"))'),'WebGL2 unavailable')
        require(page.locator('select,input[type=range]').count()==0,'Old forms/sliders remain');require(not page.locator('#check').is_visible(),'Assessment shown before choices')
        layout();picture('redesign-initial-desktop.png');page.locator('.ci-board').screenshot(path=str(out/'redesign-world.png'))
        before=canvas();target=snap()['presentation']['pickTargets']['robot'];box=page.locator('canvas').bounding_box();page.mouse.click(box['x']+target['x']*box['width'],box['y']+target['y']*box['height'])
        require(snap()['state']['candidate']=='robot' and snap()['state']['selected'] is None,'Raycast must preview, not silently commit');require(canvas()!=before,'3D preview did not change scene')
        page.locator('#oc-plan-park').click();require(snap()['state']['candidate']=='park','Preview cannot be revised');page.locator('#oc-plan-robot').click();page.locator('#oc-commit').focus();page.keyboard.press('Enter')
        require(snap()['state']['selected']=='robot' and snap()['state']['alternative'] is None,'Commit did not advance exactly one stage');require('unavailable' in page.locator('#oc-instruction').inner_text(),'Counterfactual question missing')
        require(page.evaluate('document.activeElement.id')=='oc-instruction','New question did not receive keyboard focus');layout()
        page.locator('#oc-plan-robot').click();require(snap()['state']['alternative'] is None,'Chosen toy accepted as its own alternative')
        page.locator('#oc-plan-film').focus();page.keyboard.press('Enter');check(True);require(snap()['assessment']['kind']=='preference_elicitation','Personal preferences objectively graded')
        require('no single right favourite' in page.locator('#feedback').inner_text(),'Personal preference scope missing');require('WHAT YOU GIVE UP' in page.locator('#oc-comparison').inner_text(),'Forgone opportunity not explicit')
        require('fun of making a movie' in page.locator('#oc-definition').inner_text(),'Missing concrete benefit');picture('redesign-personal-reveal.png')
        require(page.evaluate('document.activeElement.id')=='oc-reveal-heading','Reveal heading did not receive focus');require(page.locator('#oc-instruction').inner_text()=='Here is your trade-off.','Reveal retained unanswered question')
        checks.append('Real WebGL2 raycast previews; explicit keyboard confirmation; personal benefit reveal with no objective preference score')
        for first,second in [('robot','park'),('film','robot'),('film','park'),('park','robot'),('park','film')]:
            personal(first,second);check(True);require(snap()['observed']['bestAlternativeIds']==[second],'Stated runner-up changed');require(page.locator('#oc-reveal').is_visible(),'Personal reveal absent')
        checks.append('All six personal preference pairs accepted; only runner-up benefit is opportunity cost')
        personal();page.locator('#oc-back').click();require(snap()['state']['selected']=='robot' and snap()['state']['alternative'] is None,'Back failed to clear dependent answer');page.locator('#oc-back').click();require(snap()['state']['selected'] is None,'Cannot change first choice')
        personal();check(True);page.locator('#oc-next').click();require(snap()['state']['round']=='budget','Challenge transition missing');require('£10' in page.locator('#oc-resource').inner_text() and '£2 saved' in page.locator('#oc-resource').inner_text(),'Original and remaining budget missing');picture('redesign-budget-initial.png')
        page.locator('#oc-plan-observatory').click();check(False);require(not page.locator('#oc-reveal').is_visible(),'Wrong answer advanced game');require('before choosing' in page.locator('#feedback').inner_text(),'Infeasible explanation absent')
        page.locator('#oc-plan-garden').click();require(page.locator('#feedback').inner_text()=='','Stale error retained');check(False);require('rather make a movie' in page.locator('#feedback').inner_text(),'Preference-order feedback missing')
        page.locator('#oc-plan-film').click();check(True);require(snap()['observed']['leftCash']==2 and snap()['observed']['bestAlternativeIds']==['film'],'Used leftovers instead of original resources');picture('redesign-budget-reveal.png')
        checks.append('Original £10 vs remaining £2 explicit; unavailable telescope and lower-ranked garden rejected with specific reasons')
        page.locator('#oc-next').click();require(snap()['state']['round']=='tighter' and snap()['state']['alternative'] is None,'£9 counterfactual kept old answer');page.locator('#oc-plan-film').click();check(False);page.locator('#oc-plan-garden').click();check(True);require(snap()['observed']['leftCash']==1,'£9 arithmetic incorrect');picture('redesign-tighter-reveal.png')
        page.locator('#oc-help').click();check(True);require(snap()['assessment']['assistance']=='worked_example_used','Worked help not labelled');page.locator('#oc-restart').click();require(not snap()['state']['usedHelp'] and snap()['state']['round']=='tighter','Scene restart failed')
        checks.append('Original-budget £9 transfer changes best alternative; help labelled; scene restart clears attempt')
        for width in [390,320]:
            page.set_viewport_size({'width':width,'height':844});page.locator('#reset').click();layout();picture(f'redesign-mobile-{width}-initial.png');page.locator('#oc-plan-robot').click();require(page.locator('#oc-commit').evaluate('(e)=>e.getBoundingClientRect().bottom<=innerHeight+1'),'Preview confirmation offscreen');page.locator('#oc-commit').click();require(page.locator('#oc-instruction').evaluate('(e)=>e.getBoundingClientRect().top>=0&&e.getBoundingClientRect().bottom<=innerHeight'),'New question outside viewport');page.locator('#oc-plan-film').click();layout();check(True);picture(f'redesign-mobile-{width}-reveal.png');page.locator('#oc-next').click();layout();page.locator('#oc-plan-film').click();check(True);layout();picture(f'redesign-mobile-{width}-budget.png');page.locator('#oc-next').click();page.locator('#oc-plan-garden').click();check(True);layout();require('£3 kept saved' in page.locator('#oc-definition').inner_text(),'Whole alternative dropped its saved money')
        checks.append('390px and 320px layouts, readable nonoverlapping options, keyboard/touch targets and all scenes')
        page.emulate_media(reduced_motion='no-preference')
        if args.standalone:page.context.set_offline(False)
        page.reload(wait_until='networkidle');page.wait_for_function('window.__lessonReady')
        if args.standalone:page.context.set_offline(True)
        first=page.evaluate('window.lessonAPI.renderAt(4).state');image=canvas();page.evaluate('window.lessonAPI.renderAt(1)');second=page.evaluate('window.lessonAPI.renderAt(4).state');require(first==second and image==canvas(),'Motion-enabled arbitrary seeking nondeterministic')
        page.locator('#reset').click();page.wait_for_timeout(450);fresh=canvas();personal();check(True);page.locator('#reset').click();page.wait_for_timeout(450);require(fresh==canvas(),'Reset retained an animated transform');require(not snap()['presentation']['revealed'],'Reset retained reveal')
        checks.append('Motion-enabled seek and reset deterministic; presentation does not change domain truth')
        require(not errors,'Browser errors: '+str(errors));require(not remote,'External runtime requests: '+str(remote));browser.close()
    report={'status':'passed','checks':checks,'renderer':'threejs/WebGL2','delivery':'single_html_loaded_locally_then_offline' if args.standalone else 'static_folder','physical_device_review':'not_performed','learner_review':'not_performed'}
except Exception as e:report={'status':'failed','checks':checks,'error':str(e)}
finally:server.shutdown();server.server_close()
(out/('standalone-interactions.json' if args.standalone else 'opportunity-interactions.json')).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));raise SystemExit(0 if report['status']=='passed' else 1)
