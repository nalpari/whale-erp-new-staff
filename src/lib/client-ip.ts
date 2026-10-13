import { isIP } from "node:net";

// 직원의 실제 접속 IP. api 는 로그인 · 갱신 · 비밀번호 재설정의 요청 제한을 IP 로도 세는데(api PR #10, TRUST_PROXY),
// 이 앱은 Next 서버가 api 를 대신 부르므로 api 가 보는 주소는 늘 Next 서버 하나다. 그래서 Next 가 실제 접속 IP 를
// X-Forwarded-For 에 직접 넣는다. 넣지 않으면 모든 직원이 한 버킷을 나눠 쓴다.
//
// Next 는 들어온 요청에 X-Forwarded-For 가 없을 때만 소켓 주소를 채우고, 있으면 그대로 둔다(base-server 의 ??=).
// 그래서 들어온 헤더를 그대로 넘기면 아무나 IP 를 지어낼 수 있다. Next 앞에서 이 헤더에 접속 주소를 덧붙이는
// 프록시(로드밸런서) 수 TRUSTED_PROXY_HOPS 만큼 오른쪽에서 센 항목 하나만 믿는다 — 그 왼쪽은 클라이언트가 지어낸 값일 수 있다.
//   0(기본): Next 가 바로 접속을 받는다. 로컬 개발용이다. Next 가 채운 소켓 주소를 쓰지만, 클라이언트가 헤더를 보내면
//            그 값이 남아 지어낼 수 있다. 코드상으로는 1 과 같이 맨 오른쪽 항목을 고른다.
//            운영(NODE_ENV=production)에서는 비었거나 0 이면 서버가 뜨지 않는다 — 요청마다 IP 를 바꿔 api 의 IP 축 요청 제한을 피할 수 있어서다.
//   1: 로드밸런서 하나(예: ALB 가 접속 주소를 덧붙임). 맨 오른쪽 항목.
//   N: 오른쪽에서 N 번째 항목.

/** clientIpFrom 이 고르고 확인한 IP. 들어온 헤더 값을 그대로 api 에 넘기지 못하게 타입으로 막는다. */
export type ClientIp = string & { readonly __brand: "ClientIp" };

/** 서버가 뜰 때(instrumentation register) 한 번 불러 잘못된 값이면 바로 멈추게 한다. */
export function trustedHops(): number {
  const raw = process.env.TRUSTED_PROXY_HOPS;
  const hops = raw ? Number(raw) : 0;
  if (!Number.isInteger(hops) || hops < 0) throw new Error(`TRUSTED_PROXY_HOPS 는 0 이상의 정수여야 합니다: ${raw}`);
  if (hops === 0 && process.env.NODE_ENV === "production") {
    throw new Error("운영에서는 TRUSTED_PROXY_HOPS 를 1 이상으로 정해야 합니다 — 0 이면 클라이언트가 X-Forwarded-For 로 IP 를 지어낼 수 있습니다");
  }
  return hops;
}

let warned = false;

/** 들어온 요청의 헤더에서 실제 접속 IP 를 고른다. 고를 수 없으면 undefined(api 는 Next 서버 주소로 센다). */
export function clientIpFrom(headers: Headers): ClientIp | undefined {
  const entries = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const configured = trustedHops();
  const hops = Math.max(configured, 1);
  // 믿는 프록시 수보다 항목이 적으면 그 프록시를 거치지 않은 요청이다. 아무것도 믿지 않는다.
  const candidate = entries.length >= hops ? entries[entries.length - hops] : undefined;
  // 프록시에 따라 포트(1.2.3.4:5678) · 대괄호([::1]:443)가 붙는다. 떼어 주소만 보내고, 주소가 아니면 버린다.
  const bare = candidate?.replace(/^\[(.+)\](?::\d+)?$/, "$1").replace(/^(\d+\.\d+\.\d+\.\d+):\d+$/, "$1");
  if (bare && isIP(bare)) return bare as ClientIp;
  // 운영(프록시 뒤)에서 고르지 못하면 모든 직원이 api 요청 제한 한 버킷을 나눠 쓴다. 설정이 인프라와 어긋났다는 신호라
  // 프로세스마다 한 번 남긴다(요청마다 남기면 로그가 넘친다).
  if (configured > 0 && !warned) {
    warned = true;
    console.warn("[client-ip] 접속 IP 를 고르지 못했습니다 — TRUSTED_PROXY_HOPS 와 프록시 구성을 확인하세요", {
      hops: configured,
      forwardedFor: headers.get("x-forwarded-for"),
    });
  }
  return undefined;
}
