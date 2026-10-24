# 검증 기록 — 2026-10-24

작업 디렉터리: `/workspace/Certified-Social-Worker-Grade1-CBT`.
초기 대상은 README 한 파일과 깨끗한 `work` 브랜치였다. 기존 AGENTS.md와 사용자 변경은 없었다. README의 원래 제목과 설명은 보존했다.

## 원본과 자료

- 읽기 전용 원본 main `76b990b8720adfa85c22a0a8f699b17094aa357b`, 스킬 v1.4.0, references 전체.
- 앱 기준 `b9a682ccff1b460334b78d5bfad9375b7ec4fbb6`과 최신 main의 src·package·lockfile diff가 없음을 확인했다.
- 원본의 기존 배포 성공 기록을 이 프로젝트의 배포 증거로 사용하지 않았다.
- 공식 Q-Net, 국가법령정보센터 요청은 모두 curl exit 56, `CONNECT tunnel failed, response 403`, HTTP 000. 원문을 읽지 못했다. 공식 규칙 확인·법령 현행성 확인은 **차단**.
- 문제 원고는 일반 지식 기반 AI 자체 작성 200개다. 내용·오답 선택지·설명 내부 검토와 정규화 중복 검사를 수행했다. 외부 근거 확인·전문가·독립 내용 검수는 **미완료**. 스키마 통과를 공식 검수로 해석하지 않는다.
- 8영역 각25, 기출0·복원0·자체200·수치변형0·기본 대기0. 검수 목표1,000 대비800 부족. 전체 출제기준 커버리지와 법령 세부 수치 문제는 확보하지 못했다.

## 로컬 검증

- `npm ci --cache /workspace/.npm-cache --no-audit --no-fund`: exit 0, lockfile 기반 110개 설치. TLS/무결성 검증을 끄지 않았다.
- `npm test`: 단위 **209개 통과**, exit 0. 은행200개 형식, 중복, 5개 보기, 연도·출처·권리 필드, 양식, 교시 분포, 답안 잠금, 시각 복원, 합격·과락 경계, 오답 재학습 등을 검사한다.
- `npm run build`: 타입 검사와 Vite 프로덕션 빌드 통과, exit 0. JS 단일 chunk 500kB 초과 경고 있음(데이터 포함); 빌드 실패는 아님.
- 브라우저: Playwright, 시스템 Chromium, Desktop Chrome 및 Pixel7 에뮬레이션. PC/모바일 스크린샷을 직접 열어 확인했다. 실제 Android/iOS 기기는 사용하지 않았다.
- 최초 브라우저 검사에서는 대화상자 기본 취소 버튼의 정상 Space 활성화를 오작동으로 기대한 테스트와 통계에 없는 총수 문구를 기대한 테스트가 실패했다. 네이티브 버튼 동작을 보존하고 대화상자 자체 포커스에서 글로벌 단축키를 검사하도록 수정했으며, 통계의 실제 점수·영역 지표로 검증했다.
- 후속 브라우저 검사 **21통과·1제외**(데스크톱의 터치 전용 케이스). 이어 마지막 교시의 타이머 콜백 전 만료 클릭 후 결과 화면 이동을 보강하고 전용 회귀 케이스를 추가했다. 최종 결과는 아래에 기록한다.
- 학습 기준 선택과 상단 상시 면책 배너 부재, 실전·랜덤 실제 keydown/keyup Space, 반복키/수정키/컨트롤/대화상자 보호, 포커스, 교시 마지막 자동 제출 금지, 답안 변경, 숨겨진 해설, 새로고침·만료 재접속·교시별 자동 제출, 결과·오답·북마크·통계, JSON/CSV·승인·검색·백업·초기화, 저장 손상 원본 보존·실패 경고를 검증했다.
- 메뉴 휠: 390×480 및740×360에서 실제 mouse.wheel 아래→백업 다운로드→위→대시보드 선택. DOM 존재나 scrollTop 설정으로 대체하지 않았다.
- 메뉴 터치: Pixel7 emulation에서 CDP touchStart/move/end로 같은 크기의 아래·위 스와이프. 글자를23px로 확대하고 하단 초기화 대화상자·상단 대시보드를 실제 tap했다. 휠과 별도 검사다. 실기기 스와이프 검증은 **미실행**.
- 합격 브라우저 테스트는 fixture로 답안을 미리 입력한 뒤 실제 교시 전환·제출·채점·해설을 검사한다. 200번 모두를 수동 클릭했다고 주장하지 않는다.
- iframe 통합·WebKit·Firefox·외부 전문가 검수·공식 시험 현행성·새 환경 복원은 **미실행/차단**이며 성공 범위에 포함하지 않는다.

## 배포 첫 차단 기록

사전 확인 첫 요청:
`GET https://api.github.com/repos/YunSangYeong/Certified-Social-Worker-Grade1-CBT`

- 안전한 presence 검사: GH_TOKEN present, GITHUB_TOKEN absent, OIC_MANIFEST_PATH present. 값을 읽거나 출력하지 않음.
- 실제 오류: curl exit56, `CONNECT tunnel failed, response 403`; 프록시 응답 `HTTP/1.1 403 Forbidden`, HTTP 목적지 응답000.
- 네트워크 CONNECT 단계이므로 GitHub의 실제 API 권한 거부라고 단정할 수 없다.
- 사용자의 첫 실패 중단 정책에 따라 API 확인 재시도·Pages 조회·main push·Actions 실행·재실행·다른 경로의 배포를 하지 않음.
- 기존 Pages 상태 **미확인**. 이 버전의 CI/배포는 **미실행**. 새 공개 화면 확인 **미실행**.
- 안전한 비배포 브랜치 코드 보존만 수행한다. main push→검증→Pages workflow는 준비되어 있지만 이 환경에서 실행됐다는 뜻은 아니다.
- 다음 최소 조치: 환경 인터넷 허용 목록에 api.github.com 추가. 그 뒤 사용자 직접 마무리. 설정 변경만으로 자동 재시도하지 않음.

## 최종 로컬 결과

- `npm run check`: exit0, 단위209통과 및 타입 검사·프로덕션 빌드 성공.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npx playwright test --reporter=line`: exit0, **23통과·1제외·0실패**, 35.2초. 제외1개는 데스크톱 프로젝트의 터치 전용 케이스이며 모바일에서는 실행·통과했다.
- 원고 JSON 및 JSON/CSV 양식을 재생성 전후 SHA256으로 비교하여 결정성 확인.
- Git diff 공백 검사 통과. 비밀 파일·node_modules·dist·개인 기록·테스트 산출물은 커밋에서 제외.
- 개발 서버 `npm run dev -- --port 5173 --strictPort` 기동과 내부 HTTP200·페이지 제목·Vite 진입점 확인 성공.
- 클라우드 환경 재사용용 install_script(npm ci·check), start_skill(기존 체크아웃·서비스 재시작·검증·배포 재시도 금지)을 설정 초안에 저장했다. 이는 GitHub Pages 배포나 환경 스냅샷 게시가 아니다.
