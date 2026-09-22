/**
 * How long an upload will take.
 *
 * WHAT WAS WRONG WITH THE ORIGINAL (CourseForm's speed test)
 *
 * 1. The test payloads were 1 KB, 5 KB and 10 KB. A request that small is over
 *    in a single round trip, so what it timed was latency, not bandwidth —
 *    sending 10 KB takes about as long as sending 1 KB. The number it produced
 *    had almost no relationship to the connection's actual speed.
 *
 * 2. On top of that came:
 *        // Fix decimal point error - divide by 10 to get correct speed
 *        const correctedSpeedMbps = speedMbps / 10;
 *    The arithmetic above that line was already right (MB/s x 8 = Mbps). There
 *    was no decimal point error; dividing by ten simply made every estimate ten
 *    times longer. It looks like someone saw an implausible number from problem
 *    1 and corrected the symptom instead of the cause.
 *
 * 3. The raw division ignored protocol overhead, so even a correct speed
 *    reading would have under-estimated a real upload.
 *
 * WHAT THIS DOES INSTEAD
 * Sends payloads big enough to actually occupy the connection, times only the
 * transfer, drops the slowest sample (a first request pays TCP slow-start and
 * TLS setup), and applies a stated overhead factor rather than pretending the
 * wire is perfectly efficient.
 */

/** Multipart framing, TCP/TLS overhead and the server writing to R2.
 *  Measured uploads land consistently slower than raw size ÷ bandwidth; 1.15
 *  keeps the estimate honest rather than flattering. */
const OVERHEAD = 1.15;

/** Big enough that transfer time dominates latency on a slow connection,
 *  small enough not to be rude on a metered one. */
const PROBE_SIZES_MB = [1, 2, 2];

export interface SpeedSample {
  mbps: number;
  samples: number;
}

/**
 * Measure upload bandwidth in Mbps.
 * @param onProgress reports which probe is running, for a status line.
 */
export async function measureUploadSpeedMbps(
  onProgress?: (message: string) => void
): Promise<SpeedSample> {
  const results: number[] = [];

  for (let i = 0; i < PROBE_SIZES_MB.length; i++) {
    const sizeMB = PROBE_SIZES_MB[i];
    onProgress?.(`قياس السرعة… (${i + 1}/${PROBE_SIZES_MB.length})`);

    // Random bytes, not a repeated character: 'A'.repeat(...) compresses to
    // almost nothing in transit, so a compressing proxy would report a speed
    // the real video upload could never reach.
    const bytes = new Uint8Array(sizeMB * 1024 * 1024);
    for (let j = 0; j < bytes.length; j += 4096) {
      bytes[j] = Math.floor(Math.random() * 256);
    }

    const form = new FormData();
    form.append('file', new File([bytes], `probe-${sizeMB}mb.bin`, { type: 'application/octet-stream' }));

    const started = performance.now();
    try {
      const res = await fetch('/api/upload-test', { method: 'POST', body: form });
      if (!res.ok) continue;
      await res.arrayBuffer(); // wait for the response to land, not just headers
      const seconds = (performance.now() - started) / 1000;
      if (seconds <= 0) continue;
      results.push((sizeMB * 8) / seconds); // MB -> megabits, per second
    } catch {
      // one failed probe should not abandon the measurement
    }
  }

  if (results.length === 0) {
    throw new Error('تعذّر قياس سرعة الرفع');
  }

  // The first probe carries connection setup. With three or more samples the
  // slowest one is dropped; below that, keep everything.
  const usable = results.length >= 3
    ? results.slice().sort((a, b) => b - a).slice(0, results.length - 1)
    : results;

  return {
    mbps: usable.reduce((a, b) => a + b, 0) / usable.length,
    samples: results.length,
  };
}

/** Seconds an upload of `bytes` should take at `mbps`, overhead included. */
export function estimateSeconds(bytes: number, mbps: number): number | null {
  if (!bytes || !mbps || mbps <= 0 || !Number.isFinite(mbps)) return null;
  const megabits = (bytes * 8) / (1024 * 1024);
  return (megabits / mbps) * OVERHEAD;
}

/** A duration a person can read, in Arabic. */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '';
  if (seconds < 10) return 'أقل من 10 ثوانٍ';
  if (seconds < 60) return `${Math.ceil(seconds / 5) * 5} ثانية`;

  const mins = Math.round(seconds / 60);
  if (mins < 60) return mins === 1 ? 'دقيقة واحدة' : mins === 2 ? 'دقيقتان' : `${mins} دقيقة`;

  const hours = Math.floor(seconds / 3600);
  const rem = Math.round((seconds % 3600) / 60);
  const h = hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتان' : `${hours} ساعات`;
  return rem > 0 ? `${h} و${rem} دقيقة` : h;
}

/** Total bytes across a set of picked files. */
export function totalBytes(files: (File | null | undefined)[]): number {
  return files.reduce<number>((sum, f) => sum + (f ? f.size : 0), 0);
}

/** Human-readable size. */
export function formatSize(bytes: number): string {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}
