#!/usr/bin/env python3
"""Reproduce the portfolio's synthetic recording-comparison example.

Python 3.9+; standard library only. No recordings or client code are used.
Run: python recording-comparison-demo.py --output-dir demo-output
Writes a CSV, SVG plot and plain-text methods/report to the output directory.
"""

import argparse
import csv
import math
from pathlib import Path

SAMPLE_RATE_HZ = 8000
DURATION_S = 2
FREQUENCIES_HZ = (100, 1000, 3000)
CONDITIONS = (
    ("A", "Baseline", (0.20, 0.10, 0.00)),
    ("B", "More 100 Hz", (0.40, 0.10, 0.00)),
    ("C", "Half amplitude", (0.10, 0.05, 0.00)),
    ("D", "Added 3000 Hz", (0.20, 0.10, 0.05)),
)


def analyse(amplitudes):
    """Mean-square level and power in the exact coherent 100-Hz DFT bin."""
    count = SAMPLE_RATE_HZ * DURATION_S
    samples = [
        sum(amplitude * math.sin(2 * math.pi * frequency * n / SAMPLE_RATE_HZ)
            for frequency, amplitude in zip(FREQUENCIES_HZ, amplitudes))
        for n in range(count)
    ]
    mean_square = math.fsum(value * value for value in samples) / count
    # Both quadratures make the bin-power estimate independent of tone phase.
    angle = 2 * math.pi * FREQUENCIES_HZ[0] / SAMPLE_RATE_HZ
    sine_projection = math.fsum(value * math.sin(angle * n)
                                for n, value in enumerate(samples)) / count
    cosine_projection = math.fsum(value * math.cos(angle * n)
                                  for n, value in enumerate(samples)) / count
    power_100_hz = 2 * (sine_projection ** 2 + cosine_projection ** 2)
    rms = math.sqrt(mean_square)
    dbfs = 20 * math.log10(rms)  # Reference: digital amplitude 1, not 1/sqrt(2).
    share_percent = 100 * power_100_hz / mean_square
    return rms, dbfs, share_percent, max(abs(value) for value in samples)


def make_svg(results):
    """A standalone plotted output; numeric results also appear in the CSV."""
    pieces = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="580" '
        'viewBox="0 0 960 580" role="img" aria-labelledby="title desc">',
        '<title id="title">Synthetic recording comparison: level and tone-power share</title>',
        '<desc id="desc">Four generated two-second mono conditions, with digital RMS level '
        'and the percentage of mean-square power in the exact 100 Hz DFT bin. '
        'A halved amplitude changes level but preserves the tone-power fraction.</desc>',
        '<rect width="960" height="580" fill="#f5f5f2"/>',
        '<g font-family="Arial,Helvetica,sans-serif" fill="#192321">',
        '<text x="50" y="50" font-size="27" font-weight="700">A controlled recording-comparison example</text>',
        '<text x="50" y="84" font-size="19" fill="#526059">Synthetic mono tones · 8,000 samples/s · 2 seconds · no client recordings</text>',
        '<text x="50" y="135" font-size="19" font-weight="700">Digital RMS level (dBFS)</text>',
        '<text x="545" y="135" font-size="19" font-weight="700">100 Hz power / total power</text>',
    ]
    for level in (-30, -20, -10, 0):
        x = 180 + (level + 30) / 30 * 270
        pieces.append(f'<path d="M{x:.2f} 154V430" stroke="#d6dcd7"/>')
        pieces.append(f'<text x="{x:.2f}" y="455" text-anchor="middle" font-size="17">{level}</text>')
    for share in (0, 50, 100):
        x = 545 + share / 100 * 300
        pieces.append(f'<path d="M{x:.2f} 154V430" stroke="#d6dcd7"/>')
        pieces.append(f'<text x="{x:.2f}" y="455" text-anchor="middle" font-size="17">{share}%</text>')
    for i, item in enumerate(results):
        y = 178 + 64 * i
        level_width = (item["dbfs"] + 30) / 30 * 270
        share_width = item["share"] / 100 * 300
        pieces.extend((
            f'<text x="50" y="{y + 12}" font-size="18" font-weight="700">{item["id"]}</text>',
            f'<text x="50" y="{y + 34}" font-size="16">{item["name"]}</text>',
            f'<rect x="180" y="{y}" width="{level_width:.2f}" height="28" fill="#244ec3"/>',
            f'<text x="{180 + level_width + 8:.2f}" y="{y + 20}" font-size="17">{item["dbfs"]:.2f}</text>',
            f'<rect x="545" y="{y}" width="{share_width:.2f}" height="28" fill="#704260"/>',
            f'<text x="{545 + share_width + 8:.2f}" y="{y + 20}" font-size="17">{item["share"]:.2f}%</text>',
        ))
    pieces.extend((
        '<text x="50" y="500" font-size="19">C is 6.02 dB below A, with the same 100 Hz power fraction.</text>',
        '<text x="50" y="534" font-size="17" fill="#526059">Defined digital levels; not sound-pressure levels, loudness or hardware-performance measurements.</text>',
        '</g></svg>\n',
    ))
    return "\n".join(pieces)


