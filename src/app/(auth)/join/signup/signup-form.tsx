"use client";

import { useActionState, useRef, useState, type ReactNode } from "react";
import { Alert, BottomSheet, Button, Notice, SectionTitle, SegmentedControl, TextField } from "@/components/common";
import { FIELD } from "@/components/common/theme";
import { AddressSearchSheet } from "@/app/_components/address-search-sheet";
import { NewPasswordFields } from "@/app/_components/new-password-fields";
import { ReadOnlyField } from "@/app/_components/read-only-field";
import { normalizeBirthDate } from "@/lib/email-find";
import { SIGNUP_NAME_MAX, formatPhone, kstToday, needsBirthDateCheck, type SignupField } from "@/lib/join";
import { ADDRESS_DETAIL_MAX, dateLabel } from "@/lib/profile";
import { AuthScreen } from "../../_components/auth-screen";
import { signupAction, type SignupState } from "../actions";
import {
  AccountExists,
  CodeLocked,
  EndedInvitation,
  HqSharingConsent,
  InvitationExpired,
  JoinSteps,
  JoinedInvitation,
  UnderAge,
  type JoinVia,
} from "../screens";

// 기준: 목업 join 의 signup · signup-link · minor (가이드 ③, 운영 정책 ACC-23 · JOIN-7).
// 휴대전화번호는 초대의 번호를 읽기 전용으로 보인다 — api 는 가입 요청의 번호를 받지 않고 초대에서 가져온다.
// 약관 동의 칸은 아직 없다. api 가 받지 않고, 1팀 공통 약관 등록이 생기면 더한다(2026-10-20).
// 칸은 상태로 든다 — React 19 폼 액션은 제출 뒤 칸을 비우는데, 실패하면 넣은 값을 그대로 두고 고치게 한다(비밀번호 확인 칸만 비운다).

const FOREIGNER = [
  { value: "false", label: "내국인" },
  { value: "true", label: "외국인" },
];

