// Official endpoints were blocked (proxy 403). These commonly published rules
// remain pending primary-source confirmation; see docs/verification.md.
export const PROFILE = {
  name: '사회복지사 1급', bankId: 'main', questionCount: 200,
  bankTarget: 1000, choiceCount: 5, durationMinutes: 200, passRate: 0.6, cutoffRate: 0.4,
  perDomain: 25, rulesStatus: 'pending-primary-source-confirmation',
  domains: ['인간행동과 사회환경', '사회복지조사론', '사회복지실천론', '사회복지실천기술론', '지역사회복지론', '사회복지정책론', '사회복지행정론', '사회복지법제론'] as const,
  sections: [
    { name: '사회복지기초', domains: [0, 1], start: 0, end: 50, minutes: 50 },
    { name: '사회복지실천', domains: [2, 3, 4], start: 50, end: 125, minutes: 75 },
    { name: '사회복지정책과 제도', domains: [5, 6, 7], start: 125, end: 200, minutes: 75 },
  ],
} as const;
