// Version: 1.4
import { useState, useMemo } from "react";
import { Baby, Milk, Clock, Calculator, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const ML_PER_OZ = 29.5735;
const FREQUENCY_OPTIONS = [6, 7, 8, 9, 10, 11, 12];

const STATUS_TONES = {
  green: {
    dot: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]",
    bg: "bg-emerald-50/70",
    border: "border border-emerald-100",
    text: "text-emerald-900",
    label: "text-emerald-600",
  },
  yellow: {
    dot: "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]",
    bg: "bg-amber-50/70",
    border: "border border-amber-100",
    text: "text-amber-900",
    label: "text-amber-600",
  },
  red: {
    dot: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]",
    bg: "bg-red-50/70",
    border: "border border-red-100",
    text: "text-red-900",
    label: "text-red-600",
  },
};

function StatusDot({ status }) {
  return (
    <span
      role="img"
      aria-label={status}
      className={`flex-shrink-0 mt-1 w-3 h-3 rounded-full ${STATUS_TONES[status].dot}`}
    />
  );
}


// Approximate WHO weight-for-age (combined boys/girls average), -2SD..+2SD.
const WHO_STANDARDS = {
  0: { min: 2.5, median: 3.3, max: 4.4 },
  1: { min: 3.4, median: 4.5, max: 5.8 },
  2: { min: 4.4, median: 5.6, max: 7.1 },
  3: { min: 5.1, median: 6.4, max: 8.0 },
  4: { min: 5.6, median: 7.0, max: 8.7 },
  5: { min: 6.1, median: 7.5, max: 9.3 },
  6: { min: 6.4, median: 7.9, max: 9.8 },
  7: { min: 6.7, median: 8.3, max: 10.3 },
  8: { min: 6.9, median: 8.6, max: 10.7 },
  9: { min: 7.1, median: 8.9, max: 11.0 },
  10: { min: 7.4, median: 9.2, max: 11.4 },
  11: { min: 7.6, median: 9.4, max: 11.7 },
  12: { min: 7.7, median: 9.6, max: 12.0 },
  15: { min: 8.3, median: 10.3, max: 12.8 },
  18: { min: 8.8, median: 10.9, max: 13.7 },
  24: { min: 9.7, median: 12.2, max: 15.3 },
};
const WHO_AGES = Object.keys(WHO_STANDARDS).map(Number).sort((a, b) => a - b);

// Parse a raw input string but never collapse blank to 0 in the input itself.
// Returns the numeric value clamped to a safe minimum for math.
function num(raw, min) {
  const n = parseFloat(raw);
  if (Number.isFinite(n) && n > 0) return n;
  return min;
}

