import Sidebar from "@/components/layout/Sidebar";
import styles from "../(team)/team/layout.module.css"

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
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}