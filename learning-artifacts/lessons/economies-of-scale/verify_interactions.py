#!/usr/bin/env python3
"""Exercise all five experiments through real buttons and 3D pointer events."""
import argparse,json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--out',required=True);args=p.parse_args();out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];external=[]
def require(value,message):
 if not value:raise AssertionError(message)
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1200,'height':950},reduced_motion='reduce');page.set_default_timeout(15000)
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  def route(r):
   if urlparse(r.request.url).scheme in ['http','https'] and urlparse(r.request.url).netloc!=urlparse(args.url).netloc:external.append(r.request.url);r.abort()
   else:r.continue_()
  page.route('**/*',route)
  def snap():return page.evaluate('window.lessonAPI.snapshot()')
  def click(selector):page.locator(selector).click()
  def picked(name):
   page.locator('#sc-world').scroll_into_view_if_needed();target=next(t for t in snap()['presentation']['pick_targets'] if t['name']==name);box=page.locator('#sc-world canvas').bounding_box();page.mouse.click(box['x']+target['x']*box['width'],box['y']+target['y']*box['height'])
  def answer(value,expected):
   click('#sc-answer-'+value);click('#check');require(snap()['assessment']['correct']==expected,'Incorrect feedback for '+value);require(snap()['assessment']['scope']=='this_response_only','Assessment exceeded one response')
  def advance(phase):
   click('#sc-next');require(snap()['state']['phase']==phase,'Wrong next experiment');require(page.locator('#sc-question').evaluate('(e)=>e===document.activeElement'),'New task did not receive focus')
  for width,height in [(1200,950),(390,844),(320,740)]:
   page.set_viewport_size({'width':width,'height':height});page.goto(args.url,wait_until='networkidle');page.wait_for_function('window.__lessonReady===true')
   require(snap()['presentation']['renderer']=='threejs','3D silently fell back');require(not snap()['runtime_fallback'],'Unexpected fallback');require(not page.locator('#sc-challenge').is_visible(),'Reasoning question revealed before trying the larger batch')
   first=page.locator('#sc-world canvas').evaluate('(c)=>c.toDataURL()');picked('20 orders');require(snap()['observed']['total']==18000 and snap()['observed']['average']==900,'3D crate did not select the larger batch');require(first!=page.locator('#sc-world canvas').evaluate('(c)=>c.toDataURL()'),'Crate choice did not change the scene')
   page.locator('#sc-batch-10').focus();page.keyboard.press('Enter');require(snap()['observed']['produced']==10,'Keyboard batch selection failed');require(page.locator('#sc-batch-10').evaluate('(e)=>e===document.activeElement'),'Selection lost keyboard focus')
   click('#sc-batch-20');answer('total',False);click('#sc-help');answer('spread',True);require(snap()['assessment']['assistance']=='help_requested','Help use was lost');advance('bottleneck')
   require(snap()['state']['history'][0]['help'] and not snap()['state']['help'],'History or new-scene help scope wrong')
   picked('assembly');require(snap()['observed']['assembly']==160 and snap()['observed']['produced']==40,'Nonlimiting assembly upgrade changed finished output');answer('packing',False)
   picked('packing');require(snap()['observed']['produced']==80 and snap()['observed']['average']==650,'Packing bottleneck repair failed');answer('packing',True)
   page.locator('#stage').screenshot(path=str(out/f'bottleneck-{width}.png'));advance('grow')
   click('#sc-teams-2');answer('coordination',False);require('unfilled' in page.locator('#feedback').inner_text(),'Cheap-but-infeasible plan not explained')
   picked('team-6');require(snap()['observed']['total']==92000,'3D team picking failed');answer('coordination',False)
   click('#sc-curve-4');require(snap()['observed']['total']==63000 and snap()['observed']['average']==787.5,'Four-team model wrong');answer('cheapest',False);answer('coordination',True)
   require(page.locator('#sc-bars button').count()==6,'Curve is incomplete');page.locator('#stage').screenshot(path=str(out/f'growth-{width}.png'));page.locator('#sc-world').screenshot(path=str(out/f'growth-world-{width}.png'));advance('quiet')
   require(snap()['observed']['requested']==20 and snap()['observed']['teams']==4 and snap()['observed']['average']==1950,'Demand shock did not preserve the four-team comparison');picked('team-1');answer('demand',True);advance('transfer')
   picked('big');require(snap()['observed']['profit']==4000,'Large stall plan profit wrong');answer('profit',False);picked('small');answer('rent',False);answer('profit',True);require(snap()['observed']['profit']==36000,'Transfer profit wrong');click('#sc-next')
   require(snap()['state']['complete'] and len(snap()['state']['history'])==5,'Five experiments did not complete');require(page.locator('#sc-complete').is_visible(),'Completion explanation missing');page.screenshot(path=str(out/f'complete-{width}.png'),full_page=True)
   click('#reset');require(snap()['state']['phase']=='share' and not snap()['state']['history'] and snap()['assessment'] is None,'Reset left history or assessment')
   require(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow')
   for button in page.get_by_role('button').all():
    if button.is_visible():require(button.bounding_box()['height']>=43,'Touch target below 44px')
   require(page.locator('canvas').count()==1,'A stale renderer leaked after reset')
   page.locator('#stage').screenshot(path=str(out/f'world-{width}.png'));checks.append({'viewport':width,'five_experiments':'passed','scene_picking':'passed','wrong_answers':'passed','keyboard_focus':'passed','reset':'passed'})
  # Cancel live motion on arbitrary seek, then check deterministic non-monotonic replay.
  page.emulate_media(reduced_motion='no-preference');click('#sc-batch-20');page.evaluate('window.lessonAPI.renderAt(1)');page.evaluate('window.lessonAPI.renderAt(4)');before=page.locator('#sc-world canvas').evaluate('(c)=>c.toDataURL()');state=snap()['state'];page.wait_for_timeout(700);require(before==page.locator('#sc-world canvas').evaluate('(c)=>c.toDataURL()'),'A stale tween changed the sought scene')
  page.evaluate('window.lessonAPI.renderAt(1)');page.evaluate('window.lessonAPI.renderAt(4)');require(state==snap()['state'] and before==page.locator('#sc-world canvas').evaluate('(c)=>c.toDataURL()'),'Repeated-time scene or state differs')
  require(not errors,'Browser errors: '+str(errors));require(not external,'External runtime requests: '+str(external));browser.close()
 report={'status':'passed','checks':checks,'motion_seek':'passed','external_requests':0,'browser_errors':0,'learner_review':'not_performed','physical_device_review':'not_performed'}
except Exception as e:report={'status':'failed','checks':checks,'error':str(e),'browser_errors':errors,'external_requests':external}
(out/'scale-interactions.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));raise SystemExit(0 if report['status']=='passed' else 1)
