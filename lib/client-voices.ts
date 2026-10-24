export interface ClientVoice {
  id: string;
  name: string;
  brand: string;
  src: string;
  duration: number;
  peaks: number[];
}

// Manually curated, separately approved public copies. Never list the private
// feedback inbox here or automatically publish future submissions.
export const CLIENT_VOICES: ClientVoice[] = [
  {
    id: "hari-om-infotech",
    name: "Viral",
    brand: "Hari Om Infotech",
    src: "/audio/testimonials/hari-om-infotech.m4a",
    duration: 27.07,
    peaks: [
      0.015, 0.007, 0.301, 0.443, 0.527, 0.504, 0.39, 0.282, 0.547, 0.326, 0.188, 0.353,
      0.514, 0.292, 0.22, 0.342, 0.211, 1.0, 0.83, 0.135, 0.058, 0.281, 0.373, 0.262,
      0.155, 0.268, 0.556, 0.474, 0.027, 0.122, 0.363, 0.72, 0.341, 0.084, 0.195, 0.157,
      0.549, 0.657, 0.148, 0.16, 0.126, 0.356, 0.24, 0.195, 0.305, 0.326, 0.095, 0.009,
    ],
  },
  {
    id: "hiccup",
    name: "Hiccup",
    brand: "",
    src: "/audio/testimonials/hiccup.m4a",
    duration: 36.06,
    peaks: [
      0.062, 0.773, 0.55, 0.452, 0.282, 0.371, 0.498, 0.202, 0.148, 0.852, 0.683, 0.107,
      0.25, 0.796, 0.489, 0.159, 0.361, 0.737, 0.747, 0.137, 0.188, 1.0, 0.667, 0.622,
      0.665, 0.658, 0.169, 0.851, 0.565, 0.335, 0.493, 0.029, 0.633, 0.522, 0.386, 0.128,
      0.359, 0.124, 0.314, 0.59, 0.015, 0.433, 0.452, 0.028, 0.415, 0.017, 0.123, 0.285,
    ],
  },
];

export function voiceTime(seconds: number) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export function voiceWaveform(peaks: number[]) {
  const values = peaks.length ? peaks : Array<number>(48).fill(.08);
  const step = 600 / values.length;
  return values.map((value, index) => {
    const height = Math.max(3, Math.min(1, Number.isFinite(value) ? value : 0) * 56);
    return `M${(index * step).toFixed(2)},${((64 - height) / 2).toFixed(2)}h${Math.max(1, step * .45).toFixed(2)}v${height.toFixed(2)}h-${Math.max(1, step * .45).toFixed(2)}Z`;
  }).join("");
}
