import "./globals.css";
import AuthProvider from "@/components/layout/AuthProvider";
import NextTopLoader from "nextjs-toploader";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NextTopLoader
          color="#ea580c"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #ea580c, 0 0 5px #ea580c"
        />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}