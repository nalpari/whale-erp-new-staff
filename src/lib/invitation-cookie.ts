import { cookies } from "next/headers";
import { clipChars, parseInvitationLookup, type InvitationLookup } from "./join";

// 확인을 마친 초대(WHALEERP-141 · 142). 초대 확인 → 계정 등록 사이에 들고 다니는 값이다 — 가입 요청에 다시 보내야 한다.
// 링크의 토큰과 초대 코드는 그 초대로 가입할 수 있는 열쇠라 주소 · 브라우저 저장소에 두지 않고 httpOnly 쿠키에 둔다
// (재설정 링크 password-reset-link.ts 와 같은 방식). 링크(`/invite#token=…`)로 들어와도 /join 아래 화면으로 옮겨 가므로
// 쿠키는 /join 에만 보낸다.

const INVITATION_COOKIE = "invitation";
const INVITATION_PATH = "/join";
/** 가입 화면을 채우는 동안만 이어 준다. 초대의 기한(30일)은 api 가 판정한다. */
const COOKIE_SECONDS = 30 * 60;

const cookieOptions = (maxAge: number, path = INVITATION_PATH) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path,
  maxAge,
});

export async function readInvitation(): Promise<InvitationLookup | null> {
  return parseInvitationLookup((await cookies()).get(INVITATION_COOKIE)?.value);
}

/** 서버 액션에서만 부른다. */
export async function saveInvitation(lookup: InvitationLookup): Promise<void> {
  (await cookies()).set(INVITATION_COOKIE, JSON.stringify(lookup), cookieOptions(COOKIE_SECONDS));
}

/** 서버 액션에서만 부른다. 구운 쿠키와 같은 path 를 줘야 지워진다. */
export async function clearInvitation(): Promise<void> {
  (await cookies()).delete({ name: INVITATION_COOKIE, ...cookieOptions(0) });
}

// 가입 완료 화면(가이드 ④)이 보일 근무지 이름. 가입하면 초대가 수락돼 다시 확인할 수 없고, 소속 목록(/me/memberships)은 계약을
// 맺은 뒤에야 나온다. 그래서 가입을 마친 액션이 계정 등록 화면에서 보던 이름을 잠깐 넘긴다. 주소에 실으면 남이 만든 링크로 아무
// 이름이나 보이게 할 수 있어 쿠키에 둔다. 근무지 추가 완료 화면(WHALEERP-604)도 같은 까닭으로 쓴다 — path 로 그 완료 화면에만 보낸다.
const JOINED_STORE_COOKIE = "joined_store";
const JOINED_STORE_SECONDS = 10 * 60;
const JOINED_STORE_MAX = 100;

/** 서버 액션에서만 부른다. donePath 는 이름을 보일 완료 화면이다. */
export async function saveJoinedStore(storeName: string, donePath = "/join/done"): Promise<void> {
  (await cookies()).set(JOINED_STORE_COOKIE, clipChars(storeName, JOINED_STORE_MAX), cookieOptions(JOINED_STORE_SECONDS, donePath));
}

export async function readJoinedStore(): Promise<string | null> {
  return (await cookies()).get(JOINED_STORE_COOKIE)?.value || null;
}

// 소속 추가 완료 화면(/affiliations/done, WHALEERP-144)이 보일 점포 이름. 수락하면 요청이 목록에서 빠져 다시 읽을 수 없고, 주소에
// 실으면 남이 만든 링크로 가짜 「○○ 소속이 추가되었습니다」를 보일 수 있어 가입 완료와 같이 수락한 액션이 잠깐 쿠키로 넘긴다.
const ACCEPTED_STORE_COOKIE = "accepted_store";

/** 서버 액션에서만 부른다. */
export async function saveAcceptedStore(storeName: string): Promise<void> {
  (await cookies()).set(ACCEPTED_STORE_COOKIE, clipChars(storeName, JOINED_STORE_MAX), cookieOptions(JOINED_STORE_SECONDS, "/affiliations/done"));
}

export async function readAcceptedStore(): Promise<string | null> {
  return (await cookies()).get(ACCEPTED_STORE_COOKIE)?.value || null;
}
