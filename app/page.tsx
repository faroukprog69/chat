import { ComponentExample } from "@/components/component-example";
import { redirect } from "next/navigation";
export default function Page() {
  redirect("/signin");
}
