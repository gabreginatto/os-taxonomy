#!/usr/bin/env python3
"""Actual 3D picking, counterexamples, predictions, reversible repairs and transfer gates."""
import argparse,json
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--artifact',required=True);args=p.parse_args();root=Path(args.artifact).resolve();out=root/'checks';out.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*_):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start()
checks=[];errors=[];external=[]
def require(x,message):
 if not x:raise AssertionError(message)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1200,'height':1000},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  def route(r):
   if urlparse(r.request.url).scheme in ('http','https') and urlparse(r.request.url).hostname not in ('localhost','127.0.0.1'):external.append(r.request.url);r.abort()
   else:r.continue_()
  page.route('**/*',route);page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='networkidle');page.wait_for_function('window.__lessonReady')
  def snap():return page.evaluate('window.lessonAPI.snapshot()')
  def picture(name):page.screenshot(path=str(out/name),full_page=True)
  def primary():page.locator('#inv-primary').click()
  def initial():page.locator('#reset').click()
  def inspect(part):page.locator('#inv-part-'+part).click();primary()
  def fix(part,prediction,repair):
   inspect(part);page.locator('#inv-predict-'+prediction).click();primary();page.locator('#inv-repair-'+repair).click();primary()
  def guided():
   initial();primary();primary();fix('hatch','spill','seal');primary();require('Inversion' in page.locator('#inv-recap').inner_text(),'Teaching name missing');primary()
  def canvas():return page.locator('canvas').evaluate('(c)=>c.toDataURL()')
  def layout():
   require(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow')
   for b in page.get_by_role('button').all():
    if b.is_visible():require(b.bounding_box()['height']>=43,'Touch target below 44px tolerance')
   world=page.locator('#inv-world').bounding_box();labels=[]
   for label in page.locator('.im-place').all():
    b=label.bounding_box();labels.append(b);require(b['x']>=world['x'] and b['x']+b['width']<=world['x']+world['width'],'Destination label clipped horizontally');require(b['y']>=world['y'] and b['y']+b['height']<=world['y']+world['height'],'Destination label clipped vertically')
   a,b=labels;require(a['x']+a['width']<b['x'] or b['x']+b['width']<a['x'] or a['y']+a['height']<b['y'] or b['y']+b['height']<a['y'],'Destination labels overlap')
  require(snap()['presentation']['renderer']=='threejs' and page.locator('canvas').evaluate('(c)=>!!c.getContext("webgl2")'),'Real Three.js/WebGL2 missing');require(not page.locator('#check').is_visible(),'Final assessment exposed prematurely');layout();picture('inversion-initial-desktop.png');page.locator('.im-card').screenshot(path=str(out/'inversion-world.png'))
  primary();require(snap()['observed']['lastFlight']['spilled'],'Baseline did not expose open-hatch failure');require('Right moon. No seeds.' in page.locator('#inv-question').inner_text(),'Baseline question missing');primary();require(page.evaluate('document.activeElement.id')=='inv-question','Phase question did not receive focus')
  # Real raycast on rocket cargo, not the HTML part button.
  target=snap()['presentation']['pickTargets']['hatch'];b=page.locator('canvas').bounding_box();page.mouse.click(b['x']+target['x']*b['width'],b['y']+target['y']*b['height']);require(snap()['state']['system']=='hatch' and snap()['state']['phase']=='inspect','Raycast failed or silently committed');primary();picture('inversion-prediction.png')
  page.locator('#inv-predict-wrong-moon').focus();page.keyboard.press('Enter');primary();require(snap()['state']['phase']=='repair','Wrong prediction incorrectly blocked an experiment');page.locator('#inv-repair-unload').click();primary();require(snap()['observed']['lastFlight']['empty'] and not snap()['observed']['lastFlight']['spilled'],'Empty-cargo counterexample missing');require(snap()['observed']['lastPrediction']['matched']==False,'Wrong prediction was retrospectively marked right');picture('inversion-empty-cargo.png')
  page.locator('#inv-undo').click();require(snap()['state']['seedsLoaded'] and snap()['state']['phase']=='inspect','Undo did not restore load')
  target=snap()['presentation']['pickTargets']['badge'];b=page.locator('canvas').bounding_box();page.mouse.click(b['x']+target['x']*b['width'],b['y']+target['y']*b['height']);require(snap()['state']['system']=='badge','Badge raycast failed')
  fix('badge','none','polish');require(snap()['state']['badgePolished'] and not snap()['observed']['goalMet'],'Cosmetic repair changed delivery');picture('inversion-badge-result.png');primary()
  fix('hatch','spill','seal');require(snap()['observed']['goalMet'],'Closing hatch failed guided delivery');require(snap()['observed']['lastPrediction']['matched'],'Correct pre-change prediction marked wrong');picture('inversion-first-delivery.png');primary();primary();require(snap()['state']['mission']=='challenge' and snap()['observed']['knownFailureCount']==2,'New mission did not explicitly reset both faults')
  checks.append('Baseline observation, real 3D cargo raycast, explicit confirmations, wrong prediction retained, empty-cargo undo and cosmetic non-cause')
  primary();fix('hatch','spill','seal');require(snap()['observed']['lastFlight']['wrongMoon'] and not snap()['observed']['lastFlight']['spilled'],'One repair incorrectly fixed both causes');picture('inversion-safe-cargo-wrong-moon.png');primary()
  # Revisiting a working component must allow the accurate no-failure prediction.
  inspect('hatch');require(page.locator('#inv-predict-none').is_visible(),'Closed hatch forces an incorrect prediction');page.locator('#inv-secondary').click();fix('beacon','wrong-moon','clean');require(snap()['state']['beaconClean'] and not snap()['state']['beaconOn'],'Polishing woke beacon');primary()
  # Real raycast on the beacon after failed cosmetic work.
  target=snap()['presentation']['pickTargets']['beacon'];b=page.locator('canvas').bounding_box();page.mouse.click(b['x']+target['x']*b['width'],b['y']+target['y']*b['height']);require(snap()['state']['system']=='beacon','Beacon raycast failed');primary();page.locator('#inv-predict-wrong-moon').click();primary();page.locator('#inv-repair-wake').click();primary();require(snap()['observed']['goalMet'],'Two repairs failed delivery');picture('inversion-challenge-delivery.png');primary()
  page.locator('#inv-conclusion-guarantee').click();page.locator('#check').click();require(page.locator('#feedback').get_attribute('data-correct')=='false' and snap()['state']['phase']=='conclusion','Guarantee misconception completed game');picture('inversion-guarantee-rejected.png')
  history=snap()['state']['history'];page.locator('#inv-conclusion-limits').click();page.locator('#check').click();require(page.locator('#feedback').get_attribute('data-correct')=='true' and snap()['state']['phase']=='complete','Bounded conclusion did not complete');require(snap()['assessment']['scope']=='this_response_only','Mastery scope exceeded');require(snap()['state']['history']==history,'Completion rewrote prediction evidence');picture('inversion-complete-desktop.png')
  checks.append('Independent fault remains after hatch repair; working hatch has no-failure option; beacon cosmetic/wake distinction; guarantee rejected, bounded conclusion accepted')
  # Reverse repair order and reload route, without bypassing the actual UI.
  guided();primary();fix('beacon','wrong-moon','wake');require(snap()['observed']['lastFlight']['spilled'] and not snap()['observed']['lastFlight']['wrongMoon'],'Reverse repair order suppressed cargo failure');picture('inversion-right-moon-no-seeds.png');primary();fix('hatch','spill','unload');primary();fix('hatch','empty','load');require(snap()['state']['seedsLoaded'] and not snap()['observed']['goalMet'],'Reload should still need closed hatch');primary();fix('hatch','spill','seal');require(snap()['observed']['goalMet'],'Reload recovery impossible')
  checks.append('Both repair orders; empty-cargo reload retains open-hatch failure until seal; configuration changes persist between rehearsals')
  for width in [390,320]:
   page.set_viewport_size({'width':width,'height':844});initial();layout();picture(f'inversion-mobile-{width}-initial.png');guided();primary();layout();fix('hatch','spill','seal');layout();picture(f'inversion-mobile-{width}-partial.png');primary();fix('beacon','wrong-moon','wake');primary();page.locator('#inv-conclusion-limits').click();page.locator('#check').click();layout();picture(f'inversion-mobile-{width}-complete.png')
  checks.append('390px and 320px full game, readable distinct labels, all touch targets, focus and no horizontal overflow')
  page.set_viewport_size({'width':1200,'height':1000});page.emulate_media(reduced_motion='no-preference');page.reload(wait_until='networkidle');page.wait_for_function('window.__lessonReady');initial();fresh=canvas();primary();require(page.locator('#inv-skip').is_visible(),'Motion-enabled flight did not start');page.wait_for_timeout(650);picture('inversion-flight-in-motion.png');page.locator('#inv-skip').click();require(snap()['presentation']['flightProgress']==1,'Skip did not show canonical result');initial();require(fresh==canvas(),'Reset retained a flight transform')
  a=page.evaluate('window.lessonAPI.renderAt(4).state');image=canvas();page.evaluate('window.lessonAPI.renderAt(1)');b=page.evaluate('window.lessonAPI.renderAt(4).state');require(a==b and image==canvas(),'Arbitrary seeking changed model or scene');page.locator('#inv-help').click();require(snap()['state']['usedHelp'],'Hint not tracked');page.locator('#inv-restart').click();require(not snap()['state']['usedHelp'],'Restart retained assistance')
  checks.append('Motion flight, skip, reset and arbitrary seek remain deterministic; hint exposure clears on restart')
  require(not errors,'Page errors: '+str(errors));require(not external,'External runtime requests: '+str(external));browser.close()
 report={'status':'passed','checks':checks,'renderer':'threejs/WebGL2','physical_device_review':'not_performed','learner_review':'not_performed'}
except Exception as e:report={'status':'failed','checks':checks,'error':str(e)}
finally:server.shutdown();server.server_close()
(out/'inversion-interactions.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));raise SystemExit(0 if report['status']=='passed' else 1)
