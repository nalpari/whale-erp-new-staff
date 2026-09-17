import type { ReactNode } from "react";
import {
  Alarm,
  Field,
  ItemRow,
  Plate,
  QuietButton,
  Readout,
  SAMPLE_ITEMS,
  StartButton,
} from "./units";

const COLORS = [
  ["panel", "bg-panel"],
  ["recess", "bg-recess"],
  ["seam", "bg-seam"],
  ["plate", "bg-plate"],
  ["plate-dim", "bg-plate-dim"],
  ["amber", "bg-amber"],
  ["amber-off", "bg-amber-off"],
  ["start", "bg-start"],
  ["alarm", "bg-alarm"],
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-seam py-10">
      <h2 className="mb-6 font-mono text-[0.72rem] uppercase tracking-[0.2em] text-plate-dim">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignUnitsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
      <h1 className="mb-10 font-sans text-2xl text-plate">기본 유닛</h1>

      <Section title="Color">
        <ul className="grid grid-cols-3 gap-4 sm:grid-cols-9">
          {COLORS.map(([name, bg]) => (
            <li key={name}>
              <div className={`h-14 border border-seam ${bg}`} />
              <span className="mt-2 block font-mono text-xs text-plate-dim">{name}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Type">
        <div className="space-y-4">
          <p className="font-sans text-[2.5rem] font-semibold leading-none tracking-[0.16em]">WHALE ERP</p>
          <p className="font-sans text-2xl">제목 · IBM Plex Sans KR</p>
          <p className="font-sans text-base text-plate-dim">본문 보조 텍스트</p>
          <p className="font-mono text-sm tracking-[0.08em]">WIRE-COIL-5T · IBM Plex Mono</p>
          <Plate>각인 캡스</Plate>
        </div>
      </Section>

      <Section title="Button">
        <div className="flex max-w-md flex-col gap-4">
          <StartButton>로그인</StartButton>
          <StartButton disabled>확인 중</StartButton>
          <QuietButton>로그아웃</QuietButton>
        </div>
      </Section>

      <Section title="Field">
        <div className="max-w-md space-y-7">
          <Field id="d-email" label="이메일" type="email" placeholder="admin@whale.test" />
          <Field id="d-password" label="비밀번호" type="password" />
        </div>
      </Section>

      <Section title="Readout">
        <div className="flex gap-12">
          <Readout value={99} />
          <Readout value={0} />
        </div>
      </Section>

      <Section title="Alarm">
        <Alarm>이메일 또는 비밀번호가 맞지 않습니다.</Alarm>
      </Section>

      <Section title="Item row">
        <ul>
          <ItemRow {...SAMPLE_ITEMS[0]} />
          <li className="border-t border-seam" />
        </ul>
      </Section>
    </main>
  );
}
