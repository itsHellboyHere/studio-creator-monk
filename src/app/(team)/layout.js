import Sidebar from "@/components/layout/Sidebar";
import styles from "../(team)/team/layout.module.css";
import dynamic from "next/dynamic";

const PushNotificationManager = dynamic(
  () => import("@/components/PushNotificationManager"),
  { ssr: false }
);

export const metadata = {
  title: {
    template: "%s | CreatorMonk OS",
    default: "Dashboard | CreatorMonk OS",
  },
  description: "CreatorMonk Agency Management Portal",
};

export default function TeamLayout({ children }) {
  return (
    <div className={styles.layoutWrapper}>
      <PushNotificationManager />
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}