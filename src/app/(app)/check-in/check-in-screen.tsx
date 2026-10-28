"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Alert, BottomSheet, Button, Dock, Toast, WorkTimeBar } from "@/components/common";
import {
  distanceMeters,
  elapsedLabel,
  elapsedOf,
  kstMonthDayTime,
  kstTime,
  recordedReasonLabel,
  reviewReasonOf,
  termsCoverMap,
  type AttendanceKind,
  type RegisterProblem,
  type ReviewReason,
} from "@/lib/attendance-rules";
import type { AttendanceRecordResult, MyAttendance } from "@/lib/my-attendance";
import { changeConsentAction } from "../me/actions";
import { recordLocationReadAction, registerAttendanceAction } from "./actions";
import { Clock, GeoBlank, GeoMap, SiteCard, Sunken, Values } from "./check-in-parts";
import { KakaoGeoMap } from "./kakao-map";

/**
 * 휴대전화 위치. 출퇴근 탭에 들어올 때와 출근 · 퇴근 버튼을 누를 때 읽는다(ATT-22 v229, 2026-10-28 재영). 탭에서 읽은 위치는 지도에
 * 보여 주기만 하고, 판정은 버튼을 누를 때 다시 읽어 정한다 — 화면을 열어 둔 사이에 움직일 수 있다. 판정은 여기서 끝난다 —
 * 좌표는 서버로 보내지 않는다(ATT-05). 위치 조작 감지(ATT-21)는 운영체제가 알려 줄 때만 판정하는데, 브라우저 위치(Geolocation API)는
 * 모의 위치 여부를 알려 주지 않아 지금은 늘 false 다. 오차도 따로 판정하지 않는다(ATT-4).
 */
type Geo =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "denied" }
  | { status: "unavailable" }
  | { status: "ok"; distance: number; inRange: boolean; mocked: boolean; position: { latitude: number; longitude: number } };

type Sheet = "consent" | "bye" | "hifar" | "dup" | "nopunch" | "nocontract" | "noperiod" | null;

const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 };

