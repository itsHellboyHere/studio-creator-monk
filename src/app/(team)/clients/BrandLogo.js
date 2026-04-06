"use client";

import { useState } from "react";
import styles from "./clients.module.css";

// fixed img

export default function BrandLogo({ name, imageUrl }) {
  const [hasError, setHasError] = useState(false);
  const letter = name ? name[0].toUpperCase() : "?";

  if (!imageUrl || hasError) {
    return <div className={styles.brandIcon}>{letter}</div>;
  }

  return (
    <div className={styles.brandIcon}>
      <img
        src={imageUrl}
        alt={name}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          borderRadius: "inherit",
          display: "block",
        }}
        onError={() => setHasError(true)}
      />
    </div>
  );
}