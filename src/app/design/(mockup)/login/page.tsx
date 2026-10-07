import Image from "next/image";
import { BrandLogo, Button, Notice, TextField } from "@/components/common";
import { PageSlide } from "../page-slide";

// Figma 01.Login(node 3:1965). 목업이라 실제 로그인은 하지 않고 다음 화면으로 넘어간다.
const NEXT = "/design/home";

export default function MockupLoginPage() {
  return (
    <PageSlide>
      <main className="flex flex-1 flex-col gap-[24px]">
        <div className="px-[30px] pt-[62px]">
          <BrandLogo />

          <div className="flex flex-col gap-[6px] pt-[76px] leading-[1.5]">
            <h1 className="text-[28px] font-bold">다시 오셨네요</h1>
            <p className="text-[14px] text-staff-text-sub">근무 정보와 출퇴근을 확인하려면 로그인하세요.</p>
          </div>

          <div className="flex flex-col gap-[16px] pt-[24px] pb-[16px]">
            <TextField label="이메일" type="email" defaultValue="haeun.lee@gmail.com" help="가입할 때 정한 아이디입니다" />
            <TextField label="비밀번호" type="password" placeholder="비밀번호를 입력해 주세요" />
          </div>

          <Notice icon={<Image src="/icons/shield.svg" alt="" width={12} height={12.5} className="-scale-y-100" />}>
            한 번 로그인하면 <strong>30일</strong> 동안 다시 묻지 않습니다.
          </Notice>
        </div>

        {/* 버튼 줄(Figma Btns 4:2030): 흰 바탕, 위 14 · 아래 24 · 좌우 30. 고정하지 않고 본문과 함께 스크롤한다.
            화면이 본문보다 길면 mt-auto 로 맨 아래에 놓인다. */}
        <div className="mt-auto flex flex-col gap-[8px] bg-white px-[30px] pt-[14px] pb-[max(24px,env(safe-area-inset-bottom))]">
          <Button href={NEXT} transitionTypes={["nav-forward"]}>
            미리보기 로그인
            <Image src="/icons/arrow-right.svg" alt="" width={14} height={12} />
          </Button>
          <Button variant="ghost">비밀번호를 잊으셨나요</Button>
        </div>
      </main>
    </PageSlide>
  );
}
