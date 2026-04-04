"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import styles from "./clients.module.css";

export default function SearchBar({ industries }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  const updatePath = (name, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(name, value);
    else params.delete(name);
    replace(`${pathname}?${params.toString()}`);
  };

  const handleSearch = useDebouncedCallback((term) => updatePath("search", term), 300);

  return (
    <div className={styles.toolbarWrapper}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search brands..." 
            onChange={(e) => handleSearch(e.target.value)}
            defaultValue={searchParams.get("search")?.toString()}
          />
        </div>
        <button 
          className={`${styles.filterBtn} ${showFilters ? styles.activeFilter : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          {showFilters ? "Close" : "Filters"}
        </button>
      </div>

      {showFilters && (
        <div className={styles.filterDrawer}>
          <div className={styles.filterGroup}>
            <label>Industry</label>
            <select 
              onChange={(e) => updatePath("industry", e.target.value)}
              defaultValue={searchParams.get("industry") || ""}
            >
              <option value="">All Industries</option>
              {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Minimum Package (₹)</label>
            <select 
              onChange={(e) => updatePath("minPrice", e.target.value)}
              defaultValue={searchParams.get("minPrice") || ""}
            >
              <option value="">Any Price</option>
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