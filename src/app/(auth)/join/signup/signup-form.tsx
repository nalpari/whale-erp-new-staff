"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Alert, Button, CheckBox, Notice, SectionTitle, SegmentedControl, TextField } from "@/components/common";
import { FIELD } from "@/components/common/theme";
import { AddressSearchSheet } from "@/app/_components/address-search-sheet";
import { NewPasswordFields } from "@/app/_components/new-password-fields";
import { ReadOnlyField } from "@/app/_components/read-only-field";
import { formatPhone, type SignupField } from "@/lib/join";
import { ADDRESS_DETAIL_MAX } from "@/lib/profile";
import { AuthScreen } from "../../_components/auth-screen";
import { signupAction, type SignupState } from "../actions";
import {
  AccountExists,
  CodeLocked,
  EndedInvitation,
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

  if (state.step === "ended") return <EndedInvitation />;
  if (state.step === "joined") return <JoinedInvitation />;
  if (state.step === "has-account") return <AccountExists />;
  if (state.step === "under-age") return <UnderAge />;
  if (state.step === "expired") return <InvitationExpired />;
  if (state.step === "locked") return <CodeLocked lock={state} />;

  const failed = state.step === "input" ? state : null;
  const errorOf = (field: SignupField) => (failed?.field === field ? failed.error : undefined);
  return (
    <form action={formAction} className="flex flex-1 flex-col">
      {/* 가입 완료 화면이 보일 근무지 이름(actions.ts saveJoinedStore). */}
      <input type="hidden" name="storeName" value={storeName} />
      <input type="hidden" name="gender" value={gender} />
      <input type="hidden" name="isForeigner" value={foreigner} />
      <input type="hidden" name="zipCode" value={picked.zipCode} />
      <input type="hidden" name="address" value={picked.address} />
      <AuthScreen
        eyebrow={<JoinSteps via={via} step="계정 등록" />}
        title="계정을 등록해 주세요"
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
            maxLength={50}
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errorOf("name")}
          />
          <ReadOnlyField
            label="휴대전화번호"
            value={formatPhone(phone)}
            help={`${
              via === "code" ? "초대 코드 확인으로 확정된 번호" : "이 초대(근로계약서)에 적힌 번호"
            }라 고칠 수 없습니다. 번호가 틀렸으면 근무지 관리자에게 알려 주세요. 관리자가 근로계약서의 번호를 고쳐 다시 초대합니다.`}
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
            help="8자리로 넣어 주세요. 가입한 뒤에는 고칠 수 없습니다."
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          help="로그인할 때 쓰는 아이디입니다. 비밀번호를 잊으면 이 주소로 인증번호가 갑니다."
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
          <p className={`pt-[2px] text-[12px] ${errorOf("address") ? "text-staff-error" : "text-staff-text-muted"}`}>
            {errorOf("address") ?? "도로명 주소는 검색해서 고르고 상세 주소만 직접 적습니다."}
          </p>
        </div>

        {asksHqSharingConsent && (
          <div className="flex flex-col gap-[4px]">
            <CheckBox name="hqSharingConsented" checked={hqSharing} onChange={setHqSharing}>
              본사 제공 동의 (선택)
            </CheckBox>
            <p className="text-[12px] text-staff-text-muted">
              가맹본부가 내 근무 정보(근로계약 · 근무스케줄 · 출퇴근 기록 · 급여명세서)를 개인 단위로 보는 것에 동의합니다. 동의하지
              않아도 가입과 근무는 그대로이고, 본사에는 점포별 숫자로만 보입니다. 내 정보에서 언제든 철회할 수 있습니다.
            </p>
          </div>
        )}

        {failed?.field === "form" ? (
          <Alert tone="danger">{failed.error}</Alert>
        ) : (
          <Notice>이름 · 생년월일 · 성별 · 외국인 여부가 근로계약서와 다르면 날인하기 전에 근무지에 고쳐 달라고 요청하게 됩니다.</Notice>
        )}
      </AuthScreen>
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
