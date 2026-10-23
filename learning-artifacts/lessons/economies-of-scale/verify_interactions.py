#!/usr/bin/env python3
"""Play all five Press Club weeks through real buttons, keyboard input and 3D pointer picks."""
import argparse,json
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--out',required=True);p.add_argument('--chromium',default='/usr/bin/chromium');args=p.parse_args()
out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];external=[]
def require(value,message):
 if not value:raise AssertionError(message)
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path=args.chromium,headless=True,args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=browser.new_page(viewport={'width':1200,'height':950},reduced_motion='reduce');page.set_default_timeout(15000)
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' and 'favicon' not in m.text and '404' not in m.text else None)
  def route(r):
   u=urlparse(r.request.url)
   if u.scheme in ['http','https'] and u.netloc!=urlparse(args.url).netloc:external.append(r.request.url);r.abort()
   else:r.continue_()
  page.route('**/*',route)
  snap=lambda:page.evaluate('window.lessonAPI.snapshot()')
  obs=lambda:snap()['observed']
  canvas=lambda:page.locator('.pc-world canvas').evaluate('(c)=>c.toDataURL()')
  def click(selector):page.locator(selector).click()
  def pick(name):
   page.locator('.pc-world').scroll_into_view_if_needed()
   target=next((t for t in snap()['presentation']['pick_targets'] if t['name']==name),None);require(target,'No 3D pick target '+name)
   box=page.locator('.pc-world canvas').bounding_box();page.mouse.click(box['x']+target['x']*box['width'],box['y']+target['y']*box['height'])
  def check(expected,contains=None):
   click('#check');a=snap()['assessment'];require(a['correct']==expected,'Unexpected assessment: '+a['message']);require(a['scope']=='this_response_only' and a['mastery_claim'] is False,'Assessment exceeded one response')
   if contains:require(contains in page.locator('#feedback').inner_text(),'Feedback missing "'+contains+'": '+a['message'])
  def next_week(week):
   require(page.locator('#pc-next').is_visible(),'Next week button hidden after a correct check');click('#pc-next')
   require(obs()['week']==week,'Did not advance to week '+str(week));require(page.locator('#pc-title').evaluate('(e)=>e===document.activeElement'),'New week heading did not receive focus')
  def dials(s1,s2):
   for key,value in (('s1',s1),('s2',s2)):
    while obs()['dials'][key]<value:click('#pc-'+key+'-plus')
    while obs()['dials'][key]>value:click('#pc-'+key+'-minus')
  for width,height in [(1200,950),(390,844),(320,740)]:
   page.set_viewport_size({'width':width,'height':height});page.goto(args.url,wait_until='networkidle');page.wait_for_function('window.__lessonReady===true')
   require(snap()['presentation']['renderer']=='threejs' and not snap()['runtime_fallback'],'3D silently fell back')
   require(page.locator('#pc-run').is_visible() and page.locator('#pc-run').bounding_box()['y']+page.locator('#pc-run').bounding_box()['height']<=height,'First action is below the fold')
   require(page.locator('#pc-reasons button').count()==0,'Reasoning options shown before any evidence')
   # Week 1: 3D order pad and Run button, then keyboard.
   before=canvas();pick('orders-20');require(obs()['dials']['orders']==20,'3D order pad failed');require(before!=canvas(),'Order pick did not change the scene')
   pick('run');require(obs()['day']==1 and obs()['cured']==20 and obs()['average']==3100,'3D Run did not run the day')
   check(False,'lost £140')
   page.locator('#pc-orders-30').focus();page.keyboard.press('Enter');require(obs()['dials']['orders']==30,'Keyboard order selection failed');require(page.locator('#pc-orders-30').evaluate('(e)=>e===document.activeElement'),'Order button lost focus')
   check(False,'changed the setup')
   page.locator('#pc-run').focus();page.keyboard.press('Enter');require(obs()['profit']==6000 and '£22.00' in page.locator('#pc-tile-avg').inner_text(),'Keyboard run failed')
   click('#pc-reason-total');check(False,'total went up');click('#pc-reason-shared');check(True,'Fixed-cost spreading')
   page.locator('#stage').screenshot(path=str(out/f'week1-{width}.png'));next_week(2)
   # Week 2: the trap jams; add a tunnel by picking its ghost slot in 3D.
   pick('run');require(obs()['stuck']==20 and obs()['unfilled']==20,'Bottleneck trap did not jam')
   require(page.locator('.pc-badge-stuck').is_visible(),'Stuck pile badge missing');check(False,'never cured')
   page.locator('#stage').screenshot(path=str(out/f'bottleneck-{width}.png'));page.locator('.pc-world').screenshot(path=str(out/f'bottleneck-world-{width}.png'))
   pick('add-s2');require(obs()['dials']['s2']==2,'3D ghost tunnel did not add a tunnel');click('#pc-run');require(obs()['profit']==24000,'Second tunnel did not fix the bottleneck')
   click('#pc-reason-late');check(False,'slowest step');click('#pc-reason-slowest');check(True,'bottleneck');next_week(3)
   # Week 3: map sizes, find the best, see the star.
   click('#pc-run');dials(2,2);click('#pc-run');dials(5,4);click('#pc-run')
   check(False,'most profitable size')
   require(page.locator('#pc-chart circle').count()==3,'Ledger did not plot three runs')
   dials(4,3);click('#pc-run');require(obs()['average']==1400,'Four presses and three tunnels wrong');click('#pc-reason-sync');check(True,'sweet spot')
   require(page.locator('#pc-chart .pc-star').count()==1,'Winning star missing');page.locator('#stage').screenshot(path=str(out/f'scale-{width}.png'));page.locator('.pc-world').screenshot(path=str(out/f'scale-world-{width}.png'));next_week(4)
   # Week 4: idle leases; shrink with the 3D minus tokens.
   click('#pc-run');require(obs()['profit']==-42000 and 'idle' in page.locator('#pc-outcome').inner_text(),'Idle capacity not shown')
   pick('remove-s1');pick('remove-s1');pick('remove-s2');require(obs()['dials']=={'s1':2,'s2':2},'3D remove tokens failed: '+json.dumps(obs()['dials']))
   click('#pc-run');click('#pc-reason-slow');check(False,'dimmed');click('#pc-reason-idle');check(True,'Idle capacity');next_week(5)
   # Week 5: noodle transfer.
   click('#pc-run');dials(2,3);click('#pc-run');require(obs()['profit']==4000,'Noodle stall best setup wrong')
   page.locator('.pc-world').screenshot(path=str(out/f'noodles-world-{width}.png'))
   click('#pc-reason-bigger');check(False);click('#pc-reason-carried');check(True,'new place')
   click('#pc-next');require(obs()['complete'] and page.locator('#pc-finish').is_visible() and page.locator('#pc-finish-list li').count()==5,'Finish screen missing')
   page.screenshot(path=str(out/f'complete-{width}.png'),full_page=True)
   # Six-day week and restart.
   click('#pc-again');require(obs()['week']==1 and obs()['day']==0,'Play again did not restart')
   for _ in range(6):click('#pc-run')
   require(page.locator('#pc-run').is_disabled() and page.locator('#pc-retry').is_visible(),'Week-over state missing')
   click('#pc-retry');require(obs()['attempt']==1 and obs()['day']==0 and len(obs()['ledger'])==6,'Restarting the week lost earlier days')
   click('#reset');require(snap()['state']==page.evaluate('window.lessonAPI.snapshot().state') and obs()['day']==0 and obs()['ledger']==[] and snap()['assessment'] is None,'Reset left progress')
   require(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Horizontal overflow')
   for button in page.get_by_role('button').all():
    if button.is_visible():require(button.bounding_box()['height']>=43,'Touch target below 44px')
   require(page.locator('canvas').count()==1,'A stale renderer leaked')
   page.locator('#stage').screenshot(path=str(out/f'start-{width}.png'));checks.append({'viewport':width,'five_weeks':'passed','scene_picking':'passed','wrong_answers':'passed','keyboard':'passed','week_budget':'passed','reset':'passed'})
  # Live playback must be cancelled by a seek, and repeated seeks must render the same still frame.
  page.set_viewport_size({'width':1200,'height':950});page.emulate_media(reduced_motion='no-preference');page.goto(args.url,wait_until='networkidle');page.wait_for_function('window.__lessonReady===true')
  click('#pc-orders-30');click('#pc-run');page.wait_for_timeout(250);mid=page.locator('#pc-tile-profit').inner_text()
  require('…' in mid,'Run did not play back live')
  page.evaluate('window.lessonAPI.renderAt(4)');first=canvas();page.wait_for_timeout(1200);require(first==canvas(),'A stale tween changed the sought scene')
  page.evaluate('window.lessonAPI.renderAt(1)');page.evaluate('window.lessonAPI.renderAt(4)');require(first==canvas(),'Repeated-time scene differs')
  require(not errors,'Browser errors: '+str(errors));require(not external,'External runtime requests: '+str(external));browser.close()
 report={'status':'passed','checks':checks,'motion_seek':'passed','external_requests':0,'browser_errors':0,'learner_review':'not_performed','physical_device_review':'not_performed'}
except Exception as e:report={'status':'failed','checks':checks,'error':str(e),'browser_errors':errors,'external_requests':external}
(out/'press-club-interactions.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));raise SystemExit(0 if report['status']=='passed' else 1)
