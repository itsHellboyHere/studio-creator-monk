"use client";
import { useState } from "react";
import {
  FiShield, FiGlobe, FiTarget, FiArrowRight,
  FiInstagram, FiYoutube, FiLinkedin, FiFacebook,
  FiChevronLeft, FiLink, FiPhone, FiMail,
  FiBriefcase, FiImage, FiCalendar, FiCheckCircle,
  FiLock, FiEye, FiEyeOff, FiDownload, FiUser,
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { onboardClient } from "./actions";
import styles from "./onboarding.module.css";

const STEPS = [
  { id: 1, icon: FiShield, code: "01", label: "Discovery" },
  { id: 2, icon: FiGlobe,  code: "02", label: "Access"    },
  { id: 3, icon: FiTarget, code: "03", label: "Kickoff"   },
];

function downloadCSV(data) {
  const rows = [
    ["CreatorMonk Client Portal — Access Credentials"],
    ["Generated", new Date().toLocaleString()],
    [""],
    ["Client Name",   data.clientName],
    ["Login Email",   data.email],
    ["Password",      data.password],
    ["Portal URL",    data.portalUrl],
    ["Client ID",     data.clientId],
    [""],
    ["IMPORTANT: Store this file securely. Delete after sharing with client."],
  ];
  const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${data.clientName.replace(/\s+/g, "_")}_portal_credentials.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OnboardingForm() {
  const [step, setStep]         = useState(1);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(null); // holds returned data

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData(e.target);
      const result   = await onboardClient(formData);
      setSuccess(result);
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS SCREEN ──
  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.orbA} /><div className={styles.orbB} />
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <div className={styles.logoMark}>CM</div>
            <div>
              <h1 className={styles.title}>Client Onboarding</h1>
              <p className={styles.subtitle}>CreatorMonk Agency Portal</p>
            </div>
          </div>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <FiCheckCircle size={32} />
            </div>
            <h2 className={styles.successTitle}>Portal Launched!</h2>
            <p className={styles.successSub}>
              <strong>{success.clientName}</strong> is now onboarded. Download the credentials file and share it securely with the client.
            </p>

            <div className={styles.credBlock}>
              <div className={styles.credRow}>
                <span className={styles.credLabel}>Email</span>
                <span className={styles.credVal}>{success.email}</span>
              </div>
              <div className={styles.credRow}>
                <span className={styles.credLabel}>Password</span>
                <span className={styles.credVal}>{success.password}</span>
              </div>
              <div className={styles.credRow}>
                <span className={styles.credLabel}>Portal URL</span>
                <a href={success.portalUrl} target="_blank" rel="noreferrer" className={styles.credLink}>
                  {success.portalUrl}
                </a>
              </div>
            </div>

            <div className={styles.successActions}>
              <button
                className={styles.downloadBtn}
                onClick={() => downloadCSV(success)}
              >
                <FiDownload size={16} /> Download Credentials CSV
              </button>
              <a href="/clients" className={styles.clientsLink}>
                View All Clients →
              </a>
            </div>

            <p className={styles.warningNote}>
              ⚠ This is the only time the plain-text password is visible. Download the CSV now.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.orbA} /><div className={styles.orbB} />
      <div className={styles.wrapper}>

        <div className={styles.header}>
          <div className={styles.logoMark}>CM</div>
          <div>
            <h1 className={styles.title}>Client Onboarding</h1>
            <p className={styles.subtitle}>CreatorMonk Agency Portal • 2026</p>
          </div>
        </div>

        {/* Stepper */}
        <nav className={styles.stepper}>
          {STEPS.map((s, i) => {
            const Icon  = s.icon;
            const state = step > s.id ? "done" : step === s.id ? "active" : "idle";
            return (
              <div key={s.id} className={styles.stepRow}>
                <div className={`${styles.stepItem} ${styles[state]}`}>
                  <div className={styles.stepCircle}>
                    {state === "done" ? <FiCheckCircle size={17}/> : <Icon size={17}/>}
                  </div>
                  <div className={styles.stepMeta}>
                    <span className={styles.stepCode}>STEP {s.code}</span>
                    <span className={styles.stepLabel}>{s.label}</span>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`${styles.connector} ${step > s.id ? styles.connectorFilled : ""}`} />
                )}
              </div>
            );
          })}
        </nav>

        {error && (
          <div className={styles.errorBanner}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.card}>

          {/* STEP 1 */}
          <div className={step === 1 ? styles.stepContent : styles.hidden}>
            <div className={styles.sectionHead}>
              <div className={styles.headIcon}><FiShield size={19}/></div>
              <div>
                <h2 className={styles.sectionTitle}>Brand Information</h2>
                <p className={styles.sectionDesc}>Core identity and portal access setup.</p>
              </div>
            </div>
            <div className={styles.grid2}>
              <Field icon={<FiBriefcase size={13}/>} label="Brand Name" required>
                <input name="name" placeholder="e.g. Hexalam Interior" required />
              </Field>
              <Field icon={<FiTarget size={13}/>} label="Industry">
                <input name="brandDescription" placeholder="e.g. Interior Decor" />
              </Field>
              <Field icon={<FiMail size={13}/>} label="Contact Email" required>
                <input name="email" type="email" placeholder="client@brand.com" required />
              </Field>
              <PasswordField />
            </div>
            <div className={styles.grid2}>
              <Field icon={<FiPhone size={13}/>} label="WhatsApp">
                <input name="whatsappNumber" placeholder="https://wa.me/91..." />
              </Field>
              <Field icon={<FiImage size={13}/>} label="Brand Logo URL">
                <input name="logoUrl" placeholder="https://..." />
              </Field>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.nextBtn} onClick={() => {
                const email = document.querySelector('[name="email"]').value;
                const pass  = document.querySelector('[name="password"]').value;
                const name  = document.querySelector('[name="name"]').value;
                if (!name.trim())  { setError("Brand name is required."); return; }
                if (!email.trim()) { setError("Email is required."); return; }
                if (!pass || pass.length < 8) { setError("Password must be at least 8 characters."); return; }
                setError("");
                setStep(2);
              }}>
                Next Phase <FiArrowRight size={16}/>
              </button>
            </div>
          </div>

          {/* STEP 2 */}
          <div className={step === 2 ? styles.stepContent : styles.hidden}>
            <div className={styles.sectionHead}>
              <div className={styles.headIcon}><FiGlobe size={19}/></div>
              <div>
                <h2 className={styles.sectionTitle}>Social & Web Presence</h2>
                <p className={styles.sectionDesc}>Digital infrastructure links for the brand.</p>
              </div>
            </div>
            <div className={styles.grid2}>
              <Field icon={<FiLink size={13}/>} label="Website">
                <input name="websiteUrl" placeholder="https://brand.com" />
              </Field>
              <Field icon={<FiInstagram size={13}/>} label="Instagram">
                <input name="instagramUrl" placeholder="https://instagram.com/..." />
              </Field>
              <Field icon={<FiFacebook size={13}/>} label="Facebook">
                <input name="facebookUrl" placeholder="https://facebook.com/..." />
              </Field>
              <Field icon={<FiYoutube size={13}/>} label="YouTube">
                <input name="youtubeUrl" placeholder="https://youtube.com/..." />
              </Field>
              <Field icon={<FiLinkedin size={13}/>} label="LinkedIn">
                <input name="linkedinUrl" placeholder="https://linkedin.com/..." />
              </Field>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>
                <FiChevronLeft size={16}/> Back
              </button>
              <button type="button" className={styles.nextBtn} onClick={() => { setError(""); setStep(3); }}>
                Plan Setup <FiArrowRight size={16}/>
              </button>
            </div>
          </div>

          {/* STEP 3 */}
          <div className={step === 3 ? styles.stepContent : styles.hidden}>
            <div className={styles.sectionHead}>
              <div className={styles.headIcon}><FiTarget size={19}/></div>
              <div>
                <h2 className={styles.sectionTitle}>Monthly Plan & Kickoff</h2>
                <p className={styles.sectionDesc}>Finalizing the retainer and activation.</p>
              </div>
            </div>
            <div className={styles.grid2}>
              <Field icon={<FaIndianRupeeSign size={11}/>} label="Retainer (₹/mo)">
                <input name="packageAmount" type="number" placeholder="25000" />
              </Field>
              <Field icon={<FiCalendar size={13}/>} label="Start Date">
                <input name="startDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </Field>
            </div>
            <div className={styles.summaryNote}>
              <FiCheckCircle size={14}/>
              <span>Submitting will create the client record and generate portal access credentials.</span>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.backBtn} onClick={() => setStep(2)}>
                <FiChevronLeft size={16}/> Back
              </button>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Launching..." : "Launch Portal"}
              </button>
            </div>
          </div>

        </form>
        <p className={styles.footer}>CreatorMonk OS // v2.0.4 • Secured via Neon DB</p>
      </div>
    </div>
  );
}

function Field({ icon, label, required, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {icon} {label} {required && <span className={styles.req}>*</span>}
      </label>
      <div className={styles.inputWrap}>{children}</div>
    </div>
  );
}

function PasswordField() {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        <FiLock size={13}/> Portal Password <span className={styles.req}>*</span>
      </label>
      <div className={styles.inputWrap}>
        <input
          name="password"
          type={show ? "text" : "password"}
          placeholder="Min 8 characters"
          required
          minLength={8}
          style={{ paddingRight: "40px" }}
        />
        <button type="button" className={styles.eyeBtn} onClick={() => setShow(!show)}>
          {show ? <FiEyeOff size={15}/> : <FiEye size={15}/>}
        </button>
      </div>
    </div>
  );
}