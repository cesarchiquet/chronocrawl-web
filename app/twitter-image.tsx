import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ChronoCrawl - Veille concurrentielle automatisée";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at top, rgba(26,26,26,1) 0%, rgba(8,8,8,1) 42%, rgba(0,0,0,1) 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-10% auto auto -8%",
            width: "520px",
            height: "520px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "-90px",
            top: "-120px",
            width: "620px",
            height: "620px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        />

        <div
          style={{
            display: "flex",
            width: "100%",
            padding: "54px",
            gap: "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "62%",
              borderRadius: "34px",
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              padding: "36px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: 800,
                  }}
                >
                  C
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div style={{ fontSize: "18px", color: "rgba(255,255,255,0.68)" }}>
                    Veille concurrentielle
                  </div>
                  <div style={{ fontSize: "30px", fontWeight: 700 }}>
                    ChronoCrawl
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 18px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  fontSize: "18px",
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                Produit live
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              <div
                style={{
                  fontSize: "74px",
                  lineHeight: 0.98,
                  letterSpacing: "-0.05em",
                  fontWeight: 800,
                }}
              >
                Veille concurrentielle qui remonte les vrais changements.
              </div>
              <div
                style={{
                  fontSize: "28px",
                  lineHeight: 1.32,
                  maxWidth: "90%",
                  color: "rgba(255,255,255,0.72)",
                }}
              >
                Surveillance, centre d&apos;alertes et audit SEO dans une interface
                noire, nette et exploitable.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              {["Surveillance", "Centre d’alertes", "Audit SEO"].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "14px 20px",
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    fontSize: "22px",
                    color: "rgba(255,255,255,0.92)",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: "38%",
              borderRadius: "34px",
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              padding: "28px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Centre d’alertes
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                {[
                  { label: "SEO", tone: "rgba(255,255,255,0.08)" },
                  { label: "High", tone: "rgba(255,255,255,0.08)" },
                  { label: "Nouveau", tone: "rgba(255,255,255,0.08)" },
                ].map((badge) => (
                  <div
                    key={badge.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderRadius: "999px",
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: badge.tone,
                      fontSize: "16px",
                      color: "rgba(255,255,255,0.92)",
                      textTransform: "uppercase",
                    }}
                  >
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                marginTop: "22px",
                padding: "22px",
                borderRadius: "28px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.34)",
              }}
            >
              <div
                style={{
                  fontSize: "36px",
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                  fontWeight: 700,
                }}
              >
                Rotation marquée des titres détectée
              </div>
              <div
                style={{
                  fontSize: "20px",
                  color: "rgba(255,255,255,0.62)",
                }}
              >
                Titres visibles • Mise à jour
              </div>
              <div
                style={{
                  fontSize: "20px",
                  color: "rgba(255,255,255,0.74)",
                }}
              >
                https://www.site-concurrent.fr
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                marginTop: "18px",
              }}
            >
              {[
                { label: "URLs", value: "50" },
                { label: "Alertes", value: "143" },
                { label: "Audit", value: "SEO" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    padding: "16px",
                    flex: 1,
                    borderRadius: "22px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.56)" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: "24px", fontWeight: 700 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