export default function EBMCalculator() {
  // Store raw strings so the user can clear the field while typing.
  const [weightInput, setWeightInput] = useState("6");
  const [ageInput, setAgeInput] = useState("4");
  const [perFeedTargetOzInput, setPerFeedTargetOzInput] = useState("4");
  const [frequency, setFrequency] = useState(8);

  const weight = num(weightInput, 1);
  const age = Math.max(0, Math.floor(num(ageInput, 0)));
  const perFeedTargetOz = num(perFeedTargetOzInput, 1);

  const calc = useMemo(() => {
    const totalMl = weight * 150;
    const totalOz = totalMl / ML_PER_OZ;
    const recommendedPerFeedMl = totalMl / frequency;
    const recommendedPerFeedOz = recommendedPerFeedMl / ML_PER_OZ;
    const perFeedTargetMl = perFeedTargetOz * ML_PER_OZ;
    const totalFromTargetMlExact = perFeedTargetMl * frequency;
    const totalFromTargetOzExact = perFeedTargetOz * frequency;
    const interval = 24 / frequency;

    return {
      totalMl: Math.round(totalMl),
      totalMlExact: totalMl,
      totalOz: totalOz.toFixed(1),
      recommendedPerFeedMl: Math.round(recommendedPerFeedMl),
      recommendedPerFeedOz: recommendedPerFeedOz.toFixed(1),
      perFeedMl: Math.round(perFeedTargetMl),
      perFeedMlExact: perFeedTargetMl,
      perFeedOz: perFeedTargetOz.toFixed(1),
      totalFromTargetMl: Math.round(totalFromTargetMlExact),
      totalFromTargetMlExact,
      totalFromTargetOz: totalFromTargetOzExact.toFixed(1),
      interval: interval.toFixed(1),
    };
  }, [weight, perFeedTargetOz, frequency]);

  const schedule = useMemo(() => {
    const times = [];
    const intervalMinutes = (24 / frequency) * 60;
    let current = 6 * 60; // 6:00 AM

    for (let i = 0; i < frequency; i++) {
      const hours = Math.floor(current / 60) % 24;
      const minutes = Math.round(current % 60);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      const displayMins = minutes.toString().padStart(2, "0");
      times.push(`${displayHours}:${displayMins} ${period}`);
      current += intervalMinutes;
    }
    return times;
  }, [frequency]);

  const notes = useMemo(() => {
    const list = [];

    if (age < 4) {
      list.push({
        type: "info",
        text: "Bayi newborn (0-3 bulan): Feed on demand lebih digalakkan. Jadual ni sebagai panduan kasar je.",
      });
    } else if (age <= 6) {
      list.push({
        type: "info",
        text: "Bayi 4-6 bulan: Susu masih makanan utama. Boleh mula introduce solid food selepas 6 bulan.",
      });
    } else {
      list.push({
        type: "info",
        text: "Bayi 6 bulan ke atas: Susu + solid food. Jumlah susu mungkin berkurangan bila intake solid bertambah.",
      });
    }

    if (calc.perFeedMl > 180) {
      list.push({
        type: "warning",
        text: "⚠️ Amaran: Per feed > 180ml. Sila amalkan paced bottle feeding untuk elak overfeeding. Pertimbangkan untuk tambah frequency feeding.",
      });
    }

    if (weight < 3) {
      list.push({
        type: "warning",
        text: "⚠️ Berat bayi rendah. Sila rujuk pediatrician untuk panduan feeding yang sesuai.",
      });
    }

    return list;
  }, [age, weight, calc.perFeedMl]);

  const weightStatus = useMemo(() => {
    let closest = WHO_AGES[0];
    for (const a of WHO_AGES) {
      if (a <= age) closest = a;
    }
    const ref = WHO_STANDARDS[closest] || WHO_STANDARDS[24];

    let status, label, message, color;
    if (weight < ref.min) {
      status = "underweight";
      label = "Berat Rendah";
      color = "red";
      message = `Berat bayi (${weight}kg) di bawah julat normal untuk umur ${age} bulan (${ref.min}-${ref.max}kg). Sila rujuk pediatrician segera.`;
    } else if (weight > ref.max) {
      status = "overweight";
      label = "Berat Tinggi";
      color = "amber";
      message = `Berat bayi (${weight}kg) di atas julat normal untuk umur ${age} bulan (${ref.min}-${ref.max}kg). Sila rujuk pediatrician.`;
    } else {
      status = "normal";
      label = "Berat Normal";
      color = "emerald";
      message = `Berat bayi (${weight}kg) dalam julat sihat untuk umur ${age} bulan (${ref.min}-${ref.max}kg). Median: ${ref.median}kg.`;
    }

    return { status, label, message, color, ref };
  }, [weight, age]);

  const feedingSuitability = useMemo(() => {
    const checks = [];

    // Frequency check — yellow if outside age-typical range, green otherwise.
    if (age < 2 && frequency < 8) {
      checks.push({
        status: "yellow",
        text: `Newborn biasanya perlu 8-12x feeding sehari. ${frequency}x mungkin terlalu sedikit.`,
      });
    } else if (age >= 6 && frequency > 8) {
      checks.push({
        status: "yellow",
        text: `Bayi ${age} bulan biasanya 5-7x feeding je dah cukup (sebab dah makan solid).`,
      });
    } else {
      checks.push({
        status: "green",
        text: `Kekerapan ${frequency}x sehari sesuai untuk umur ${age} bulan.`,
      });
    }

    // Per-feed volume — red if dangerous (>180ml), yellow if low for newborn, green otherwise.
    if (calc.perFeedMlExact > 180) {
      checks.push({
        status: "red",
        text: `Per feed ${calc.perFeedOz}oz (${calc.perFeedMl}ml) terlalu banyak. Risiko overfeeding — guna paced bottle feeding atau tambah frequency.`,
      });
    } else if (calc.perFeedMlExact < 60 && age < 6) {
      checks.push({
        status: "yellow",
        text: `Per feed ${calc.perFeedOz}oz (${calc.perFeedMl}ml) terlalu sedikit untuk bayi ini. Kurangkan frequency atau tambah volume.`,
      });
    } else {
      checks.push({
        status: "green",
        text: `Volume per feed (${calc.perFeedOz}oz / ${calc.perFeedMl}ml) dalam julat sesuai.`,
      });
    }

    // Total-intake — green ≤10%, yellow 10-25%, red >25% off requirement.
    const requiredMl = weight * 150;
    const requiredOz = (requiredMl / ML_PER_OZ).toFixed(1);
    const actualMl = calc.totalFromTargetMlExact;
    const diffPercent = ((actualMl - requiredMl) / requiredMl) * 100;
    const absDiff = Math.abs(diffPercent);
    const direction = diffPercent < 0 ? "kurang" : "lebih";
    const action = diffPercent < 0 ? "Tambah volume atau frequency." : "Kurangkan volume atau frequency.";

    if (absDiff <= 10) {
      checks.push({
        status: "green",
        text: `Total intake (${calc.totalFromTargetOz}oz / ${calc.totalFromTargetMl}ml) menepati keperluan harian (${requiredOz}oz / ${Math.round(requiredMl)}ml).`,
      });
    } else if (absDiff <= 25) {
      checks.push({
        status: "yellow",
        text: `Total intake (${calc.totalFromTargetOz}oz / ${calc.totalFromTargetMl}ml) ${direction} ${Math.round(absDiff)}% dari keperluan (${requiredOz}oz / ${Math.round(requiredMl)}ml). ${action}`,
      });
    } else {
      checks.push({
        status: "red",
        text: `Total intake (${calc.totalFromTargetOz}oz / ${calc.totalFromTargetMl}ml) ${direction} ${Math.round(absDiff)}% dari keperluan (${requiredOz}oz / ${Math.round(requiredMl)}ml) — perbezaan besar. ${action}`,
      });
    }

    return checks;
  }, [weight, age, frequency, calc]);

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative bubbles */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-72 h-72 rounded-full bg-pink-100/60 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-20 w-80 h-80 rounded-full bg-rose-100/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-pink-50 blur-3xl" />

      <div className="max-w-3xl mx-auto relative">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-100 to-rose-200 rounded-full mb-4 shadow-lg shadow-pink-200/50 ring-4 ring-white">
            <Baby className="w-8 h-8 text-pink-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-pink-600 tracking-tight">
            Kalkulator Susu Bayi 🍼
          </h1>
          <p className="text-sm text-pink-400 mt-2 font-medium">
            Kira keperluan susu harian bayi dengan lembut & tepat
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-pink-200/40 border border-pink-100 p-6 sm:p-7 mb-5">
          <h2 className="text-xs font-bold text-pink-500 mb-4 uppercase tracking-widest">
            ✿ Maklumat Bayi
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="ebm-weight" className="block text-sm font-semibold text-pink-700 mb-2">
                Berat Bayi (kg)
              </label>
              <input
                id="ebm-weight"
                type="number"
                step="0.1"
                min="1"
                max="20"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-full px-4 py-3 bg-pink-50/60 border-2 border-pink-100 rounded-2xl focus:ring-4 focus:ring-pink-200 focus:border-pink-300 focus:bg-white outline-none text-pink-900 font-medium transition-all"
              />
            </div>
            <div>
              <label htmlFor="ebm-age" className="block text-sm font-semibold text-pink-700 mb-2">
                Umur (bulan)
              </label>
              <input
                id="ebm-age"
                type="number"
                step="1"
                min="0"
                max="24"
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                className="w-full px-4 py-3 bg-pink-50/60 border-2 border-pink-100 rounded-2xl focus:ring-4 focus:ring-pink-200 focus:border-pink-300 focus:bg-white outline-none text-pink-900 font-medium transition-all"
              />
            </div>
          </div>

          {/* Volume Per Feed */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="ebm-perfeed" className="text-sm font-semibold text-pink-700">
                Volume Per Feed
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="ebm-perfeed"
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={perFeedTargetOzInput}
                  onChange={(e) => setPerFeedTargetOzInput(e.target.value)}
                  className="w-20 px-3 py-1.5 bg-pink-50/60 border-2 border-pink-100 rounded-full text-sm text-right font-semibold text-pink-700 focus:ring-4 focus:ring-pink-200 focus:border-pink-300 focus:bg-white outline-none transition-all"
                />
                <span className="text-sm text-pink-500 font-medium">oz</span>
              </div>
            </div>
            <input
              type="range"
              aria-label="Volume per feed slider"
              min="1"
              max="10"
              step="0.5"
              value={perFeedTargetOz}
              onChange={(e) => setPerFeedTargetOzInput(e.target.value)}
              className="w-full h-3 bg-pink-100 rounded-full appearance-none cursor-pointer accent-pink-400"
            />
            <div className="flex justify-between text-xs mt-2">
              <span className="text-pink-300 font-medium">1oz</span>
              <span className="text-pink-500 font-bold">
                Disyorkan: {calc.recommendedPerFeedOz}oz
                <span className="text-pink-300 font-normal"> ({calc.recommendedPerFeedMl}ml)</span>
              </span>
              <span className="text-pink-300 font-medium">10oz</span>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-semibold text-pink-700 mb-2">
              Kekerapan Feeding / Hari
            </label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {FREQUENCY_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`py-3 rounded-2xl font-bold text-sm transition-all ${
                    frequency === f
                      ? "bg-gradient-to-br from-pink-400 to-rose-400 text-white shadow-lg shadow-pink-300/50 scale-105"
                      : "bg-pink-50 text-pink-500 hover:bg-pink-100 hover:scale-105"
                  }`}
                >
                  {f}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Weight Status */}
        <div className={`rounded-[2rem] border-2 p-6 mb-5 shadow-lg ${
          weightStatus.color === "emerald" ? "bg-emerald-50/70 border-emerald-200 shadow-emerald-200/30" :
          weightStatus.color === "amber" ? "bg-amber-50/70 border-amber-200 shadow-amber-200/30" :
          "bg-red-50/70 border-red-200 shadow-red-200/30"
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {weightStatus.status === "normal" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : weightStatus.status === "overweight" ? (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-semibold text-sm ${
                  weightStatus.color === "emerald" ? "text-emerald-900" :
                  weightStatus.color === "amber" ? "text-amber-900" :
                  "text-red-900"
                }`}>
                  Status Berat: {weightStatus.label}
                </h3>
                <span className="text-xs text-slate-500">WHO Standard</span>
              </div>
              <p className={`text-sm ${
                weightStatus.color === "emerald" ? "text-emerald-800" :
                weightStatus.color === "amber" ? "text-amber-800" :
                "text-red-800"
              }`}>
                {weightStatus.message}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white/60 rounded-lg p-2 text-center">
                  <div className="text-slate-500">Min</div>
                  <div className="font-semibold text-slate-900">{weightStatus.ref.min}kg</div>
                </div>
                <div className="bg-white/60 rounded-lg p-2 text-center">
                  <div className="text-slate-500">Median</div>
                  <div className="font-semibold text-slate-900">{weightStatus.ref.median}kg</div>
                </div>
                <div className="bg-white/60 rounded-lg p-2 text-center">
                  <div className="text-slate-500">Max</div>
                  <div className="font-semibold text-slate-900">{weightStatus.ref.max}kg</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Anggaran purata WHO 0–24 bulan. Untuk penilaian tepat, rujuk pediatrician.
              </p>
            </div>
          </div>
        </div>

        {/* Feeding Suitability */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-pink-200/40 border border-pink-100 p-6 sm:p-7 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-bold text-pink-500 uppercase tracking-widest">
              ✿ Kesesuaian Feeding
            </h2>
          </div>
          <div className="space-y-2">
            {feedingSuitability.map((check, i) => {
              const tone = STATUS_TONES[check.status];
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-4 rounded-2xl text-sm ${tone.bg} ${tone.border}`}
                >
                  <StatusDot status={check.status} />
                  <span className={tone.text}>{check.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <MetricCard
            icon={<Milk className="w-4 h-4" />}
            label="Keperluan Sehari"
            value={`${calc.totalOz} oz`}
            sub={`${calc.totalMl} ml`}
            color="pink"
          />
          <MetricCard
            icon={<Calculator className="w-4 h-4" />}
            label="Total Intake"
            value={`${calc.totalFromTargetOz} oz`}
            sub={`${calc.totalFromTargetMl} ml`}
            color="rose"
          />
          <MetricCard
            icon={<Milk className="w-4 h-4" />}
            label="Per Feed"
            value={`${calc.perFeedOz} oz`}
            sub={`${calc.perFeedMl} ml`}
            color="peach"
          />
          <MetricCard
            icon={<Clock className="w-4 h-4" />}
            label="Interval"
            value={`${calc.interval}j`}
            sub="setiap feeding"
            color="lavender"
          />
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-pink-200/40 border border-pink-100 p-6 sm:p-7 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs font-bold text-pink-500 uppercase tracking-widest">
              ✿ Jadual Feeding
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {schedule.map((time, i) => (
              <div
                key={i}
                className="px-4 py-2 bg-gradient-to-br from-pink-100 to-rose-100 border border-pink-200 rounded-full text-sm font-semibold text-pink-600 shadow-sm"
              >
                {time}
              </div>
            ))}
          </div>
          <p className="text-xs text-pink-400 mt-4 font-medium">
            🌸 Bermula 6:00 AM • Setiap {calc.interval} jam
          </p>
        </div>

        {/* Notes */}
        {notes.length > 0 && (
          <div className="bg-white rounded-[2rem] shadow-xl shadow-pink-200/40 border border-pink-100 p-6 sm:p-7 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-bold text-pink-500 uppercase tracking-widest">
                ✿ Nota & Panduan
              </h2>
            </div>
            <div className="space-y-2">
              {notes.map((note, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-2xl text-sm ${
                    note.type === "warning"
                      ? "bg-amber-50/70 border border-amber-200 text-amber-900"
                      : "bg-pink-50/70 border border-pink-200 text-pink-800"
                  }`}
                >
                  {note.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-center text-pink-400 mt-8 font-medium">
          🌸 Formula: Berat (kg) × 150ml. Panduan ni sebagai rujukan kasar je —
          sila rujuk pediatrician untuk nasihat khusus.
        </p>
        <p className="text-xs text-center text-pink-300 mt-2 font-semibold">v1.4</p>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, color }) {
  const colors = {
    pink: "bg-gradient-to-br from-pink-100 to-pink-200 text-pink-600",
    rose: "bg-gradient-to-br from-rose-100 to-rose-200 text-rose-600",
    peach: "bg-gradient-to-br from-orange-100 to-pink-100 text-orange-500",
    lavender: "bg-gradient-to-br from-purple-100 to-pink-100 text-purple-500",
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg shadow-pink-200/30 border border-pink-100 p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-2 rounded-2xl ${colors[color]}`}>{icon}</div>
        <span className="text-xs font-bold text-pink-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-2xl font-extrabold text-pink-700">{value}</div>
      <div className="text-xs text-pink-400 mt-0.5 font-medium">{sub}</div>
    </div>
  );
}
