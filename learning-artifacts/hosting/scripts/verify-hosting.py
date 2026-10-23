#!/usr/bin/env python3
"""Validate the child-facing catalog and published activity in a real browser."""
import argparse,json
from pathlib import Path
from urllib.parse import urlparse,urljoin
from playwright.sync_api import sync_playwright
parser=argparse.ArgumentParser();parser.add_argument('--root',required=True);parser.add_argument('--build',required=True);parser.add_argument('--out',required=True)
args=parser.parse_args();manifest=json.loads(Path(args.build).read_text());out=Path(args.out);out.mkdir(parents=True,exist_ok=True)
checks=[];errors=[];bad=[];external=[]
def require(value,message):
    if not value:raise AssertionError(message)
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':1200,'height':900},reduced_motion='reduce')
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
        page.on('response',lambda r:bad.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
        def route(r):
            if urlparse(r.request.url).scheme in ('http','https') and urlparse(r.request.url).netloc!=urlparse(args.root).netloc:external.append(r.request.url);r.abort()
            else:r.continue_()
        page.route('**/*',route)
        for width,height in [(1200,900),(390,844)]:
            page.set_viewport_size({'width':width,'height':height});page.goto(args.root,wait_until='networkidle')
            require(page.get_by_role('heading',level=1).count()==1,'Catalog title missing')
            require(page.locator('a.world').count()==len(manifest['activities']),'Catalog activity count differs from build')
            require(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Catalog overflows')
            require(page.locator('img').evaluate_all('(images)=>images.every(i=>i.complete&&i.naturalWidth>0)'),'Catalog image failed')
            page.screenshot(path=str(out/f'catalog-{width}.png'),full_page=True)
            for activity in manifest['activities']:
                link=page.locator('a.world[href="'+activity['href']+'"]');require(link.bounding_box()['height']>=44,'Activity link too small');link.click()
                page.wait_for_function('window.__lessonReady===true');snapshot=page.evaluate('window.lessonAPI.snapshot()')
                require(snapshot['ready'] and snapshot['topic_id'] in activity['topic_ids'],'Wrong activity served')
                require(snapshot['presentation']['renderer']==activity['renderers'][0] and not snapshot['runtime_fallback'],'Renderer silently fell back')
                require(page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Activity overflows')
                if snapshot['plugin_id']=='opportunity-cost-lab':
                    page.locator('#oc-plan-robot').click();page.locator('#oc-commit').click();page.locator('#oc-plan-film').click();page.locator('#check').click()
                    require(page.locator('#feedback').get_attribute('data-correct')=='true','Hosted 3D interaction failed')
                    require(page.locator('#oc-reveal').is_visible(),'Hosted trade-off explanation missing')
                    page.locator('#oc-next').click();page.locator('#oc-plan-film').click();page.locator('#check').click()
                    require(page.locator('#feedback').get_attribute('data-correct')=='true','Hosted original-budget challenge failed')
                elif snapshot['plugin_id']=='inversion-mission':
                    def primary():page.locator('#inv-primary').click()
                    def fix(part,prediction,repair):
                        page.locator('#inv-part-'+part).click();primary();page.locator('#inv-predict-'+prediction).click();primary();page.locator('#inv-repair-'+repair).click();primary()
                    primary();primary();fix('hatch','spill','unload')
                    require(page.evaluate('window.lessonAPI.snapshot().observed.lastFlight.empty'),'Hosted empty-cargo counterexample failed')
                    page.locator('#inv-undo').click();fix('hatch','spill','seal');primary();primary();primary()
                    fix('hatch','spill','seal')
                    require(page.evaluate('window.lessonAPI.snapshot().observed.lastFlight.wrongMoon'),'Hosted independent failure path missing')
                    primary();fix('beacon','wrong-moon','wake');primary()
                    page.locator('#inv-conclusion-guarantee').click();page.locator('#check').click()
                    require(page.locator('#feedback').get_attribute('data-correct')=='false','Hosted guarantee misconception accepted')
                    page.locator('#inv-conclusion-limits').click();page.locator('#check').click()
                    require(page.locator('#feedback').get_attribute('data-correct')=='true' and page.evaluate('window.lessonAPI.snapshot().state.phase')=='complete','Hosted inversion mission did not complete')
                elif snapshot['plugin_id']=='economies-of-scale':
                    observed=lambda field:page.evaluate('window.lessonAPI.snapshot().observed')[field]
                    def week_check(expected=True):
                        page.locator('#check').click()
                        require(page.locator('#feedback').get_attribute('data-correct')==str(expected).lower(),'Hosted Press Club feedback failed in week '+str(observed('week')))
                    def week_next(week):
                        page.locator('#pc-next').click();require(observed('week')==week,'Hosted Press Club progression failed')
                    def setup(s1,s2):
                        for key,value in (('s1',s1),('s2',s2)):
                            while observed('dials')[key]<value:page.locator('#pc-'+key+'-plus').click()
                            while observed('dials')[key]>value:page.locator('#pc-'+key+'-minus').click()
                    run=lambda:page.locator('#pc-run').click()
                    page.locator('#pc-orders-20').click();run();page.locator('#pc-orders-30').click();run()
                    page.locator('#pc-reason-total').click();week_check(False);page.locator('#pc-reason-shared').click();week_check();week_next(2)
                    run();require(observed('stuck')==20,'Hosted bottleneck did not jam');setup(2,2);run();page.locator('#pc-reason-slowest').click();week_check();week_next(3)
                    run();setup(2,2);run();setup(5,4);run();page.locator('#pc-reason-sync').click();week_check(False)
                    setup(4,3);run();require(observed('average')==1400,'Hosted best studio size incorrect');week_check();week_next(4)
                    run();setup(2,2);run();page.locator('#pc-reason-idle').click();week_check();week_next(5)
                    run();setup(2,3);run();page.locator('#pc-reason-carried').click();week_check();page.locator('#pc-next').click()
                    require(observed('complete') and page.locator('#pc-finish').is_visible(),'Hosted Press Club did not complete')
                page.screenshot(path=str(out/(activity['slug']+'-'+str(width)+'.png')),full_page=True)
                page.goto(args.root,wait_until='networkidle')
            page.get_by_role('link',name='Sources & credits').click();require(page.get_by_role('heading',name='Sources & credits').count()==1,'Credits link failed')
            checks.append({'viewport':width,'catalog':'passed','activities':'passed','credits':'passed'})
        require(not errors,'Browser errors: '+str(errors));require(not bad,'HTTP errors: '+str(bad));require(not external,'Cross-origin runtime requests: '+str(external))
        browser.close()
    report={'status':'passed','checks':checks,'external_requests':0,'http_errors':0,'physical_device_review':'not_performed'}
except Exception as e:report={'status':'failed','checks':checks,'error':str(e),'http_errors':bad,'browser_errors':errors,'external_requests':external}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));raise SystemExit(0 if report['status']=='passed' else 1)
