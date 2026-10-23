#!/usr/bin/env python3
"""Functional rendering checks for generated, local-only lesson artifacts."""
import argparse
import importlib.metadata
import json
from pathlib import Path
import sys
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

parser=argparse.ArgumentParser()
parser.add_argument('--url',required=True)
parser.add_argument('--artifact',required=True)
parser.add_argument('--chromium',default='/usr/bin/chromium')
args=parser.parse_args()
root=Path(args.artifact)
manifest=json.loads((root/'manifest.json').read_text())
checks_dir=root/'checks'
checks_dir.mkdir(exist_ok=True)
checks=[]
errors=[]
remote=[]
profile={}
def record(name,fn):
    try:
        detail=fn()
        checks.append({'name':name,'status':'passed',**({'detail':detail} if detail else {})})
    except Exception as exc:
        checks.append({'name':name,'status':'failed','error':str(exc)})
def require(value,message):
    if not value: raise AssertionError(message)
def snapshot(page): return page.evaluate('window.lessonAPI.snapshot()')
def set_range(page,label,value):
    slider=page.get_by_label(label,exact=True)
    slider.focus()
    slider.press('Home')
    step=int(slider.get_attribute('step') or '1')
    for _ in range(value//step): slider.press('ArrowRight')
def exercise(page,key,lesson):
    if key=='fractions':
        page.get_by_label('Equal parts',exact=True).focus()
        page.get_by_label('Equal parts',exact=True).select_option('4')
        require(page.get_by_label('Equal parts',exact=True).evaluate('(e)=>e===document.activeElement'),'Selection lost keyboard focus')
        set_range(page,'Shaded parts',2)
        require('2/4' in page.locator('#readout').inner_text(),'Fraction readout did not update')
        widths=page.locator('#stage svg rect').evaluate_all('(r)=>r.map(e=>Number(e.getAttribute("width")))')
        require(abs(sum(widths[:2])-sum(widths[2:]))<.01,'Reference wholes have unequal widths')
    elif key=='shapes':
        before=page.locator('canvas').evaluate('(c)=>c.toDataURL()')
        set_range(page,'Turn the shape',60)
        after=page.locator('canvas').evaluate('(c)=>c.toDataURL()')
        require(before!=after,'3D object did not visibly rotate')
        page.get_by_role('button',name='Solid',exact=True).click()
    elif key=='water':
        page.get_by_label('Water-cycle stage',exact=True).select_option('condensation')
        require('liquid droplets' in page.locator('#stage-note').inner_text(),'Stage explanation missing')
    elif key=='moon':
        set_range(page,'Move through the Moon cycle',4)
        require(page.locator('#stage').inner_text().find('Full moon')>=0,'Full moon diagram label missing')
    elif key=='daynight':
        before=page.locator('canvas').evaluate('(c)=>c.toDataURL()')
        set_range(page,'Turn Earth',180)
        require(page.locator('#readout').inner_text()=='Night','Night did not follow observer rotation')
        require(before!=page.locator('canvas').evaluate('(c)=>c.toDataURL()'),'Illuminated scene did not change')
    elif key=='sentences':
        page.get_by_role('button',name='Add / remove “ran”',exact=True).click()
        require(page.get_by_role('button',name='Add / remove “ran”',exact=True).evaluate('(e)=>e===document.activeElement'),'Word control lost keyboard focus')
        page.get_by_role('button',name='Add / remove “quickly”',exact=True).click()
        require('The dog ran quickly.' in page.locator('#readout').inner_text(),'Sentence did not update')
    elif lesson.get('extension'):
        for step in lesson['acceptance']:
            if step['action']=='click': page.locator(step['selector']).click()
            elif step['action']=='select': page.get_by_label(step['label'],exact=True).select_option(str(step['value']))
            elif step['action']=='press': page.get_by_label(step['label'],exact=True).press(step['key'])
            elif step['action']=='assert_text': require(step['text'] in page.locator(step['selector']).inner_text(),'Extension visible assertion failed')
            elif step['action']=='assert_observed': require(snapshot(page)['observed'][step['field']]==step['value'],'Extension observation assertion failed')
            else: raise AssertionError('Unsupported acceptance step '+str(step))
    else: raise AssertionError('No browser acceptance recipe for plugin '+key)
    page.locator('#check').click()
    require(page.locator('#feedback').get_attribute('data-correct')=='true','Expected correct visible feedback')
    require(snapshot(page)['assessment']['scope']=='this_response_only','Assessment claims exceeded one response')

try:
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=args.chromium,headless=True,args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
        profile={'chromium':browser.version,'playwright':importlib.metadata.version('playwright'),'graphics':'software SwiftShader','device_performance':'not_measured'}
        page=browser.new_page(viewport={'width':1100,'height':850},reduced_motion='reduce')
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.on('console',lambda message:errors.append(message.text) if message.type=='error' else None)
        def route_request(route):
            url=route.request.url
            if urlparse(url).scheme in ('http','https') and urlparse(url).hostname not in ('127.0.0.1','localhost'):
                remote.append(url);route.abort()
            else: route.continue_()
        page.route('**/*',route_request)
        page.goto(args.url,wait_until='networkidle')
        page.wait_for_function('window.__lessonReady === true')
        for index,lesson in enumerate(manifest['lessons']):
            key=lesson['plugin_id']
            prefix=str(index+1)+'-'+key
            def select():
                page.evaluate('(i)=>window.lessonAPI.selectLesson(i)',index)
                page.wait_for_function('window.lessonAPI.snapshot().ready === true')
                require(snapshot(page)['topic_id']==lesson['topic_id'],'Wrong lesson selected')
                if lesson['route']['representation']=='threejs':
                    require(snapshot(page)['presentation']['renderer']=='threejs','Required 3D renderer silently fell back')
                else:
                    require(snapshot(page)['presentation']['renderer']==lesson['route']['representation'],'Presentation renderer differs from its route')
                if lesson['route']['representation'] in ('threejs','canvas2d'):
                    require(page.locator('#stage canvas').count()>0,'Canvas renderer did not create a canvas')
                return snapshot(page)['presentation']
            record(prefix+': initial state',select)
            initial=snapshot(page)['state']
            page.screenshot(path=str(checks_dir/(prefix+'-initial.png')),full_page=True)
            record(prefix+': learning interaction and assessment',lambda:exercise(page,key,lesson))
            page.screenshot(path=str(checks_dir/(prefix+'-assessed.png')),full_page=True)
            def reset_check():
                page.locator('#reset').click()
                require(snapshot(page)['state']==initial,'Reset did not restore model state')
                require(page.locator('#feedback').inner_text()=='','Reset left assessment feedback')
            record(prefix+': reset',reset_check)
            def seek_check():
                first=page.evaluate('window.lessonAPI.renderAt(4).state')
                first_image=page.locator('.stage-wrap').screenshot()
                page.evaluate('window.lessonAPI.renderAt(1)')
                second=page.evaluate('window.lessonAPI.renderAt(4).state')
                second_image=page.locator('.stage-wrap').screenshot()
                require(first==second,'Non-monotonic seeking changed the model result')
                require(first_image==second_image,'Non-monotonic seeking changed the rendered scene')
            record(prefix+': arbitrary seek',seek_check)
            if lesson.get('presentation_checks'):
                def presentation_time():
                    for probe in lesson['presentation_checks']:
                        page.evaluate('(t)=>window.lessonAPI.renderAt(t)',probe['time'])
                        require(page.locator(probe['selector']).get_attribute(probe['attribute'])==probe['equals'],'Presentation did not receive the requested time')
                record(prefix+': time-based presentation',presentation_time)
            page.locator('#reset').click()
            page.set_viewport_size({'width':390,'height':844})
            def mobile():
                require(page.evaluate('document.documentElement.scrollWidth <= innerWidth'),'Small-screen horizontal overflow')
                for button in page.get_by_role('button').all():
                    if button.is_visible():
                        box=button.bounding_box()
                        require(box['height']>=43,'Touch target below 44px (rounding tolerance)')
            record(prefix+': small-screen layout and touch targets',mobile)
            page.screenshot(path=str(checks_dir/(prefix+'-mobile.png')),full_page=True)
            page.set_viewport_size({'width':1100,'height':850})
        def independent():
            other=browser.new_page(viewport={'width':800,'height':800})
            other.goto(args.url,wait_until='networkidle')
            other.wait_for_function('window.__lessonReady === true')
            require(other.evaluate('window.lessonAPI.snapshot().assessment') is None,'New page inherited assessment')
            other.close()
        record('Session-local state isolation',independent)
        if len(manifest['lessons'])>1:
            def rapid_switch():
                page.evaluate('''async () => {
                  const first=window.lessonAPI.selectLesson(0);
                  const second=window.lessonAPI.selectLesson(1);
                  await Promise.all([first,second]);
                }''')
                require(snapshot(page)['topic_id']==manifest['lessons'][1]['topic_id'],'Stale async selection won the race')
                require(snapshot(page)['ready'],'Latest presentation was disposed by a stale selection')
            record('Rapid lesson switching preserves the latest renderer',rapid_switch)
        record('No remote runtime requests',lambda:require(not remote,str(remote)))
        record('No browser errors',lambda:require(not errors,str(errors)))
        browser.close()
except Exception as exc:
    checks.append({'name':'Browser startup/entry readiness','status':'failed','error':str(exc)})
report={'schema_version':'1.0','status':'passed' if checks and all(c['status']=='passed' for c in checks) else 'failed','profile':profile,'checks':checks,'human_visual_review':'not_performed_by_this_script','device_performance':'not_measured'}
(checks_dir/'browser-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report))
sys.exit(0 if report['status']=='passed' else 1)
