"""800 authored scenario applications: 8 domains × 5 concept sets × 20 cases.
Each set contains 5 concepts and FOUR materially different applications per concept.
Scenario families are disclosed; none are past papers or numeric variants.
The source text contains all options, conceptual rationales, and case conditions.
"""
from pathlib import Path
import json
from hashlib import sha256
ROOT = Path(__file__).resolve().parent

def build_supplement(subjects):
    bank=[]
    for si, subject in enumerate(subjects):
        raw=(ROOT/'manuscripts'/f'{si+1:02}.txt').read_text()
        blocks=raw.strip().split('\n\n')
        assert len(blocks)==5,(subject,len(blocks))
        ordinal=26
        for gi,block in enumerate(blocks):
            lines=block.strip().splitlines()
            terms=[v.split('~',1) for v in lines[0].split('|')]
            assert len(terms)==5 and all(len(v)==2 for v in terms)
            cases=[v.split('|',1) for v in lines[1:]]
            assert len(cases)==20
            for ai in range(1,6):
                assert sum(int(v[0])==ai for v in cases)==4,(si,gi,ai)
            for expected,case in cases:
                ai=int(expected)-1; concept,definition=terms[ai]
                assert len(case)>18 and len(definition)>15
                options=[v[0] for v in terms]
                question_id=f'SWG1-{si+1:02}-{ordinal:03}'
                options=sorted(options,key=lambda item:sha256(f'{question_id}|{item}'.encode()).digest())
                bank.append(dict(
                    id=f'SWG1-{si+1:02}-{ordinal:03}',subject=subject,topic=concept,
                    question=f'{case} 이 사례의 핵심을 가장 잘 설명하는 개념은?',
                    choices=options,answer=options.index(concept)+1,
                    explanation=f'사례의 판단 단서는 다음과 같습니다: {case} {concept}: {definition} 다른 보기는 같은 영역의 별도 개념이며, 이 문항의 명시된 작동 방식과 구별해야 합니다.',
                    difficulty='중',year=None,session=None,type='original',
                    sourceUrl='https://github.com/YunSangYeong/Certified-Social-Worker-Grade1-CBT/tree/codex/social-worker-cbt/scripts/manuscripts',
                    verificationStatus='reviewed',
                    reviewNote='AI 일반 지식 기반 자체 작성 사례 적용형. 개념군별 서로 다른 상황 4개를 명시적으로 묶음. 문항·정답·보기·해설의 내부 내용 및 중복 검토. 공식 출제기준·현행법 원문 대조 및 외부 전문가 검수 미완료. 원고 링크는 외부 정답 증빙이 아님.',
                    version='main',rights='자체 제작 원고: CC BY 4.0, 표시: Certified-Social-Worker-Grade1-CBT contributors. 기출 원문을 복제하지 않음.',
                    family=f'SWG1-SC-{si+1:02}-{gi+1:02}-{ai+1}',variantKind='scenario',
                ))
                ordinal+=1
        assert ordinal==126
    assert len(bank)==800
    return bank
