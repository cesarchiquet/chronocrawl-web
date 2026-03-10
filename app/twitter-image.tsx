import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ChronoCrawl - Surveille tes concurrents automatiquement";
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
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background:
            "radial-gradient(circle at top, #1a1a1a 0%, #080808 44%, #000000 100%)",
          color: "white",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 24,
            borderRadius: 34,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: -80,
            top: 80,
            width: 520,
            height: 520,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.02)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -140,
            top: -120,
            width: 640,
            height: 640,
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(255,255,255,0.02)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 42,
            top: 42,
            width: 360,
            height: 546,
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.12)",
            background:
              "linear-gradient(180deg, rgba(28,28,30,0.96), rgba(8,8,8,0.98))",
            padding: 22,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 14, height: 14, borderRadius: 999, background: "#ff5f57" }} />
            <div style={{ width: 14, height: 14, borderRadius: 999, background: "#febc2e" }} />
            <div style={{ width: 14, height: 14, borderRadius: 999, background: "#28c840" }} />
          </div>
          <div
            style={{
              height: 54,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
              display: "flex",
              alignItems: "center",
              padding: "0 18px",
              color: "rgba(255,255,255,0.72)",
              fontSize: 19,
              marginBottom: 18,
            }}
          >
            Recherche
          </div>
          <div
            style={{
              borderRadius: 20,
              background: "#1890ff",
              padding: 18,
              display: "flex",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 999,
                background: "rgba(255,255,255,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              C
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                Surveiller un site concurrent
              </div>
              <div style={{ fontSize: 16, color: "rgba(255,255,255,0.84)" }}>
                Site web : chronocrawl.com
              </div>
            </div>
          </div>
          {[
            ["Bibouz", "Ok top", "hier"],
            ["Carla", "Ça va bb ?", "hier"],
            ["Leo Gillis", "Rappelle moi quand tu peux stp", "jeudi"],
            ["mellerenelle@aol.com", "Ajoute un j'aime sur le lien", "jeudi"],
          ].map(([name, text, day]) => (
            <div
              key={name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                padding: "18px 4px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ display: "flex", gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    background: "rgba(145,124,255,0.48)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{name}</div>
                  <div style={{ fontSize: 15, color: "rgba(255,255,255,0.68)" }}>
                    {text}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 15, color: "rgba(255,255,255,0.64)" }}>{day}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: 430,
            top: 74,
            width: 698,
            height: 248,
            borderRadius: 28,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            background:
              "linear-gradient(180deg, rgba(36,36,40,0.94), rgba(10,10,10,0.98))",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 72% 18%, rgba(131,118,255,0.22) 0%, rgba(131,118,255,0) 36%), radial-gradient(circle at 30% 0%, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 28%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -26,
              top: -18,
              width: 310,
              height: 310,
              borderRadius: 999,
              border: "2px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.02)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 34,
              top: 42,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              maxWidth: 380,
            }}
          >
            <div
              style={{
                fontSize: 62,
                lineHeight: 0.95,
                letterSpacing: "-0.07em",
                fontWeight: 800,
                whiteSpace: "pre-wrap",
              }}
            >
              {"Surveille tes concurrents\nautomatiquement"}
            </div>
            <div
              style={{
                fontSize: 22,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              Détection de changements en temps réel
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 70,
              background: "rgba(88,88,92,0.92)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 24px",
              gap: 2,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              Surveiller un site concurrent
            </div>
            <div style={{ fontSize: 18, color: "rgba(255,255,255,0.72)" }}>
              chronocrawl.com
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 734,
            top: 354,
            width: 398,
            height: 226,
            borderRadius: 26,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.12)",
            background:
              "linear-gradient(180deg, rgba(36,36,40,0.94), rgba(10,10,10,0.98))",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 72% 18%, rgba(131,118,255,0.20) 0%, rgba(131,118,255,0) 36%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: -22,
              top: -14,
              width: 250,
              height: 250,
              borderRadius: 999,
              border: "2px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.02)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 24,
              top: 28,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              maxWidth: 220,
            }}
          >
            <div
              style={{
                fontSize: 40,
                lineHeight: 0.96,
                letterSpacing: "-0.06em",
                fontWeight: 800,
                whiteSpace: "pre-wrap",
              }}
            >
              {"Surveille tes concurrents\nautomatiquement"}
            </div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.76)" }}>
              Détection de changements en temps réel
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 58,
              background: "rgba(88,88,92,0.92)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 18px",
              gap: 2,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              Surveiller un site concurrent
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.72)" }}>
              chronocrawl.com
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
