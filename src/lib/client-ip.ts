import { isIP } from "node:net";

// 직원의 실제 접속 IP. api 는 로그인 · 갱신 · 비밀번호 재설정의 요청 제한을 IP 로도 세는데(api PR #10, TRUST_PROXY),
// 이 앱은 Next 서버가 api 를 대신 부르므로 api 가 보는 주소는 늘 Next 서버 하나다. 그래서 Next 가 실제 접속 IP 를
// X-Forwarded-For 에 직접 넣는다. 넣지 않으면 모든 직원이 한 버킷을 나눠 쓴다.
//
// Next 는 들어온 요청에 X-Forwarded-For 가 없을 때만 소켓 주소를 채우고, 있으면 그대로 둔다(base-server 의 ??=).
// 그래서 들어온 헤더를 그대로 넘기면 아무나 IP 를 지어낼 수 있다. Next 앞에서 이 헤더에 접속 주소를 덧붙이는
// 프록시(로드밸런서) 수 TRUSTED_PROXY_HOPS 만큼 오른쪽에서 센 항목 하나만 믿는다 — 그 왼쪽은 클라이언트가 지어낸 값일 수 있다.
//   0(기본): Next 가 바로 접속을 받는다. 로컬 개발용이다. Next 가 채운 소켓 주소를 쓰지만, 클라이언트가 헤더를 보내면
//            그 값이 남아 지어낼 수 있다. 운영에서 0 으로 두지 않는다.
//   1: 로드밸런서 하나(예: ALB 가 접속 주소를 덧붙임). 맨 오른쪽 항목.
//   N: 오른쪽에서 N 번째 항목.

function trustedHops(): number {
  const raw = process.env.TRUSTED_PROXY_HOPS;
  if (!raw) return 0;
  const hops = Number(raw);
  if (!Number.isInteger(hops) || hops < 0) throw new Error(`TRUSTED_PROXY_HOPS 는 0 이상의 정수여야 합니다: ${raw}`);
  return hops;
}

/** 들어온 요청의 헤더에서 실제 접속 IP 를 고른다. 고를 수 없으면 undefined(api 는 Next 서버 주소로 센다). */
export function clientIpFrom(headers: Headers): string | undefined {
  const entries = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const hops = Math.max(trustedHops(), 1);
  // 믿는 프록시 수보다 항목이 적으면 그 프록시를 거치지 않은 요청이다. 아무것도 믿지 않는다.
  const candidate = entries.length >= hops ? entries[entries.length - hops] : undefined;
  if (!candidate) return undefined;
  // 프록시에 따라 포트(1.2.3.4:5678) · 대괄호([::1]:443)가 붙는다. 떼어 주소만 보내고, 주소가 아니면 버린다.
  const bare = candidate.replace(/^\[(.+)\](?::\d+)?$/, "$1").replace(/^(\d+\.\d+\.\d+\.\d+):\d+$/, "$1");
  return isIP(bare) ? bare : undefined;
}