export function SignupForm({
  via,
  storeName,
  phone,
  asksHqSharingConsent,
  genders,
}: {
  via: JoinVia;
  storeName: string;
  phone: string;
  /** 본사 제공 동의를 물을지 — 직영이 아닌 점포이고 아직 동의하지 않았다(ATT-30). */
  asksHqSharingConsent: boolean;
  genders: { value: string; label: string }[];
}) {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(signupAction, { step: "input" });
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [foreigner, setForeigner] = useState("false");
  const [email, setEmail] = useState("");
  const [picked, setPicked] = useState({ zipCode: "", address: "" });
  const [detail, setDetail] = useState("");
  const [hqSharing, setHqSharing] = useState(false);
  const [searching, setSearching] = useState(false);
  // 만 19세 미만으로 보이는 생년월일은 보내기 전에 한 번 더 확인받는다(needsBirthDateCheck). 확인한 값은 다시 묻지 않는다.
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedBirthDate = useRef<string | null>(null);
  const [birthCheck, setBirthCheck] = useState({ open: false, birthDate: "" });

  if (state.step === "ended") return <EndedInvitation />;
  if (state.step === "joined") return <JoinedInvitation />;
  if (state.step === "has-account") return <AccountExists />;
  if (state.step === "under-age") return <UnderAge />;
  if (state.step === "expired") return <InvitationExpired />;
  if (state.step === "locked") return <CodeLocked lock={state} />;

  const failed = state.step === "input" ? state : null;
  const errorOf = (field: SignupField) => (failed?.field === field ? failed.error : undefined);
  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(event) => {
        const value = normalizeBirthDate(birthDate);
        if (value === confirmedBirthDate.current || !needsBirthDateCheck(value, kstToday())) return;
        event.preventDefault();
        setBirthCheck({ open: true, birthDate: value });
      }}
      className="flex flex-1 flex-col"
    >
      {/* 가입 완료 화면이 보일 근무지 이름(actions.ts saveJoinedStore). */}
      <input type="hidden" name="storeName" value={storeName} />
      <input type="hidden" name="gender" value={gender} />
      <input type="hidden" name="isForeigner" value={foreigner} />
      <input type="hidden" name="zipCode" value={picked.zipCode} />
      <input type="hidden" name="address" value={picked.address} />
      <AuthScreen
        eyebrow={<JoinSteps via={via} step="계정 등록" />}
        title="계정 등록"
        description={
          <>
            <strong>{storeName}</strong> 근무를 위한 계정입니다.
          </>
        }
        dock={
          <Button type="submit" disabled={pending}>
            가입하기
          </Button>
        }
      >
        <SectionTitle title="인적사항" />
        <div className="flex flex-col gap-[16px]">
          <TextField
            label="이름"
            name="name"
            autoComplete="name"
            required
            maxLength={SIGNUP_NAME_MAX}
            placeholder="이름을 입력해 주세요"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errorOf("name")}
          />
          <ReadOnlyField
            label="휴대전화번호"
            value={formatPhone(phone)}
            help="번호 변경이 필요하면 근무지 관리자에게 문의해 주세요."
          />
          <TextField
            label="생년월일"
            name="birthDate"
            inputMode="numeric"
            autoComplete="bday"
            required
            maxLength={10}
            placeholder="YYYYMMDD"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            help="가입 후에는 변경할 수 없으니 정확히 입력해 주세요."
            error={errorOf("birthDate")}
          />
          <Choice label="성별" error={errorOf("gender")}>
            <SegmentedControl label="성별" items={genders} value={gender} onChange={setGender} />
          </Choice>
          <Choice label="외국인 여부">
            <SegmentedControl label="외국인 여부" items={FOREIGNER} value={foreigner} onChange={setForeigner} />
          </Choice>
        </div>

        <SectionTitle title="로그인 정보" />
        <TextField
          label="이메일"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="이메일을 입력해 주세요"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          help="로그인 아이디로 사용됩니다."
          error={errorOf("email")}
        />
        <NewPasswordFields
          email={email}
          labels={["비밀번호", "비밀번호 확인"]}
          newPasswordError={errorOf("newPassword")}
          confirmationError={errorOf("newPasswordConfirmation")}
        />

        <SectionTitle title="주소" />
        <div className="flex flex-col gap-[8px]">
          <ReadOnlyField
            label="주소"
            value={picked.address ? `(${picked.zipCode}) ${picked.address}` : ""}
            wrap
            action={
              <Button variant="outline" onClick={() => setSearching(true)}>
                검색
              </Button>
            }
          />
          <input
            name="addressDetail"
            aria-label="상세 주소"
            placeholder="상세 주소"
            autoComplete="address-line2"
            maxLength={ADDRESS_DETAIL_MAX}
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            className={FIELD}
          />
          {errorOf("address") && <p className="pt-[2px] text-[12px] text-staff-error">{errorOf("address")}</p>}
        </div>

        {asksHqSharingConsent && <HqSharingConsent checked={hqSharing} onChange={setHqSharing} flow="signup" />}

        {failed?.field === "form" ? (
          <Alert tone="danger">{failed.error}</Alert>
        ) : (
          <Notice>이름 · 생년월일 · 성별 · 외국인 여부가 근로계약서와 다르면 서명하기 전에 근무지에 고쳐 달라고 요청하게 됩니다.</Notice>
        )}
      </AuthScreen>
      <BottomSheet
        open={birthCheck.open}
        onClose={() => setBirthCheck((check) => ({ ...check, open: false }))}
        title={`생년월일이 ${birthCheck.birthDate && dateLabel(birthCheck.birthDate)} 맞습니까?`}
        description="만 19세 미만은 가입할 수 없고, 이 초대도 다시 쓸 수 없게 됩니다. 잘못 입력했다면 고친 뒤 다시 가입해 주세요."
        closeLabel="고치기"
      >
        <Button
          onClick={() => {
            confirmedBirthDate.current = birthCheck.birthDate;
            setBirthCheck((check) => ({ ...check, open: false }));
            formRef.current?.requestSubmit();
          }}
        >
          맞습니다
        </Button>
      </BottomSheet>
      <AddressSearchSheet
        open={searching}
        onClose={() => setSearching(false)}
        onPick={(found) => {
          setPicked(found);
          setSearching(false);
        }}
      />
    </form>
  );
}

/** 고르는 칸(성별 · 외국인 여부)의 이름과 오류. 입력칸(TextField)과 같은 이름 글자 · 오류 글자다. */
function Choice({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <p className="text-[13px] font-semibold text-staff-text-sub">{label}</p>
      {children}
      {error && <p className="text-[12px] text-staff-error">{error}</p>}
    </div>
  );
}
