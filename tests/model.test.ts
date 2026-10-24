import { describe, expect, it } from 'vitest';
import { BASE_BANK, SUBJECTS, validateQuestion, fingerprint, createExam, grade, emptyStore, answerExam, submitExam, resumeSection, restoreStore, startPractice, checkPractice, nextPractice, importQuestions, parseCsv, remainingSeconds } from '../src/model';
import { PROFILE } from '../src/profile';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
describe('원고와 실제 은행', () => {
 it('목표1000개를 첫 완료 기준으로 검사, 8영역마다125개, 중복 없음', () => {
  expect(BASE_BANK).toHaveLength(1000);
  expect(new Set(BASE_BANK.map(q=>q.id)).size).toBe(1000);
  expect(new Set(BASE_BANK.map(fingerprint)).size).toBe(1000);
  SUBJECTS.forEach(s=>expect(BASE_BANK.filter(q=>q.subject===s)).toHaveLength(125));
 });
 for (const q of BASE_BANK) it(`5지선다/출처/권리/정답/미확인 연도 검사 ${q.id}`,()=>{
  expect(validateQuestion(q)).toEqual(q);expect(q.type).toBe('original');
  expect(q.year).toBeNull();expect(q.session).toBeNull();
  if (q.variantKind === 'scenario') expect(q.family).toMatch(/^SWG1-SC-/);
  else expect(q.family).toBeUndefined();
  expect(q.explanation.length).toBeGreaterThan(35);expect(q.reviewNote).toContain('미완료');
  expect(q.choices[q.answer-1]).toBeTruthy();
 });
 it('기존200개 ID·문항·보기·정답·해설·메타데이터를 모두 보존',()=>{
  expect(createHash('sha256').update(JSON.stringify(BASE_BANK.slice(0,200))).digest('hex')).toBe('9d68685b8df396bcd164ee0dfa63dc6cd09b8b78d90716196ca16397bde4cfdd');
 });
 it('사례형800개를 200개 개념군×4로 공개하고 숫자변형과 구별',()=>{
  const extra=BASE_BANK.filter(q=>q.variantKind==='scenario');expect(extra).toHaveLength(800);
  const families=new Set(extra.map(q=>q.family));expect(families.size).toBe(200);
  for(const family of families){
   const rows=extra.filter(q=>q.family===family);expect(rows).toHaveLength(4);
   expect(new Set(rows.map(q=>q.question)).size).toBe(4);
   expect(new Set(rows.map(q=>q.choices[q.answer-1])).size).toBe(1);
   expect(rows.every(q=>q.calculation===undefined)).toBe(true);
  }
  expect(BASE_BANK.filter(q=>q.type!=='original')).toHaveLength(0);
 });
 it('각 영역의 정답 위치가 다섯 보기에 분산되고 한 번호에 과도하게 몰리지 않음',()=>{
  for(const subject of SUBJECTS){
   const rows=BASE_BANK.filter(q=>q.subject===subject);
   for(let answer=1;answer<=5;answer++){
    const count=rows.filter(q=>q.answer===answer).length;
    expect(count).toBeGreaterThanOrEqual(10);expect(count).toBeLessThanOrEqual(40);
   }
  }
 });
 it('한 시험에서 동일 개념군 사례를 중복 출제하지 않음',()=>{
  const exam=createExam(BASE_BANK,'main');const families=exam.questions.filter(q=>q.family).map(q=>q.family);
  expect(new Set(families).size).toBe(families.length);
  SUBJECTS.forEach(s=>expect(exam.questions.filter(q=>q.subject===s)).toHaveLength(25));
 });
 it('JSON과 CSV 양식이 모두 등록되며 기본 은행과의 본문 중복은 제외',()=>{
  for(const path of ['json','csv']){
   const raw=readFileSync(`public/templates/questions.${path}`,'utf8');
   const values=path==='json'?JSON.parse(raw):parseCsv(raw);
   expect(importQuestions(values,[]).added[0].verificationStatus).toBe('pending');
   expect(importQuestions(values,BASE_BANK).duplicates).toBe(1);
  }
 });
 it('보기 순서가 달라도 정규화 중복 제외; 오류 파일은 원자적으로 거절',()=>{
  const q={...BASE_BANK[0],id:'NEW',choices:[...BASE_BANK[0].choices].reverse()};
  expect(importQuestions([q],BASE_BANK).duplicates).toBe(1);
  expect(()=>importQuestions([q,{...q,id:'broken',answer:6}],[])).toThrow();
 });
});
describe('교시·저장·채점',()=>{
 it('순서가 교시 경계를 지키며 200개 비중복, 교시별 50·75·75분',()=>{
  const e=createExam(BASE_BANK,'main',1000);expect(e.questions).toHaveLength(200);
  PROFILE.sections.forEach(s=>expect(e.questions.slice(s.start,s.end).every(q=>s.domains.some(i=>SUBJECTS[i]===q.subject))).toBe(true));
  let state: ReturnType<typeof emptyStore>={...emptyStore(),exam:e};expect(e.deadline).toBe(3001000);
  const id=e.questions[0].id;state=answerExam(state,id,5,1001);expect(state.exam!.answers[id]).toBe(5);
  state=submitExam(state,2000);expect(state.exam!.paused).toBe(true);
  expect(answerExam(state,id,1,2001)).toBe(state);
  expect(submitExam(state,2001)).toBe(state);
  state=resumeSection(state,10000);expect(state.exam!.section).toBe(1);expect(state.exam!.deadline).toBe(4510000);
  expect(answerExam(state,id,1,10001)).toBe(state);
  state=submitExam(state,11000);state=resumeSection(state,20000);expect(state.exam!.section).toBe(2);
  state=submitExam(state,21000);expect(state.exam).toBeNull();expect(state.results).toHaveLength(1);
  expect(submitExam(state,22000)).toBe(state);expect(restoreStore(JSON.stringify(state))).toEqual(state);
 });
 it('만료 후 답안 잠금과 교시 제출, 새로고침 절대시각 유지',()=>{
  const e=createExam(BASE_BANK,'main',1000);const s={...emptyStore(),exam:e};
  const restored=restoreStore(JSON.stringify(s));expect(restored.exam!.deadline).toBe(e.deadline);
  const after=answerExam(s,e.questions[0].id,1,e.deadline);expect(after.exam!.paused).toBe(true);
  expect(after.exam!.answers).toEqual({});expect(remainingSeconds(e.deadline,e.deadline+1)).toBe(0);
 });
 function scored(counts:number[]){const e=createExam(BASE_BANK,'main',1000);PROFILE.sections.forEach((s,i)=>e.questions.slice(s.start,s.end).slice(0,counts[i]).forEach(q=>e.answers[q.id]=q.answer));return grade(e);}
 it('총120/200과 과목별20/50·30/75·30/75 경계',()=>{
  expect(scored([20,50,50]).passed).toBe(true);
  expect(scored([19,51,50]).passed).toBe(false);
  expect(scored([40,29,51]).passed).toBe(false);
  expect(scored([40,51,29]).passed).toBe(false);
  expect(scored([40,40,39]).passed).toBe(false);
  expect(scored([40,40,40]).passed).toBe(true);
 });
 it('단일 영역의 40% 미만은 3개 시험과목 과락과 혼동하지 않음',()=>{
  const e=createExam(BASE_BANK,'main');e.questions.slice(25).forEach(q=>e.answers[q.id]=q.answer);
  expect(grade(e).passed).toBe(true);expect(grade(e).sections[0].rate).toBe(50);
 });
 it('손상된 저장 자료를 정상으로 취급하지 않음',()=>{
  expect(()=>restoreStore('{')).toThrow();const e=createExam(BASE_BANK,'main');e.deadline++;
  expect(()=>restoreStore(JSON.stringify({...emptyStore(),exam:e}))).toThrow();
 });
 it('랜덤 즉시 채점 한 번, 오답 해제와 한 순회 중복 방지',()=>{
  let s=emptyStore();s.practice=startPractice(BASE_BANK,'main');const q=BASE_BANK.find(q=>q.id===s.practice!.currentId)!;
  s.wrongIds=[q.id];s.practice.selected=q.answer;s=checkPractice(s,BASE_BANK);expect(s.wrongIds).toEqual([]);
  expect(checkPractice(s,BASE_BANK)).toBe(s);expect(s.attempts).toHaveLength(1);
  const next=nextPractice(s.practice!,BASE_BANK);expect(next.currentId).not.toBe(q.id);expect(next.seen).toContain(q.id);
 });
});