def make_report(results):
    lines = [
        "ZAFAR AHMAD — SYNTHETIC RECORDING-COMPARISON DEMONSTRATION",
        "Independently authored portfolio example; created 10 October 2026.",
        "This example uses no client recordings, report content, software or model weights.",
        "",
        "INPUT AND CONTROLS",
        "Each input is a two-second mono floating-point signal at 8,000 samples/s (16,000 samples).",
        "x[n] = sum(a_f * sin(2*pi*f*n/8000)) for f in {100, 1000, 3000} Hz.",
        "All tones start at zero phase. Sample rate, duration and tone frequencies are fixed.",
        "There is no randomness, normalisation, filtering, resampling, clipping or added noise.",
        "All frequencies complete an integer number of cycles over the record.",
        "",
        "METRIC DEFINITIONS",
        "RMS = sqrt(sum(x[n]^2)/N), in normalised digital-amplitude units.",
        "Level (dBFS) = 20*log10(RMS), with digital amplitude 1 as the reference.",
        "Under this convention a full-amplitude sine has -3.0103 dBFS RMS level.",
        "100 Hz bin power = 2*((sum(x[n]*sin(2*pi*100*n/fs))/N)^2",
        "                      +(sum(x[n]*cos(2*pi*100*n/fs))/N)^2).",
        "100 Hz power fraction (%) = 100*100 Hz bin power/(sum(x[n]^2)/N).",
        "The coherent rectangular-record projection needs no window correction in this example.",
        "This is one exact frequency-bin fraction, not a general low-frequency band metric.",
        "",
        "COMPUTED RESULTS",
        "ID | Tone amplitudes at 100/1000/3000 Hz | RMS | dBFS | 100 Hz power fraction",
    ]
    for item in results:
        amps = "/".join(f"{amp:.2f}" for amp in item["amplitudes"])
        lines.append(f'{item["id"]} | {amps} | {item["rms"]:.6f} | '
                     f'{item["dbfs"]:.2f} | {item["share"]:.2f}%')
    lines.extend((
        "",
        "READING THE COMPARISON",
        "A is the baseline. B doubles only the 100 Hz component. C halves both baseline components.",
        "D adds a 3000 Hz component. The table separates digital level from relative spectral composition.",
        f'C is {results[0]["dbfs"] - results[2]["dbfs"]:.2f} dB below A; both have '
        f'{results[0]["share"]:.2f}% of their power in the 100 Hz bin.',
        "Known generation conditions explain these differences; they do not establish a hardware effect.",
        "",
        "REPRODUCE",
        "Use Python 3.9 or later; no third-party dependencies are required.",
        "python recording-comparison-demo.py --output-dir demo-output",
        "The command generates recording-comparison-demo.csv, recording-comparison-demo.svg,",
        "and recording-comparison-demo.txt. Displayed results are rounded; calculations use floats.",
        "",
        "LIMITS",
        "This teaching/report example does not recreate the private 156-condition accessory study.",
        "It does not measure loudness, calibrated sound pressure, intelligibility, SNR or hardware quality.",
        "Real recordings require acquisition controls, appropriate frequency analysis and uncertainty checks.",
        "The coherent-bin assumptions here do not transfer automatically to arbitrary recordings.",
        "",
        "Portfolio: https://zafar-ahmad-5359.github.io/audio.html#acoustic-comparison",
        "Contact: ahmadzafar577@gmail.com",
    ))
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=Path("demo-output"))
    output_dir = parser.parse_args().output_dir
    output_dir.mkdir(parents=True, exist_ok=True)
    results = []
    for identifier, name, amplitudes in CONDITIONS:
        rms, dbfs, share, peak = analyse(amplitudes)
        results.append(dict(id=identifier, name=name, amplitudes=amplitudes,
                            rms=rms, dbfs=dbfs, share=share, peak=peak))
    columns = ("condition_id", "condition", "sample_rate_hz", "duration_s", "samples",
               "amplitude_100_hz", "amplitude_1000_hz", "amplitude_3000_hz", "rms",
               "rms_level_dbfs", "power_100_hz_percent", "peak_absolute_amplitude")
    with (output_dir / "recording-comparison-demo.csv").open("w", encoding="utf-8", newline="") as stream:
        writer = csv.writer(stream, lineterminator="\n")
        writer.writerow(columns)
        for item in results:
            writer.writerow((item["id"], item["name"], SAMPLE_RATE_HZ, DURATION_S,
                             SAMPLE_RATE_HZ * DURATION_S,
                             *(f"{amp:.2f}" for amp in item["amplitudes"]),
                             f'{item["rms"]:.9f}', f'{item["dbfs"]:.9f}',
                             f'{item["share"]:.9f}', f'{item["peak"]:.9f}'))
    svg = make_svg(results)
    for filename, content in (("recording-comparison-demo.svg", svg),
                              ("recording-comparison-demo.txt", make_report(results))):
        with (output_dir / filename).open("w", encoding="utf-8", newline="\n") as stream:
            stream.write(content)
    print(f"Wrote four-condition CSV, SVG and methods report to {output_dir.resolve()}")


if __name__ == "__main__":
    main()
