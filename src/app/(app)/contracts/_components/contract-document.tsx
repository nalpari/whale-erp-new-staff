import type { ReactNode } from "react";
import { labelOf, type EnumValue } from "@/lib/enums";
import {
  hoursText,
  insuredText,
  monthlyHourRows,
  payDayText,
  probationText,
  weekdayRows,
  weeklyHours,
  wonText,
} from "@/lib/contract-rules";
import type { ContractDetail } from "@/lib/contracts";
import { dateLabel } from "@/lib/profile";
import { Values } from "./parts";

export type DocumentEnums = { employmentTypes: EnumValue[]; weekdays: EnumValue[]; payMonths: EnumValue[]; payMethods: EnumValue[] };

// 전자계약 계약서 본문(CON-1 · WHALEERP-146). 계약서를 앱 글꼴로 화면에 직접 그린다 — 조항 열 가지, 정직원 · 파트타이머가 같은 구성이고
// 값만 다르다(데모 contract 의 contractDocument). 조항 문장 템플릿은 api 에 아직 없어(노무사 검토 전, api WHALEERP-131) 값만 받아
// 여기서 문장으로 잇는다. 연차휴가 · 퇴직금 문구는 관리자가 작성 화면에서 고친 값(annualLeaveTerms · severancePayTerms)이다.
// 소정근로시간은 요일별 표다(CTR-21). 종이 계약(CTR-23)은 이 본문을 그리지 않는다.
export function ContractDocument({ c, enums }: { c: ContractDetail; enums: DocumentEnums }) {
  const weekday = (w: string) => labelOf(enums.weekdays, w);
  const hasHoliday = c.weeklyHoliday !== null;
  const allowances: [string, number | null][] = [
    ["식대", c.mealAllowanceAmount],
    ["자가운전보조금", c.carAllowanceAmount],
    ["육아수당", c.childcareAllowanceAmount],
  ];

  return (
    <section aria-label="계약서 본문" className="rounded-[16px] border border-staff-border-light bg-white p-[16px]">
      <h2 className="text-[13px] font-semibold text-staff-text-sub">
        근로계약서{c.employmentType && ` · ${labelOf(enums.employmentTypes, c.employmentType)}`}
      </h2>
      <div className="flex flex-col gap-[10px] pt-[8px] text-[14px] leading-[1.85]">
        <Article title="제1조(근로계약기간)">
          {!c.startDate
            ? "-"
            : c.endDate
              ? `${dateLabel(c.startDate)}부터 ${dateLabel(c.endDate)}까지로 한다.`
              : `${dateLabel(c.startDate)}부터 기간의 정함이 없는 것으로 한다.`}
        </Article>

        <Article title="제2조(근무장소와 업무)">
          {c.workLocation ?? c.employer.storeName}에서 {c.worker.jobTitle} 업무를 한다.
        </Article>

        <Article title="제3조(소정근로시간)" body={c.workDays.length > 0 ? "요일별 근로시간은 아래와 같다." : "근무 요일이 정해지지 않았다."}>
          {c.workDays.length > 0 && (
            <>
              <table className="w-full border-collapse text-[13px] leading-[1.5]">
                <caption className="sr-only">요일별 소정근로시간</caption>
                <thead>
                  <tr className="border-b border-staff-border-light text-staff-text-muted">
                    {["요일", "시업", "종업", "휴게"].map((h) => (
                      <th key={h} scope="col" className="py-[4px] text-left font-medium">
                        {h}
                      </th>
                    ))}
                    <th scope="col" className="py-[4px] text-right font-medium">
                      근로
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {weekdayRows(c.workDays, c.weeklyHoliday).map((r) => (
                    <tr key={r.weekday} className={r.off ? "text-staff-text-muted" : undefined}>
                      <th scope="row" className="py-[5px] text-left font-normal">
                        {weekday(r.weekday)}
                      </th>
                      <td className="py-[5px] tabular-nums">{r.start}</td>
                      <td className="py-[5px] tabular-nums">{r.end}</td>
                      <td className="py-[5px] tabular-nums">{r.rest}</td>
                      <td className="py-[5px] text-right tabular-nums">{r.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Values rows={[["주 소정근로시간", hoursText(weeklyHours(c.workDays))], ...monthlyHourRows(c)]} />
              <p>세부 근무일정은 근무스케줄로 정한다.</p>
            </>
          )}
        </Article>

        <Article title="제4조(휴일)">
          {hasHoliday
            ? `주휴일은 매주 ${weekday(c.weeklyHoliday!)}요일로 한다.`
            : "1주 소정근로시간이 15시간 미만이라 주휴일을 두지 않는다."}
        </Article>

        <Article title="제5조(임금)" body="임금은 아래와 같이 지급한다.">
          <Values
            rows={[
              ["시급", c.wageAmount === null ? null : wonText(c.wageAmount)],
              ...allowances.map(([label, v]): [string, string | null] => [label, v ? `월 ${wonText(v)}` : null]),
              ["지급일", payDayText(c.payMonth && labelOf(enums.payMonths, c.payMonth), c.payDay)],
              ["지급 방법", c.payMethod && labelOf(enums.payMethods, c.payMethod)],
              ["수습", probationText(c.probationMonths, c.probationWageReductionRate, c.wageAmount)],
            ]}
          />
          {hasHoliday && <p>1주 소정근로시간이 15시간 이상이고 그 주 소정근로일을 개근하면 주휴수당을 지급한다.</p>}
        </Article>

        <Article title="제6조(연장·야간·휴일 가산)">연장·야간·휴일근로에 대해서는 근로기준법에서 정한 바에 따라 가산하여 지급한다.</Article>

        <Article title="제7조(연차유급휴가)">{c.annualLeaveTerms ?? "근로기준법에서 정한 바에 따라 연차유급휴가를 준다."}</Article>

        <Article title="제8조(사회보험)" body="사회보험 가입은 다음과 같다.">
          <Values
            rows={[
              ["국민연금 · 건강보험", insuredText(c.isHealthPensionInsured)],
              ["고용보험 · 산재보험", insuredText(c.isEmploymentInjuryInsured)],
            ]}
          />
        </Article>

        <Article title="제9조(계약서 교부)">
          {/* 데모 원문의 뒷문장 「근로자는 직원 근무 앱에서 처리 완료본을 내려받을 수 있다」를 받기(149)와 함께 되살렸다. 처리 완료본은
              체결 뒤 파일 생성(WHALEERP-131)이 만들어야 생기므로 언제부터인지를 적어 거짓이 되지 않게 했다. */}
          사용자는 계약을 체결하면 곧바로 계약서를 근로자에게 교부한다. 근로자는 처리 완료본이 만들어지면 직원 근무 앱에서 내려받을 수
          있다.
        </Article>

        {/* 퇴직금 문구는 데모 본문에 자리가 없어 기타에 둔다(조항 템플릿이 정해지면 옮긴다). */}
        <Article title="제10조(기타)">
          {c.severancePayTerms && `퇴직금 — ${c.severancePayTerms.replace(/\.$/, "")}. `}이 계약에 정하지 않은 사항은 근로기준법령에 따른다.
        </Article>
      </div>
    </section>
  );
}

/** 조항 하나. 짧은 조항은 제목 뒤에 문장을 잇고(children), 표 · 값 줄이 붙는 조항은 body 문장 아래에 children 을 둔다. */
function Article({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  if (body === undefined) {
    return (
      <p>
        <strong className="font-bold">{title}</strong> {children}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-[6px]">
      <p>
        <strong className="font-bold">{title}</strong> {body}
      </p>
      {children}
    </div>
  );
}
