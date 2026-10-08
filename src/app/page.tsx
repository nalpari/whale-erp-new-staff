import { redirect } from "next/navigation";

// 임시 첫 화면. 직원 근무 앱 화면이 생길 때까지 볼 수 있는 것은 디자인 견본과 화면 목업뿐이다.
// 로그인(3팀 accounts)이 생기면 그쪽으로 바꾼다.
export default function Home() {
  redirect("/design");
}