// 출퇴근 등록 화면(목업 attendance.html · 데모 check-in). 출근은 확인 없이 바로 기록하고(ATT-9), 퇴근은 확인 시트를 한 번
// 거친다(WHALEERP-215). 반경 밖은 출근 · 퇴근 모두 시트에서 확인 필요가 붙는다고 알리고 받는다(ATT-11).
export function CheckInScreen({ data, mapKey }: { data: MyAttendance; mapKey: string | null }) {
  const { store, locationConsent: consent, openCheckIn, checkInBlock } = data;
  const located = store.isLocationApplied;
  const target = store.latitude !== null && store.longitude !== null ? { latitude: store.latitude, longitude: store.longitude } : null;
  const needsConsent = located && (consent.state === "NOT_AGREED" || consent.state === "WITHDRAWN" || consent.needsReconsent);
  const paused = located && consent.state === "PAUSED";
  const canLocate = located && target !== null && !paused && !needsConsent;
  // 탭 진입 때 읽기 · 카카오 지도에 내 위치 그리기는 그 둘을 담은 약관(LOCATION v1.1)에 동의했을 때만 — api 가 아직 v1.1 을
  // 시행하지 않았으면(배포 순서 · 롤백) v1.0 동의로는 하지 않는다 — 버튼을 누를 때만 읽고, 지도는 근무지만 그린다(내 위치 없이 거리만
  // 알림, 2026-10-28 PR #45 리뷰)
  const mapConsented = termsCoverMap(consent.termsVersion);
  const working = openCheckIn?.staffMemberId === data.staffMemberId ? openCheckIn : null;

  const [geo, setGeo] = useState<Geo>({ status: "idle" });
  // 탭에 들어올 때 읽은 내 위치 — 지도에 보여 주기만 하고 판정 · 등록에는 쓰지 않는다(ATT-22 v229). 못 읽었으면 null
  const [seen, setSeen] = useState<Extract<Geo, { status: "ok" }> | null>(null);
  // 이번 버튼에서 읽은 위치 읽음 — 범위 밖 출근 · 퇴근 확인 시트가 등록할 때 함께 보낸다
  const [readId, setReadId] = useState<number | null>(null);
  const [sheet, setSheet] = useState<Sheet>(needsConsent ? "consent" : null);
  const [declined, setDeclined] = useState(false);
  const [done, setDone] = useState<AttendanceRecordResult | null>(null);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(() => new Date());

  // 현재 시각 · 근무 경과는 30초마다 다시 센다
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const { latitude, longitude, radiusMeters } = store;
  // 위치는 콜백으로만 받는다 — 브라우저가 위치를 주지 않는 기기도 오류 콜백으로 같은 「읽지 못함」이 된다
  const locate = useCallback(
    () =>
      new Promise<Geo>((resolve) => {
        if (latitude === null || longitude === null) return resolve({ status: "unavailable" });
        if (!navigator.geolocation) return resolve({ status: "unavailable" });
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => {
            const distance = distanceMeters(coords, { latitude, longitude });
            const position = { latitude: coords.latitude, longitude: coords.longitude };
            resolve({ status: "ok", distance, inRange: distance <= radiusMeters, mocked: false, position });
          },
          (failure) => resolve({ status: failure.code === failure.PERMISSION_DENIED ? "denied" : "unavailable" }),
          GEO_OPTIONS,
        );
      }),
    [latitude, longitude, radiusMeters],
  );

  // 탭에 들어오면 한 번 위치를 읽는다. 버튼과 같이 위치 읽음(확인자료)을 먼저 남기고, 남기지 못했으면 읽지 않는다 — 이때는 시트를
  // 띄우지 않고 근무지만 그린 지도로 둔다(까닭은 버튼을 누를 때 보인다). 버튼이 위치를 읽지 않는 상태면 탭에서도 읽지 않는다 —
  // 동의 없음 · 일시 중지 · 근무지 좌표 없음(canLocate), 근무 중이면 퇴근 기한 지남, 아니면 출근이 막혔거나(계약 대기 · 근무 기간 아님)
  // 다른 근무지에 열린 출근이 있을 때. 시행 중인 약관이 탭 진입 읽기를 담지 않았을 때(mapConsented)도 읽지 않는다.
  // 한 번만 읽도록 ref 로 막고 cleanup 으로 결과를 버리지 않는다 — 개발 모드(Strict Mode)는 effect 를 두 번 돌려, 결과를 버리면
  // 기록만 남고 위치를 그리지 못한다. 보여 주기만 하는 값이라 실패는 조용히 넘긴다
  const previewable = canLocate && mapConsented && (working ? !working.isCheckOutExpired : !checkInBlock && !openCheckIn);
  const previewed = useRef(false);
  useEffect(() => {
    if (!previewable || previewed.current) return;
    previewed.current = true;
    void (async () => {
      const read = await recordLocationReadAction(data.staffMemberId);
      if (!read.ok) return;
      const next = await locate();
      if (next.status === "ok") setSeen(next);
    })().catch((thrown: unknown) => console.error("[check-in-preview] 위치 미리보기 실패", thrown));
  }, [previewable, data.staffMemberId, locate]);

  const show = (text: string) => setToast({ key: Date.now(), text });

  const judged = located ? (geo.status === "ok" ? geo : null) : { inRange: true, mocked: false };
  const reasonFor = (kind: AttendanceKind) => (judged ? reviewReasonOf(kind, judged) : null);

  /** api 가 막은 까닭에 맞는 시트 · 상태로 */
  const fail = (problem: RegisterProblem) => {
    switch (problem.kind) {
      case "already-checked-in":
        return setSheet("dup");
      case "no-open-check-in":
        return setSheet("nopunch");
      case "contract-pending":
        return setSheet("nocontract");
      case "no-contract":
        return setSheet("noperiod");
      case "consent-required":
        setDeclined(false);
        return setSheet("consent");
      case "paused":
        return setSheet(null); // 화면을 다시 받아 일시 중지 화면으로 바뀐다
      default:
        setSheet(null);
        return setError(problem.message);
    }
  };

  const registerNow = async (kind: AttendanceKind, reason: ReviewReason | null, locationReadId: number | null) => {
    setError(null);
    const result = await registerAttendanceAction(kind, data.staffMemberId, reason, locationReadId);
    if (!result.ok) return fail(result.problem);
    setSheet(null);
    if (kind === "CHECK_OUT") setDone(result.record);
    else show(reason ? "확인 필요로 출근을 등록했습니다" : "출근을 등록했습니다");
  };
  // 좌표 없는 근무지의 퇴근은 위치를 읽지 않으므로 위치 읽음도 보내지 않는다(api 가 위치 없이 받는다)
  const register = (kind: AttendanceKind, reason: ReviewReason | null) => startTransition(() => registerNow(kind, reason, target ? readId : null));

  /**
   * 버튼을 눌러 위치를 다시 읽는다(ATT-22) — 판정은 이 위치로 한다. api 에 위치 읽음(확인자료)을 먼저 남기고 그다음에 읽는다 — 확인자료 없이 위치를 읽는 일이
   * 없게(다른 기기에서 멈췄거나 철회했으면 api 가 막는다). 읽기가 실패해도 확인자료는 남아 있다. 읽은 위치로 판정한 확인 필요 사유와
   * 위치 읽음을 돌려주고, 남기지 못했거나 읽지 못했으면 null(화면이 까닭을 보인다).
   */
  const readLocation = async (kind: AttendanceKind): Promise<{ reason: ReturnType<typeof reviewReasonOf>; locationReadId: number } | null> => {
    setError(null);
    setGeo({ status: "loading" });
    const read = await recordLocationReadAction(data.staffMemberId);
    if (!read.ok) {
      setGeo({ status: "idle" });
      fail(read.problem);
      return null;
    }
    setReadId(read.locationReadId);
    const next = await locate();
    setGeo(next);
    if (next.status !== "ok") return null;
    return { reason: reviewReasonOf(kind, next), locationReadId: read.locationReadId };
  };

  const pressCheckIn = () => {
    if (checkInBlock) return setSheet(checkInBlock.reason === "CONTRACT_PENDING_SIGNATURE" ? "nocontract" : "noperiod");
    if (openCheckIn) return setSheet("dup");
    if (!located) return register("CHECK_IN", null);
    startTransition(async () => {
      const read = await readLocation("CHECK_IN");
      if (!read || read.reason === "blocked") return;
      if (read.reason) return setSheet("hifar");
      await registerNow("CHECK_IN", null, read.locationReadId);
    });
  };

  const pressCheckOut = () => {
    // 위치를 보지 않거나 근무지 좌표가 없으면 위치 없이 퇴근한다 — 열린 출근을 닫아야 다른 근무지 출근이 막히지 않는다(ATT-36)
    if (!located || !target) return setSheet("bye");
    startTransition(async () => {
      if (await readLocation("CHECK_OUT")) setSheet("bye");
    });
  };

  const consentChange = (change: "location-agree" | "location-resume", done: string) =>
    startTransition(async () => {
      const result = await changeConsentAction(change);
      if (!result.ok) return setError(result.error);
      setSheet(null);
      show(done);
    });

  const adminNote = `출퇴근 기록은 근태 확인을 위해 ${store.name} 관리자가 확인합니다.`;
  const schedule = data.todaySchedules[0];
  const elapsed = working ? elapsedOf(new Date(working.recordedAt), now) : null;
  const distanceText = geo.status === "ok" ? `매장까지 ${Math.round(geo.distance)}m` : "";
  const outOfRange = `${distanceText} · 범위 ${store.radiusMeters}m 밖입니다`;
  const workSummary = working && elapsed && (
    <Sunken>
      <Values
        rows={[
          ["출근", kstTime(new Date(working.recordedAt))],
          ["지금까지", elapsedLabel(elapsed)],
        ]}
      />
    </Sunken>
  );

  // ── 화면 ──
  let body: ReactNode;
  let dock: ReactNode = null;

  if (done) {
    const checkedIn = done.checkInRecordedAt ? new Date(done.checkInRecordedAt) : null;
    body = (
      <>
        <Clock label="퇴근 기록">{kstTime(new Date(done.recordedAt))}</Clock>
        <Sunken>
          <Values
            rows={[
              ["근무지", done.storeName],
              ...(checkedIn ? ([["출근", kstTime(checkedIn)], ["근무 시간", elapsedLabel(elapsedOf(checkedIn, new Date(done.recordedAt)))]] as [string, string][]) : []),
              ...(done.reviewReason ? ([["확인 필요", recordedReasonLabel(done.reviewReason) ?? "관리자 확인"]] as [string, string][]) : []),
            ]}
          />
        </Sunken>
        <p className="text-[12px] text-staff-text-muted">기록이 저장되었습니다. {adminNote}</p>
      </>
    );
    dock = (
      <Button variant="ghost" href="/home">
        홈으로
      </Button>
    );
  } else if (paused) {
    body = (
      <>
        <GeoBlank tone="warning" text="위치를 읽지 않습니다" />
        <Alert tone="warning">
          <strong>일시 중지 중에는 앱으로 출퇴근을 등록할 수 없습니다.</strong>
          <br />
          출퇴근 기록은 근무지 관리자에게 문의해 주세요.
        </Alert>
        <Sunken prose label="다시 켜면 바로 등록할 수 있습니다">
          동의는 그대로 남아 있어 <b>새로 동의하지 않아도 됩니다.</b> 내 정보에서도 켤 수 있습니다.
        </Sunken>
      </>
    );
    dock = (
      <>
        <Button disabled={pending} onClick={() => consentChange("location-resume", "위치 수집을 다시 켰습니다")}>
          다시 켜기
        </Button>
        <Button variant="ghost" href="/me">
          내 정보에서 관리
        </Button>
      </>
    );
  } else if (needsConsent && declined) {
    body = (
      <>
        <GeoBlank tone="muted" text="위치정보 동의가 없습니다" />
        <Alert tone="danger">
          <strong>위치정보 이용에 동의하지 않으면 앱으로 출퇴근을 등록할 수 없습니다.</strong>
          <br />
          출퇴근 기록은 근무지 관리자에게 문의해 주세요.
        </Alert>
        <Sunken prose label="권한을 끈 것과 다릅니다">
          휴대전화 위치 권한은 설정에서 켜면 바로 등록할 수 있습니다. 여기는 <b>위치정보 수집 동의 자체를 하지 않았거나 철회한</b> 경우라,
          설정을 바꿔도 앱에서는 등록되지 않습니다. 문의를 받은 관리자가 <b>대신 등록</b>할 수 있습니다.
        </Sunken>
      </>
    );
    dock = (
      <Button variant="ghost" onClick={() => setSheet("consent")}>
        다시 동의하기
      </Button>
    );
  } else {
    // 지도 위 안내 — 다시 읽는 중 · 탭에서 읽은 거리 · 버튼 안내 순
    const waitText =
      geo.status === "loading"
        ? "위치를 확인하는 중입니다"
        : seen
          ? `매장까지 ${Math.round(seen.distance)}m`
          : `${working ? "퇴근하기" : "출근하기"}를 누르면 위치를 확인합니다`;
    // 위치 블록: 위치를 보지 않는 근무지는 지도 없이 시각만 보인다
    const geoBlock = !located ? null : !target ? (
      <>
        <GeoBlank tone="muted" text="근무지 위치가 없습니다" />
        <Alert tone="warning">근무지 위치가 등록되지 않아 매장 안인지 확인할 수 없습니다. 근무지 관리자에게 문의해 주세요.</Alert>
      </>
    ) : needsConsent ? (
      <GeoBlank tone="muted" text="위치정보 동의 뒤에 위치를 확인합니다" />
    ) : geo.status === "idle" || geo.status === "loading" ? (
      // 버튼에서 읽은 위치가 아직 없으면(누르기 전 · 다시 읽는 중 · 남기지 못함) 탭에서 읽은 내 위치를 그린다. 그것도 없으면 근무지만 그린다
      <KakaoGeoMap
        appKey={mapKey}
        store={target}
        me={mapConsented && seen ? { ...seen.position, inRange: seen.inRange } : undefined}
        radiusMeters={store.radiusMeters}
        caption={waitText}
        fallback={seen ? <GeoMap tone={seen.inRange ? "in" : "out"} caption={waitText} /> : <GeoBlank tone="muted" text={waitText} />}
      />
    ) : geo.status === "denied" ? (
      <>
        <GeoBlank tone="muted" text="위치를 확인할 수 없습니다" />
        <Alert tone="danger">
          <strong>위치 권한이 꺼져 있습니다.</strong>
          <br />
          출퇴근은 매장에 있는지를 위치로 확인합니다. 설정에서 위치 접근을 허용한 뒤 다시 시도해 주세요.
        </Alert>
      </>
    ) : geo.status === "unavailable" ? (
      <>
        <GeoBlank tone="muted" text="위치를 확인할 수 없습니다" />
        <Alert tone="warning">지금 위치를 읽지 못했습니다. 잠시 뒤 다시 확인해 주세요.</Alert>
      </>
    ) : geo.mocked && !working ? (
      // 위치 조작 감지 — 출근은 막는다(ATT-21). 다시 확인 버튼은 두지 않고 출근을 다시 누르게 한다(2026-10-26 재영, ATT-22)
      <>
        <GeoBlank tone="muted" text="위치 조작이 감지되었습니다" />
        <Alert tone="danger">모의 위치를 끈 뒤 출근을 다시 눌러 주세요.</Alert>
      </>
    ) : !mapConsented ? (
      // 카카오 지도에 내 위치를 그리는 데 동의하지 않았으면 근무지만 그린 지도를 그대로 두고 거리만 알린다
      <KakaoGeoMap
        appKey={mapKey}
        store={target}
        radiusMeters={store.radiusMeters}
        caption={distanceText}
        fallback={<GeoMap tone={geo.inRange ? "in" : "out"} caption={distanceText} />}
      />
    ) : (
      <KakaoGeoMap
        appKey={mapKey}
        store={target}
        me={{ ...geo.position, inRange: geo.inRange }}
        radiusMeters={store.radiusMeters}
        caption={distanceText}
        fallback={<GeoMap tone={geo.inRange ? "in" : "out"} caption={distanceText} />}
      />
    );
    const out = geo.status === "ok" && !geo.inRange;
    // 위치를 보는 근무지는 근무지 좌표가 있어야 버튼을 눌러 위치를 읽을 수 있다
    const usable = !located || canLocate;

    if (working?.isCheckOutExpired) {
      // 출근한 다음 날이 지난 열린 출근은 앱으로 닫을 수 없다(api 409 CHECK_OUT_EXPIRED) — 근무 경과 · 퇴근 버튼 대신 관리자 보정을
      // 안내하고 위치도 읽지 않는다
      body = (
        <>
          <SiteCard title="퇴근 등록 기한이 지났습니다" sub={`${kstMonthDayTime(new Date(working.recordedAt))}에 출근했습니다`} />
          <Alert tone="warning">
            퇴근은 출근한 다음 날까지 등록할 수 있습니다. <strong>근무지 관리자에게 퇴근 보정</strong>을 요청해 주세요. 보정되면 다시 출근할 수
            있습니다.
          </Alert>
          <p className="text-center text-[12px] text-staff-text-muted">{adminNote}</p>
        </>
      );
    } else if (working && elapsed) {
      body = (
        <>
          {geoBlock}
          <SiteCard title="근무 중" sub={`${kstTime(new Date(working.recordedAt))}에 출근했습니다`} />
          {out && (
            <Alert tone="warning">
              <strong>매장 범위 밖입니다.</strong>
              <br />
              퇴근은 여기서도 등록할 수 있습니다. 다만 기록에 <strong>확인 필요</strong>가 붙고 관리자가 확인합니다.
            </Alert>
          )}
          <section className="flex flex-col gap-[9px] rounded-[18px] border border-staff-border-light bg-white p-[20px]">
            <h2 className="text-[13px] font-semibold text-staff-text-sub">오늘</h2>
            <WorkTimeBar
              schedule={schedule && { start: schedule.startTime, end: schedule.endTime }}
              worked={{ start: kstTime(new Date(working.recordedAt)), end: kstTime(now) }}
              ongoing
            />
            <p className="text-[12px] text-staff-text-muted">점선은 예정, 채운 칠은 실제 기록입니다</p>
          </section>
          <Clock label="근무 경과" note={`현재 시각 ${kstTime(now)}`}>
            {elapsed.hours}
            <span className="text-[17px]">시간 </span>
            {elapsed.minutes}
            <span className="text-[17px]">분</span>
          </Clock>
          <p className="text-center text-[12px] text-staff-text-muted">{adminNote}</p>
        </>
      );
      dock = (
        <>
          <Button disabled={pending || !(usable || !target)} onClick={pressCheckOut}>
            퇴근하기
          </Button>
        </>
      );
    } else {
      body = (
        <>
          {geoBlock}
          {out ? (
            <>
              <Alert tone="warning">
                <strong>매장에서 {Math.round(geo.status === "ok" ? geo.distance : 0)}m 떨어져 있습니다.</strong>
                <br />
                이대로 출근하면 기록에 <strong>확인 필요</strong>가 붙고 관리자가 확인합니다. 근무지가 맞는지 한 번 더 확인해 주세요.
              </Alert>
              <section className="flex flex-col rounded-[18px] border border-staff-border-light bg-white p-[20px]">
                <h2 className="text-[13px] font-semibold text-staff-text-sub">근무지</h2>
                <p className="pt-[6px] text-[16px] font-bold">{store.name}</p>
                {store.address && <p className="pt-[3px] text-[12px] text-staff-text-muted">{store.address}</p>}
              </section>
            </>
          ) : (
            <SiteCard title={store.name} sub={
                !located
                  ? "위치를 확인하지 않는 근무지입니다"
                  : geo.status === "ok"
                    ? "매장 범위 안에 있습니다"
                    : geo.status === "loading"
                      ? "위치를 확인하고 있습니다"
                      : "출근하기를 누르면 위치를 확인합니다"
              } />
          )}
          {schedule && (
            <section className="flex flex-col gap-[7px] rounded-[18px] border border-staff-border-light bg-white p-[20px]">
              <h2 className="text-[13px] font-semibold text-staff-text-sub">오늘 예정 근무</h2>
              {data.todaySchedules.map((s) => (
                <div key={s.startAt} className="flex items-center gap-[8px]">
                  <p className="min-w-0 flex-1 text-[20px] font-bold tracking-[-0.42px]">
                    {s.startTime} – {s.endTime}
                  </p>
                  {s.breakMinutes > 0 && (
                    <span className="rounded-[8px] bg-staff-info-bg px-[10px] py-[4px] text-[12px] font-semibold text-staff-text-sub">휴게 {s.breakMinutes}분</span>
                  )}
                </div>
              ))}
            </section>
          )}
          <Clock label="현재 시각" note="기록 시각은 서버가 요청을 받은 때로 정해집니다" dim={!usable || out}>
            {kstTime(now)}
          </Clock>
        </>
      );
      dock = (
        <>
          {/* 동의 시트를 닫기로 접었으면 다시 열 길이 있어야 한다 — 꺼진 출근 버튼만 남기지 않는다 */}
          {needsConsent ? (
            <Button disabled={pending} onClick={() => setSheet("consent")}>
              위치정보 동의하기
            </Button>
          ) : (
            <Button disabled={pending || !usable} onClick={pressCheckIn}>
              출근하기
              <Image src="/icons/arrow-right.svg" alt="" width={14} height={12} />
            </Button>
          )}
        </>
      );
    }
  }

  const byeReason = reasonFor("CHECK_OUT");
  const checkOutReason = byeReason === "blocked" ? null : byeReason;

  return (
    <>
      <main className="flex flex-col gap-[20px] px-[22px] pt-[22px] pb-[14px] leading-[1.5]">
        {error && <Alert tone="danger">{error}</Alert>}
        {body}
      </main>
      {dock && <Dock inset={30}>{dock}</Dock>}

      {/* 위치정보 동의(운영 정책 ATT-06 · ATT-23): 서비스 약관과 따로, 첫 출근 등록 때 · 약관 버전이 바뀌면 다시. 문구는 법무 검토 중(ATT-8) — 반경 밖 확인 필요 표시 문장은 2026-10-26 재영 안,
          탭 진입 때 읽기 · 카카오 전달은 2026-10-28 재영 안(ATT-05 · ATT-22 v229). 카카오 전달을 「제공」 · 「위탁」 중 무엇으로 쓸지는 법무 결과에 따라 고친다. */}
      <BottomSheet open={sheet === "consent"} onClose={() => setSheet(null)} title="위치정보 수집에 동의해 주세요">
        <p className="text-[14px] text-staff-text-sub [&_b]:font-bold [&_b]:text-staff-text">
          출퇴근 탭에 들어올 때와 출근 · 퇴근 버튼을 누를 때 위치를 읽어 <b>매장 안인지</b> 확인하고, 지도에 근무지와 내 위치를 보여 줍니다.{" "}
          <b>위치는 서버로 보내지 않습니다.</b> 다만 지도를 보여 주려고 <b>카카오 지도에 대략적인 위치</b>가 전달됩니다. 기록에는{" "}
          <b>출퇴근 시각</b>이 남습니다. 반경 밖이면 <b>확인 필요 표시만</b> 남고 관리자 검토 뒤 지웁니다.
        </p>
        <Sunken>
          <Values
            rows={[
              ["쓰는 곳", "출퇴근 등록 판정 · 출퇴근 화면 지도 표시"],
              ["남기는 것", "출퇴근 시각 · 반경 밖이면 확인 필요 표시(관리자 검토 뒤 지움)"],
              ["전달하는 곳", "카카오(지도 표시, 대략적인 위치)"],
              ["동의 철회", "내 정보에서 언제든"],
            ]}
          />
        </Sunken>
        <p className="text-[12px] font-bold text-staff-text-sub">동의해야 앱으로 출퇴근을 등록할 수 있습니다.</p>
        <p className="text-[12px] text-staff-text-sub">
          서비스 약관과 따로 받는 동의입니다. 동의하지 않으면 출퇴근 기록을 근무지 관리자에게 문의해야 합니다.
          {consent.termsVersion && <span className="text-staff-text-muted"> 위치정보 수집·이용 동의 {consent.termsVersion}</span>}
        </p>
        <Button disabled={pending} onClick={() => consentChange("location-agree", "위치정보 수집에 동의했습니다")}>
          동의합니다
        </Button>
        <Button
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setDeclined(true);
            setSheet(null);
          }}
        >
          동의하지 않음
        </Button>
      </BottomSheet>

      {/* 퇴근 확인(WHALEERP-215): 바로 퇴근하지 않는다. 닫거나 뒤로 가면 아무것도 남지 않는다. */}
      <BottomSheet
        open={sheet === "bye"}
        onClose={() => setSheet(null)}
        title={checkOutReason === "MOCK_LOCATION" ? "확인 필요로 퇴근할까요" : checkOutReason ? "매장 범위 밖에서 퇴근할까요" : "퇴근할까요"}
        description={
          checkOutReason
            ? "이대로 등록하면 기록에 확인 필요가 붙고 관리자가 확인합니다. 퇴근을 등록하면 오늘 근무가 끝납니다."
            : "퇴근을 등록하면 오늘 근무가 끝납니다. 뒤에 다시 출근하려면 새로 등록해야 합니다."
        }
        closeLabel="아직 아닙니다"
      >
        {workSummary}
        {checkOutReason === "OUT_OF_RADIUS_CHECKOUT" && <Alert tone="warning">{outOfRange}</Alert>}
        {checkOutReason === "MOCK_LOCATION" && <Alert tone="warning">확인 필요 사유 · 위치 조작 감지</Alert>}
        <Button disabled={pending} onClick={() => register("CHECK_OUT", checkOutReason)}>
          퇴근 확정
        </Button>
      </BottomSheet>

      {/* 범위 밖 출근(ATT-11): 확인 필요로 받는다. 근무지 자동 선택이 없어(ATT-07) 출근할 근무지 이름을 크게 보인다. */}
      <BottomSheet
        open={sheet === "hifar"}
        onClose={() => setSheet(null)}
        title="매장 범위 밖에서 출근할까요"
        description="이대로 등록하면 기록에 확인 필요가 붙고 관리자가 확인합니다."
        closeLabel="아직 아닙니다"
      >
        <Sunken prose label="출근할 근무지">
          <p className="text-[16px] font-bold text-staff-text">{store.name}</p>
          <p className="pt-[3px] text-[12px] text-staff-text-muted">근무지가 다르면 닫고 홈이나 근무 정보에서 바꿔 주세요</p>
        </Sunken>
        <Alert tone="warning">{outOfRange}</Alert>
        <Button disabled={pending} onClick={() => register("CHECK_IN", "OUT_OF_RADIUS_CHECKIN")}>
          출근 확정
        </Button>
      </BottomSheet>

      <BottomSheet
        open={sheet === "dup"}
        onClose={() => setSheet(null)}
        title="이미 출근해 있습니다"
        description={
          openCheckIn?.isCheckOutExpired
            ? `${kstMonthDayTime(new Date(openCheckIn.recordedAt))}에 ${openCheckIn.storeName}으로 출근한 기록이 열려 있고 퇴근 등록 기한이 지났습니다. 그 근무지 관리자에게 퇴근 보정을 요청해 주세요.`
            : openCheckIn
            ? `${kstTime(new Date(openCheckIn.recordedAt))}에 ${openCheckIn.storeName}으로 출근한 기록이 열려 있습니다. 퇴근을 먼저 등록해 주세요.`
            : "열린 출근 기록이 있습니다. 퇴근을 먼저 등록해 주세요."
        }
      >
        {openCheckIn && !openCheckIn.isCheckOutExpired && openCheckIn.staffMemberId !== data.staffMemberId && (
          <Sunken prose>
            <b>{openCheckIn.storeName}</b>에서 퇴근하려면 홈이나 근무 정보에서 근무지를 그곳으로 바꿔 주세요.
          </Sunken>
        )}
      </BottomSheet>

      <BottomSheet
        open={sheet === "nopunch"}
        onClose={() => setSheet(null)}
        title="출근 기록이 없습니다"
        description="퇴근은 열려 있는 출근 기록이 있어야 등록할 수 있습니다. 오늘 출근을 찍지 않았다면 근무지 관리자에게 알려 주세요."
      >
        <Sunken prose>관리자는 최근 3개월 안의 기록을 수정할 수 있습니다.</Sunken>
      </BottomSheet>

      {/* 근로계약 기간 밖 출근(ATT-12): 서명 대기 계약이 있으면 날인하면 바로 출근할 수 있다. 앱의 계약서 화면이 아직 없어 홈의 날인 대기 카드로 보낸다. */}
      <BottomSheet
        open={sheet === "nocontract"}
        onClose={() => setSheet(null)}
        title="근로계약을 체결해야 출근할 수 있습니다"
        description="오늘 날짜가 들어간 체결 완료 근로계약이 있어야 출퇴근을 등록할 수 있습니다. 받은 계약서에 서명하면 바로 출근할 수 있습니다."
      >
        <Button href="/home">계약서 보러 가기</Button>
      </BottomSheet>

      <BottomSheet
        open={sheet === "noperiod"}
        onClose={() => setSheet(null)}
        title="오늘은 근로계약 기간이 아닙니다"
        description="오늘 날짜가 들어간 체결 완료 근로계약이 있어야 출퇴근을 등록할 수 있습니다."
      >
        <Sunken prose>근무지 관리자에게 문의해 주세요.</Sunken>
      </BottomSheet>

      {toast && <Toast key={toast.key}>{toast.text}</Toast>}
    </>
  );
}
