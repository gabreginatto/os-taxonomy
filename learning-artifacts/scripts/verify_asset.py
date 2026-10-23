import argparse,json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--report',required=True);a=p.parse_args()
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':500,'height':400})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(a.url,wait_until='networkidle');page.wait_for_function('window.assetResult !== undefined')
        result=page.evaluate('window.assetResult')
        assert result.get('external_asset_loaded'),result
        assert result.get('non_background_pixels',0)>100,result
        assert not errors,errors
        page.screenshot(path=str(Path(a.report).with_suffix('.png')))
        browser.close()
    report={'status':'passed','checks':result}
except Exception as e:
    report={'status':'failed','error':str(e)}
Path(a.report).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report));sys.exit(0 if report['status']=='passed' else 1)
