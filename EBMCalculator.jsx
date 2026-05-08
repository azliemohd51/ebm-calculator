// Version: 1.1
import { useState, useMemo } from "react";
import { Baby, Milk, Clock, Calculator, Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const ML_PER_OZ = 29.5735;
const FREQUENCY_OPTIONS = [6, 7, 8, 9, 10, 11, 12];

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

    if (age < 2 && frequency < 8) {
      checks.push({
        ok: false,
        text: `Newborn biasanya perlu 8-12x feeding sehari. ${frequency}x mungkin terlalu sedikit.`,
      });
    } else if (age >= 6 && frequency > 8) {
      checks.push({
        ok: false,
        text: `Bayi ${age} bulan biasanya 5-7x feeding je dah cukup (sebab dah makan solid).`,
      });
    } else {
      checks.push({
        ok: true,
        text: `Kekerapan ${frequency}x sehari sesuai untuk umur ${age} bulan.`,
      });
    }

    if (calc.perFeedMlExact > 180) {
      checks.push({
        ok: false,
        text: `Per feed ${calc.perFeedOz}oz (${calc.perFeedMl}ml) terlalu banyak. Tambah frequency atau guna paced feeding.`,
      });
    } else if (calc.perFeedMlExact < 60 && age < 6) {
      checks.push({
        ok: false,
        text: `Per feed ${calc.perFeedOz}oz (${calc.perFeedMl}ml) terlalu sedikit untuk bayi ini. Kurangkan frequency atau tambah volume.`,
      });
    } else {
      checks.push({
        ok: true,
        text: `Volume per feed (${calc.perFeedOz}oz / ${calc.perFeedMl}ml) dalam julat sesuai.`,
      });
    }

    const requiredMl = weight * 150;
    const requiredOz = (requiredMl / ML_PER_OZ).toFixed(1);
    const actualMl = calc.totalFromTargetMlExact;
    const diffPercent = ((actualMl - requiredMl) / requiredMl) * 100;

    if (Math.abs(diffPercent) <= 10) {
      checks.push({
        ok: true,
        text: `Total intake (${calc.totalFromTargetOz}oz / ${calc.totalFromTargetMl}ml) menepati keperluan harian (${requiredOz}oz / ${Math.round(requiredMl)}ml).`,
      });
    } else if (diffPercent < 0) {
      checks.push({
        ok: false,
        text: `Total intake (${calc.totalFromTargetOz}oz / ${calc.totalFromTargetMl}ml) kurang ${Math.abs(Math.round(diffPercent))}% dari keperluan (${requiredOz}oz / ${Math.round(requiredMl)}ml). Tambah volume atau frequency.`,
      });
    } else {
      checks.push({
        ok: false,
        text: `Total intake (${calc.totalFromTargetOz}oz / ${calc.totalFromTargetMl}ml) lebih ${Math.round(diffPercent)}% dari keperluan (${requiredOz}oz / ${Math.round(requiredMl)}ml). Kurangkan volume atau frequency.`,
      });
    }

    return checks;
  }, [weight, age, frequency, calc]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
            <Baby className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Kalkulator Susu Bayi / EBM
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Kira keperluan susu harian bayi dengan tepat
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
            Maklumat Bayi
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label htmlFor="ebm-weight" className="block text-sm font-medium text-slate-700 mb-2">
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
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="ebm-age" className="block text-sm font-medium text-slate-700 mb-2">
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
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900"
              />
            </div>
          </div>

          {/* Volume Per Feed */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="ebm-perfeed" className="text-sm font-medium text-slate-700">
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
                  className="w-20 px-2 py-1 border border-slate-300 rounded-md text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <span className="text-sm text-slate-600">oz</span>
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
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>1oz</span>
              <span className="text-blue-600 font-medium">
                Disyorkan: {calc.recommendedPerFeedOz}oz
                <span className="text-slate-400"> ({calc.recommendedPerFeedMl}ml)</span>
              </span>
              <span>10oz</span>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Kekerapan Feeding / Hari
            </label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {FREQUENCY_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`py-2.5 rounded-lg font-medium text-sm transition-all ${
                    frequency === f
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {f}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Weight Status */}
        <div className={`rounded-2xl border p-5 mb-5 ${
          weightStatus.color === "emerald" ? "bg-emerald-50 border-emerald-200" :
          weightStatus.color === "amber" ? "bg-amber-50 border-amber-200" :
          "bg-red-50 border-red-200"
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Kesesuaian Feeding
            </h2>
          </div>
          <div className="space-y-2">
            {feedingSuitability.map((check, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                  check.ok
                    ? "bg-emerald-50 border border-emerald-100"
                    : "bg-amber-50 border border-amber-100"
                }`}
              >
                {check.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <span className={check.ok ? "text-emerald-900" : "text-amber-900"}>
                  {check.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <MetricCard
            icon={<Milk className="w-4 h-4" />}
            label="Keperluan Sehari"
            value={`${calc.totalOz} oz`}
            sub={`${calc.totalMl} ml`}
            color="blue"
          />
          <MetricCard
            icon={<Calculator className="w-4 h-4" />}
            label="Total Intake"
            value={`${calc.totalFromTargetOz} oz`}
            sub={`${calc.totalFromTargetMl} ml`}
            color="emerald"
          />
          <MetricCard
            icon={<Milk className="w-4 h-4" />}
            label="Per Feed"
            value={`${calc.perFeedOz} oz`}
            sub={`${calc.perFeedMl} ml`}
            color="amber"
          />
          <MetricCard
            icon={<Clock className="w-4 h-4" />}
            label="Interval"
            value={`${calc.interval}j`}
            sub="setiap feeding"
            color="violet"
          />
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Jadual Feeding
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {schedule.map((time, i) => (
              <div
                key={i}
                className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm font-medium text-blue-700"
              >
                {time}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Bermula 6:00 AM • Setiap {calc.interval} jam
          </p>
        </div>

        {/* Notes */}
        {notes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Nota & Panduan
              </h2>
            </div>
            <div className="space-y-2">
              {notes.map((note, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-sm ${
                    note.type === "warning"
                      ? "bg-amber-50 border border-amber-200 text-amber-900"
                      : "bg-blue-50 border border-blue-200 text-blue-900"
                  }`}
                >
                  {note.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-center text-slate-500 mt-6">
          Formula: Berat (kg) × 150ml. Panduan ni sebagai rujukan kasar je —
          sila rujuk pediatrician untuk nasihat khusus.
        </p>
        <p className="text-xs text-center text-slate-400 mt-2">v1.1</p>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, sub, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-md ${colors[color]}`}>{icon}</div>
        <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
}
