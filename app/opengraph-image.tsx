import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ChronoCrawl - Surveille tes concurrents automatiquement";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function WatchFace({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        right: "-12%",
        top: "-10%",
        width,
        height,
        borderRadius: "999px",
        border: "2px solid rgba(255,255,255,0.22)",
        background:
          "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.03) 0%, rgba(12,12,12,0.86) 58%, rgba(0,0,0,0.96) 100%)",
        boxShadow:
          "inset 0 0 0 10px rgba(255,255,255,0.04), inset 0 0 0 22px rgba(255,255,255,0.03)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {Array.from({ length: 12 }).map((_, index) => {
        const angle = (index / 12) * Math.PI * 2;
        const x = Math.cos(angle) * (width * 0.34);
        const y = Math.sin(angle) * (height * 0.34);

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              width: index % 3 === 0 ? 5 : 3,
              height: index % 3 === 0 ? 34 : 22,
              borderRadius: "999px",
              background: "rgba(255,255,255,0.30)",
              transform: `translate(${x}px, ${y}px) rotate(${angle}rad)`,
            }}
          />
        );
      })}
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "999px",
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 0 24px rgba(255,255,255,0.28)",
        }}
      />
    </div>
  );
}

function PreviewCard({
  width,
  height,
  offsetX,
  offsetY,
  rotate = 0,
  compact = false,
}: {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  rotate?: number;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: offsetX,
        top: offsetY,
        width,
        height,
        borderRadius: 26,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.12)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        transform: `rotate(${rotate}deg)`,
        boxShadow: "0 22px 60px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 35% 15%, rgba(112,101,255,0.18) 0%, rgba(44,44,44,0) 40%), radial-gradient(circle at 100% 0%, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 40%), linear-gradient(180deg, rgba(30,30,30,0.96) 0%, rgba(8,8,8,0.98) 100%)",
        }}
      />
      <WatchFace width={compact ? 220 : 280} height={compact ? 220 : 280} />
      <div
        style={{
          position: "absolute",
          left: compact ? 26 : 34,
          top: compact ? 34 : 48,
          display: "flex",
          flexDirection: "column",
          gap: compact ? 6 : 8,
          maxWidth: compact ? "62%" : "58%",
        }}
      >
        <div
          style={{
            fontSize: compact ? 42 : 56,
            lineHeight: 0.98,
            letterSpacing: "-0.06em",
            fontWeight: 800,
            color: "white",
            whiteSpace: "pre-wrap",
          }}
        >
          {"Surveille tes concurrents\nautomatiquement"}
        </div>
        <div
          style={{
            fontSize: compact ? 16 : 20,
            color: "rgba(255,255,255,0.78)",
            lineHeight: 1.2,
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
          height: compact ? 58 : 72,
          background: "rgba(88,88,92,0.92)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: compact ? "0 18px" : "0 22px",
          gap: 2,
        }}
      >
        <div
          style={{
            fontSize: compact ? 16 : 20,
            fontWeight: 700,
            color: "white",
          }}
        >
          Surveiller un site concurrent
        </div>
        <div
          style={{
            fontSize: compact ? 14 : 18,
            color: "rgba(255,255,255,0.72)",
          }}
        >
          chronocrawl.com
        </div>
      </div>
    </div>
  );
}

export default function OpenGraphImage() {
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
            "radial-gradient(circle at top, rgba(34,34,34,1) 0%, rgba(9,9,9,1) 42%, rgba(0,0,0,1) 100%)",
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
            left: 36,
            top: 36,
            width: 360,
            height: 558,
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.12)",
            background:
              "linear-gradient(180deg, rgba(29,29,31,0.96), rgba(10,10,10,0.98))",
            boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
            display: "flex",
            flexDirection: "column",
            padding: "20px 20px 18px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "999px",
                background: "#ff5f57",
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "999px",
                background: "#febc2e",
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "999px",
                background: "#28c840",
              }}
            />
          </div>
          <div
            style={{
              width: "100%",
              height: 54,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.03)",
              display: "flex",
              alignItems: "center",
              padding: "0 18px",
              color: "rgba(255,255,255,0.72)",
              fontSize: 20,
              marginBottom: 16,
            }}
          >
            Recherche
          </div>
          <div
            style={{
              width: "100%",
              borderRadius: 20,
              background: "#1890ff",
              padding: "18px 18px 16px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: "999px",
                background: "rgba(255,255,255,0.22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                color: "white",
                fontWeight: 700,
              }}
            >
              C
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                Surveiller un site concurrent
              </div>
              <div style={{ fontSize: 16, color: "rgba(255,255,255,0.84)" }}>
                Site web : chronocrawl.com
              </div>
            </div>
          </div>
          {[
            { name: "Bibouz", text: "Ok top", day: "hier" },
            { name: "Carla", text: "Ca va bb?", day: "hier" },
            { name: "Leo Gillis", text: "Rappelle moi quand tu peux stp", day: "jeudi" },
            { name: "mellerenelle@aol.com", text: "Ajoute un j'aime sur le lien", day: "jeudi" },
          ].map((row) => (
            <div
              key={row.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                padding: "18px 6px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "999px",
                    background: "rgba(145,124,255,0.48)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    color: "white",
                    fontWeight: 700,
                  }}
                >
                  {row.name.charAt(0).toUpperCase()}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 17,
                      color: "white",
                      fontWeight: 700,
                    }}
                  >
                    {row.name}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      color: "rgba(255,255,255,0.68)",
                    }}
                  >
                    {row.text}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.66)",
                }}
              >
                {row.day}
              </div>
            </div>
          ))}
        </div>

        <PreviewCard width={430} height={270} offsetX={410} offsetY={86} />
        <PreviewCard width={390} height={244} offsetX={738} offsetY={316} compact rotate={1.5} />
        <PreviewCard width={366} height={230} offsetX={408} offsetY={410} compact rotate={-1.3} />
      </div>
    ),
    size
  );
}
