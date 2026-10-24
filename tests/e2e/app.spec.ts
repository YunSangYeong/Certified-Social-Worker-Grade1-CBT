import { expect, test, type Page } from '@playwright/test';
import bank from '../../src/data/questions-main.json' with { type:'json' };
const key='social-worker-grade1-cbt:v1';
async function read(page:Page){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)!),key);}
async function nav(page:Page,label:string){
 if(await page.getByRole('button',{name:'메뉴 열기'}).isVisible()) await page.getByRole('button',{name:'메뉴 열기'}).click();
 await page.getByRole('navigation').getByRole('button',{name:label,exact:true}).click();
}
const choices=(page:Page)=>page.getByRole('group',{name:'답안 선택'}).getByRole('button');
test('대시보드·모든 메뉴·상단 배너와 학습 기준 선택 없음·가로 넘침 없음',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('');
 await expect(page.getByRole('heading',{name:'사회복지사 1급 필기 CBT',exact:true})).toBeVisible();
 await expect(page.locator('.bank-summary')).toContainText(/등록\s*1000문항/);
 for(const label of ['실전 모의시험','랜덤 문제풀이','오답노트','북마크','학습 통계','문제은행 관리','학습 대시보드']){
  await nav(page,label);await expect(page.locator('.criteria-note')).toHaveCount(0);await expect(page.getByLabel('학습 기준')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(label==='문제은행 관리'){await expect(page.locator('.notice')).toContainText('부족 0문항');await expect(page.locator('.notice')).toContainText('사례 적용형 800문항');}
 }
 expect(errors).toEqual([]);
});
test('실전 5보기·답안 변경·Space와 포커스·교시 경계·새로고침·제출 취소',async({page})=>{
 await page.goto('');await page.getByRole('button',{name:'모의시험 시작하기',exact:true}).click();
 await expect(page.locator('.number-grid button')).toHaveCount(50);await expect(choices(page)).toHaveCount(5);
 await expect(page.getByLabel('남은 시간')).toContainText(/50:00|49:5\d/);await expect(page.locator('.explanation')).toHaveCount(0);
 await page.keyboard.press('Space');await expect(page.locator('.question-counter strong')).toHaveText('01');
 await choices(page).nth(0).click();await choices(page).nth(4).click();await expect(page.locator('.question-stem')).toBeFocused();
 const before=await read(page);expect(before.exam.answers[before.exam.questions[0].id]).toBe(5);
 await page.keyboard.down('Space');await page.keyboard.down('Space');await page.keyboard.up('Space');
 await expect(page.locator('.question-counter strong')).toHaveText('02');
 await page.reload();expect((await read(page)).exam.deadline).toBe(before.exam.deadline);expect((await read(page)).exam.answers).toEqual(before.exam.answers);
 await page.getByRole('button',{name:'50번 미응답',exact:true}).click();await choices(page).first().click();await page.keyboard.press('Space');
 await expect(page.locator('.question-counter strong')).toHaveText('50');await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'현재 교시 제출',exact:true}).click();await page.getByRole('dialog').focus();await page.keyboard.press('Space');await expect(page.getByRole('dialog')).toBeVisible();
 await page.getByRole('button',{name:'돌아가기',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'현재 교시 제출',exact:true}).click();await page.getByRole('button',{name:'현재 교시 제출하기',exact:true}).click();
 await expect(page.getByRole('heading',{name:'1교시 제출 완료'})).toBeVisible();
 await page.reload();await page.getByRole('button',{name:'다음 교시 시작'}).click();await expect(page.locator('.question-counter strong')).toHaveText('51');await expect(page.locator('.number-grid button')).toHaveCount(75);
 await expect(page.getByLabel('남은 시간')).toContainText(/75:00|74:5\d/);
});
test('3교시 전체 답변·과락 없는 합격·결과 해설·오답 복습·통계·기록 보관',async({page})=>{
 await page.goto('');await page.getByRole('button',{name:'모의시험 시작하기',exact:true}).click();
 // Test fixture prepopulates correct answers; UI still performs section transitions and final grading.
 for(let section=0;section<3;section++){
  const state=await read(page);const start=[0,50,125][section],end=[50,125,200][section];
  await page.evaluate(({key,start,end})=>{const s=JSON.parse(localStorage.getItem(key)!);s.exam.questions.slice(start,end).forEach((q:any,i:number)=>{if(i!==0)s.exam.answers[q.id]=q.answer;});localStorage.setItem(key,JSON.stringify(s));},{key,start,end});
  await page.reload();await page.getByRole('button',{name:'현재 교시 제출',exact:true}).click();await page.getByRole('button',{name:'현재 교시 제출하기',exact:true}).click();
  if(section<2) await page.getByRole('button',{name:'다음 교시 시작'}).click();
 }
 await expect(page.getByRole('heading',{name:'모의시험 결과'})).toBeVisible();await expect(page.locator('.result-hero')).toContainText('합격');
 await expect(page.locator('.review-card')).toHaveCount(200);await page.getByLabel('오답만 보기').check();await expect(page.locator('.review-card')).toHaveCount(3);
 expect((await read(page)).attempts).toHaveLength(200);
 await page.getByRole('button',{name:'이 시험 오답만 다시 풀기'}).click();await expect(page.locator('.practice-question')).toBeVisible();
 await nav(page,'학습 통계');await expect(page.locator('main')).toContainText('98.5점');
});
test('만료 재접속·답안 잠금·교시별 자동 제출·중복 방지',async({page})=>{
 await page.goto('');await page.getByRole('button',{name:'모의시험 시작하기',exact:true}).click();
 for(let section=0;section<3;section++){
  await page.evaluate(k=>{const s=JSON.parse(localStorage.getItem(k)!);const duration=s.exam.deadline-s.exam.sectionStartedAt;s.exam.sectionStartedAt=Date.now()-duration-2000;s.exam.deadline=s.exam.sectionStartedAt+duration;localStorage.setItem(k,JSON.stringify(s));},key);
  await page.reload();
  if(section<2){await expect(page.getByRole('heading',{name:`${section+1}교시 제출 완료`})).toBeVisible();await page.getByRole('button',{name:'다음 교시 시작'}).click();}
 }
 await expect(page.getByRole('heading',{name:'모의시험 결과'})).toBeVisible();await page.waitForTimeout(1100);
 const s=await read(page);expect(s.results).toHaveLength(1);expect(s.attempts).toHaveLength(200);expect(s.results[0].reason).toBe('timeout');expect(s.results[0].answers).toEqual({});
});
test('랜덤 즉시 채점·Space 실제 입력·오답·북마크·복원·컨트롤 보호',async({page})=>{
 await page.goto('');await page.getByRole('button',{name:'문제풀이 시작하기',exact:true}).click();
 const original=await read(page);const q=bank.find(q=>q.id===original.practice.currentId)!;
 await page.keyboard.press('Space');expect((await read(page)).practice.currentId).toBe(q.id);
 await page.getByRole('button',{name:'북마크 추가'}).click();await choices(page).nth(q.answer%5).click();
 await expect(page.locator('.question-stem')).toBeFocused();await expect(page.locator('.explanation')).toBeVisible();expect((await read(page)).attempts).toHaveLength(1);
 await page.getByLabel('연습 과목 변경').focus();await page.keyboard.press('Space');expect((await read(page)).practice.currentId).toBe(q.id);
 await page.locator('.question-stem').focus();await page.keyboard.press('Shift+Space');expect((await read(page)).practice.currentId).toBe(q.id);
 await page.keyboard.down('Space');await page.keyboard.down('Space');await page.keyboard.up('Space');const next=(await read(page)).practice.currentId;expect(next).not.toBe(q.id);
 await page.reload();expect((await read(page)).practice.currentId).toBe(next);
 await nav(page,'북마크');await expect(page.locator('.review-card')).toHaveCount(1);await nav(page,'오답노트');await expect(page.locator('.review-card')).toHaveCount(1);
 await page.getByRole('button',{name:'1문제 다시 풀기'}).click();await choices(page).nth(q.answer-1).click();expect((await read(page)).wrongIds).not.toContain(q.id);
});
test('JSON·CSV 로컬 등록·중복·검수 승인·검색·백업·초기화',async({page})=>{
 await page.goto('');await nav(page,'문제은행 관리');
 const q={...bank[0],id:'LOCAL-TEST',question:'등록 흐름 확인용: '+bank[0].question};
 await page.getByLabel('문제 파일 가져오기').setInputFiles({name:'test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify([q,q]))});
 await page.getByLabel('문항 검색').fill('LOCAL-TEST');const row=page.locator('.bank-row');await row.locator('summary').click();await expect(row).toContainText('검증 대기');
 await page.getByRole('button',{name:'검수 내용 확인 및 승인'}).click();await page.locator('.review-form textarea').fill('테스트 픽스처의 원문·권리·답안 확인');await page.locator('.review-form input[type=checkbox]').check();await page.getByRole('button',{name:'검수 완료로 처리',exact:true}).click();
 expect((await read(page)).imported).toHaveLength(1);expect((await read(page)).imported[0].verificationStatus).toBe('reviewed');
 await page.getByLabel('문제 파일 가져오기').setInputFiles('public/templates/questions.csv');await expect(page.getByRole('status')).toContainText('중복 1문항');
 if(await page.getByRole('button',{name:'메뉴 열기'}).isVisible())await page.getByRole('button',{name:'메뉴 열기'}).click();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'학습 기록 백업',exact:true}).click();expect((await download).suggestedFilename()).toContain('social-worker');
 await page.getByRole('button',{name:'데이터 초기화',exact:true}).click();await page.getByRole('button',{name:'모든 데이터 초기화',exact:true}).click();expect((await read(page)).imported).toEqual([]);
});
test('저장소 손상·저장 실패 경고 보존',async({page})=>{
 await page.addInitScript(k=>localStorage.setItem(k,'{broken'),key);await page.goto('');await expect(page.getByRole('alert')).toContainText('덮어쓰지 않고');
 expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('{broken');
});
test('저장 공간 오류 경고',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('quota','QuotaExceededError');};});await page.goto('');await expect(page.getByRole('alert')).toContainText('저장하지 못했습니다');
});
for(const size of [{width:390,height:480},{width:740,height:360}])test(`작은 메뉴 실제 휠 하단·상단 접근 ${size.width}×${size.height}`,async({page})=>{
 await page.setViewportSize(size);await page.goto('');await page.getByRole('button',{name:'메뉴 열기'}).click();await page.waitForTimeout(400);
 const side=page.locator('.sidebar');await page.mouse.move(150,220);await page.mouse.wheel(0,1600);await page.waitForTimeout(400);
 expect(await side.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);await expect(page.getByRole('button',{name:'데이터 초기화',exact:true})).toBeInViewport();
 const dl=page.waitForEvent('download');await page.getByRole('button',{name:'학습 기록 백업',exact:true}).click();await dl;
 await page.mouse.move(150,220);await page.mouse.wheel(0,-2000);await page.waitForTimeout(400);
 await expect(page.getByRole('navigation').getByRole('button',{name:'학습 대시보드',exact:true})).toBeInViewport();await page.getByRole('navigation').getByRole('button',{name:'학습 대시보드',exact:true}).click();await expect(side).not.toHaveClass(/open/);
});
test('모바일 터치 스와이프·가로·글자 확대에서 실제 하단·상단 접근',async({page,isMobile})=>{
 test.skip(!isMobile,'touch emulation project only');
 const cdp=await page.context().newCDPSession(page);
 async function swipe(y1:number,y2:number){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:145,y:y1}]});
  for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:145,y:y1+(y2-y1)*i/12}]});await page.waitForTimeout(20);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(350);
 }
 for(const size of [{width:390,height:480},{width:740,height:360}]){
  await page.setViewportSize(size);await page.goto('');await page.addStyleTag({content:'.sidebar nav button {font-size: 23px; min-height: 64px}'});await page.getByRole('button',{name:'메뉴 열기'}).tap();await page.waitForTimeout(400);
  for(let i=0;i<5;i++)await swipe(size.height-45,65);
  expect(await page.locator('.sidebar').evaluate(e=>e.scrollTop)).toBeGreaterThan(0);
  await expect(page.getByRole('button',{name:'데이터 초기화',exact:true})).toBeInViewport();
  await page.getByRole('button',{name:'데이터 초기화',exact:true}).tap();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'돌아가기',exact:true}).tap();
  for(let i=0;i<5;i++)await swipe(65,size.height-45);
  await expect(page.getByRole('navigation').getByRole('button',{name:'학습 대시보드',exact:true})).toBeInViewport();await page.getByRole('navigation').getByRole('button',{name:'학습 대시보드',exact:true}).tap();await expect(page.locator('.sidebar')).not.toHaveClass(/open/);
 }
});
test('타이머 콜백 전 만료 클릭도 모든 교시의 답안 잠금과 최종 결과 이동',async({page})=>{
 await page.clock.install({time:new Date('2026-01-01T00:00:00Z')});
 // Pause scheduled callbacks so only the expired-click handler is under test.
 await page.clock.pauseAt(new Date('2026-01-01T00:00:05Z'));await page.goto('');await page.getByRole('button',{name:'모의시험 시작하기',exact:true}).click();
 for(let section=0;section<3;section++){
  const s=await read(page);await page.clock.setSystemTime(s.exam.deadline+1000);
  await choices(page).first().click();
  if(section<2){await expect(page.getByRole('heading',{name:`${section+1}교시 제출 완료`})).toBeVisible();await page.getByRole('button',{name:'다음 교시 시작'}).click();}
 }
 await expect(page.getByRole('heading',{name:'모의시험 결과'})).toBeVisible();expect((await read(page)).results[0].answers).toEqual({});
});
