import { redirect } from "next/navigation";

// 첫 화면. 로그인하지 않았으면 proxy 가 /login 으로 돌린다.
export default function Home() {
  redirect("/home");
}
