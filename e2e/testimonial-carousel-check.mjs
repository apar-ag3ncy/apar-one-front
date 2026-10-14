import assert from "node:assert/strict";
import { chromium } from "playwright";
const base = process.env.URL || "http://127.0.0.1:3021";
const browser = await chromium.launch({ ...(process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : { channel: "chrome" }), headless: true });
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const stage=page.locator('.tc-stage');
const settled=()=>page.locator('.tc-stage[data-moving="false"]').waitFor();
const active=()=>page.locator('.tc-sources [data-active="true"]').getAttribute('data-brand');
try {
 await page.goto(`${base}/#testimonials`,{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
 await page.locator('.tc-stage[data-ready="true"]').waitFor();await stage.scrollIntoViewIfNeeded();
 assert.equal(await page.locator('.testimonial-carousel button,.testimonial-carousel select').count(),0);
 assert.equal(await page.locator('.tc-sources>.tc-page').count(),13);
 const normals=await page.locator('.tc-card-layer[data-offset="0.000"] .tc-strip').evaluateAll(els=>new Set(els.map(el=>el.style.transform.match(/rotateY\(([^)]+)/)?.[1])).size);
 assert(normals>15,'Centre card must curve around the drum, not remain a flat plane');
 const seen=new Set();await stage.focus();
 for(let i=0;i<13;i++){seen.add(await active());await page.keyboard.press('ArrowRight');await settled();}
 assert.equal(seen.size,13);assert.equal(await active(),'chheda');
 await page.keyboard.press('ArrowLeft');await settled();assert.equal(await active(),'harshit-gold');
 await page.keyboard.press('Home');await settled();
 const r=await stage.boundingBox();const source=await page.locator('.tc-sources').boundingBox();const x=r.x+r.width*.6,y=r.y+250;
 await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-source.width*.65,y,{steps:18});
 assert.equal(await stage.getAttribute('data-moving'),'true');await page.mouse.up();await settled();assert.notEqual(await active(),'chheda');
 const before=await active();await page.mouse.wheel(0,120);await page.waitForTimeout(300);assert.equal(await active(),before);
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});await settled();
  const clipped=await page.locator('.tc-sources .tc-copy').evaluateAll(els=>els.filter(el=>el.scrollHeight>el.clientHeight+1).length);
  assert.equal(clipped,0,`quotes clip at ${width}`);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await page.emulateMedia({reducedMotion:'reduce'});await settled();await stage.focus();await page.keyboard.press('End');await settled();assert.equal(await active(),'harshit-gold');
 assert.equal(await page.locator('.tc-visual').evaluate(el=>getComputedStyle(el).display),'none');
 assert.deepEqual(errors,[]);console.log('PASS: 13 stories, wraparound, curved surfaces, direct drag, vertical-scroll passthrough, responsive content, reduced motion');
} finally {await browser.close();}
