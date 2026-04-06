"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Filter } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import styles from "./clients.module.css";

export default function SearchBar({ industries }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  const updateParam = (name, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(name, value);
    else params.delete(name);
    replace(`${pathname}?${params.toString()}`);
  };

  const handleSearch = useDebouncedCallback(
    (term) => updateParam("search", term),
    300
  );

  const hasActiveFilters =
    searchParams.get("industry") || searchParams.get("minPrice");

  return (
    <div className={styles.toolbarWrapper}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search brands..."
            onChange={(e) => handleSearch(e.target.value)}
            defaultValue={searchParams.get("search") ?? ""}
          />
        </div>
        <button
          className={`${styles.filterBtn} ${
            showFilters || hasActiveFilters ? styles.activeFilter : ""
          }`}
          onClick={() => setShowFilters((v) => !v)}
        >
          <Filter size={15} />
          <span className={styles.filterBtnLabel}>
            Filters{hasActiveFilters ? " •" : ""}
          </span>
        </button>
      </div>

      {showFilters && (
        <div className={styles.filterDrawer}>
          {/* Industry — sourced from brandDescription distinct values */}
          <div className={styles.filterGroup}>
            <label>Industry</label>
            <select
              onChange={(e) => updateParam("industry", e.target.value)}
              defaultValue={searchParams.get("industry") ?? ""}
            >
              <option value="">All Industries</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Min package */}
          <div className={styles.filterGroup}>
            <label>Minimum Package (₹)</label>
            <select
              onChange={(e) => updateParam("minPrice", e.target.value)}
              defaultValue={searchParams.get("minPrice") ?? ""}
            >
              <option value="">Any Amount</option>
              <option value="5000">₹5,000+</option>
              <option value="10000">₹10,000+</option>
              <option value="25000">₹25,000+</option>
              <option value="50000">₹50,000+</option>
            </select>
          </div>

          <button className={styles.clearBtn} onClick={() => replace(pathname)}>
            Reset All
          </button>
        </div>
      )}
    </div>
  );
}